/**
 * lib/jobs/scanner-job.js
 *
 * Background job handler for scanning GitHub/GitLab pushes and Pull Requests.
 */

import { scanString } from '../scanner/engine.js';
import { scanCommitDiff } from '../repository/commit-scanner.js';
import { getFileContent } from '../providers/github/contents.js';
import { listPullRequestFiles } from '../providers/github/pull-requests.js';
import { getInstallationCommitDiff } from '../providers/github/commits.js';
import { createScan, updateScan } from '../db/scans.js';
import { saveFindings } from '../db/findings.js';
import { savePullRequestScan } from '../db/pull-requests.js';
import { recordActivity, ActivityType } from '../db/activity.js';
import { enqueueJob } from './queue.js';
import { getProjectById } from '../db/projects.js';

/**
 * Scan changed files for a push or pull request.
 *
 * @param {object} payload - Normalized repository event + project metadata
 */
export async function executeScannerJob(payload) {
  const { event, projectId, repositoryId, installationId, organizationId } = payload;
  const project = await getProjectById(projectId);
  const threshold = project?.severityThreshold || 'LOW';

  const startTime = Date.now();
  const scanRecord = await createScan({
    projectId,
    repositoryId,
    mode: event.eventType === 'pull_request' ? 'CURRENT' : 'CURRENT',
    branch: event.branch,
    commitHash: event.commit,
  });

  await recordActivity({
    projectId,
    organizationId,
    type: ActivityType.SCAN_STARTED,
    title: `Scan started on ${event.branch || 'branch'}`,
    description: `Triggered by ${event.eventType} by ${event.author || 'system'}`,
    actor: event.author || 'System',
    repositoryName: event.repositoryFullName,
  });

  const allFindings = [];
  let filesScannedCount = 0;

  try {
    if (event.eventType === 'pull_request') {
      // Pull Request scanning
      let prFiles = [];
      if (installationId && event.owner && event.repositoryName && event.pullRequestNumber) {
        try {
          prFiles = await listPullRequestFiles(
            installationId,
            event.owner,
            event.repositoryName,
            event.pullRequestNumber
          );
        } catch (err) {
          console.error(`[ScannerJob] Failed to fetch PR files: ${err.message}`);
        }
      }

      filesScannedCount = prFiles.length;

      // Scan each file's patch or full content
      for (const f of prFiles) {
        if (f.patch) {
          // Scan patch lines directly
          const patchFindings = scanCommitDiff({
            sha: event.commit,
            files: [{ filename: f.filename, patch: f.patch }],
          });
          allFindings.push(...(patchFindings || []));
        } else if (f.status !== 'removed') {
          // Fetch and scan file content
          try {
            const content = await getFileContent(
              installationId,
              event.owner,
              event.repositoryName,
              f.filename,
              event.commit
            );
            if (content) {
              const fileScan = scanString(content, f.filename);
              allFindings.push(...(fileScan.findings || []));
            }
          } catch {
            // Skip file if inaccessible
          }
        }
      }

      // Save PR scan record
      const checkConclusion = allFindings.some(f => {
        const rank = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
        return (rank[f.severity] || 1) >= (rank[threshold] || 1);
      }) ? 'failure' : 'success';

      await savePullRequestScan({
        projectId,
        repositoryId,
        pullNumber: event.pullRequestNumber,
        title: event.pullRequestTitle || `PR #${event.pullRequestNumber}`,
        author: event.author,
        branch: event.branch,
        targetBranch: event.targetBranch,
        commitHash: event.commit,
        status: 'OPEN',
        checkConclusion,
        findings: allFindings,
        filesScanned: filesScannedCount,
        scanId: scanRecord.scanId,
      });

      // Enqueue GitHub Check & PR comment job
      if (installationId) {
        await enqueueJob('GITHUB_CHECK', {
          installationId,
          owner: event.owner,
          repo: event.repositoryName,
          headSha: event.commit,
          pullNumber: event.pullRequestNumber,
          findings: allFindings,
          filesScanned: filesScannedCount,
          threshold,
          scanId: scanRecord.scanId,
          projectId,
        });
      }
    } else {
      // Push event scanning (changed files/commits)
      const changed = event.changedFiles || [];
      filesScannedCount = changed.length;

      if (installationId && event.commit && event.owner && event.repositoryName) {
        try {
          const commitDiff = await getInstallationCommitDiff(
            installationId,
            event.owner,
            event.repositoryName,
            event.commit
          );

          if (commitDiff?.files) {
            filesScannedCount = commitDiff.files.length;
            const patchFindings = scanCommitDiff(commitDiff);
            allFindings.push(...(patchFindings || []));
          }
        } catch (err) {
          console.error(`[ScannerJob] Failed to get commit diff: ${err.message}`);
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const criticalCount = allFindings.filter(f => f.severity === 'CRITICAL').length;
    const highCount = allFindings.filter(f => f.severity === 'HIGH').length;
    const mediumCount = allFindings.filter(f => f.severity === 'MEDIUM').length;
    const lowCount = allFindings.filter(f => f.severity === 'LOW').length;

    // Update scan status
    await updateScan(scanRecord.scanId, {
      status: 'COMPLETED',
      durationMs,
      filesScanned: filesScannedCount,
      totalFindings: allFindings.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
    });

    // Persist findings in DB
    if (allFindings.length > 0) {
      await saveFindings(scanRecord.scanId, projectId, repositoryId, allFindings);
    }

    // Record activity
    await recordActivity({
      projectId,
      organizationId,
      type: allFindings.length > 0 ? ActivityType.CRITICAL_FINDING : ActivityType.SCAN_COMPLETED,
      title: allFindings.length > 0
        ? `${allFindings.length} secret(s) detected on ${event.branch}`
        : `Clean scan completed on ${event.branch}`,
      description: `Scanned ${filesScannedCount} files in ${durationMs}ms`,
      actor: event.author || 'System',
      repositoryName: event.repositoryFullName,
    });

    // Enqueue notifications job (Slack, Webhooks, In-App alerts)
    await enqueueJob('NOTIFICATIONS', {
      organizationId,
      projectId,
      repositoryName: event.repositoryFullName,
      branch: event.branch,
      author: event.author,
      findings: allFindings,
      filesScanned: filesScannedCount,
      scanId: scanRecord.scanId,
    });

    return {
      scanId: scanRecord.scanId,
      findingsCount: allFindings.length,
      filesScanned: filesScannedCount,
      durationMs,
    };
  } catch (err) {
    console.error('[ScannerJob] Scan failure:', err);
    await updateScan(scanRecord.scanId, {
      status: 'FAILED',
      errorMessage: err.message,
    });
    throw err;
  }
}
