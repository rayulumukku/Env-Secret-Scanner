/**
 * lib/providers/common/repository-events.js
 *
 * Unified internal event model normalizing events from GitHub and GitLab.
 */

/**
 * Normalize a GitHub webhook event into internal representation.
 *
 * @param {string} eventName
 * @param {object} payload
 * @returns {object|null}
 */
export function normalizeGitHubEvent(eventName, payload) {
  const repo = payload.repository;
  if (!repo && eventName !== 'installation') return null;

  const base = {
    provider: 'github',
    repositoryId: repo?.id ? String(repo.id) : null,
    repositoryFullName: repo?.full_name || '',
    repositoryName: repo?.name || '',
    owner: repo?.owner?.login || '',
    installationId: payload.installation?.id ? String(payload.installation.id) : null,
    author: payload.sender?.login || 'unknown',
  };

  if (eventName === 'push') {
    const branch = (payload.ref || '').replace(/^refs\/heads\//, '');
    const commit = payload.after || payload.head_commit?.id || '';
    const baseCommit = payload.before || null;

    // Collect all changed files across commits
    const changedFilesMap = new Map();
    (payload.commits || []).forEach(c => {
      (c.added || []).forEach(f => changedFilesMap.set(f, { filename: f, status: 'added' }));
      (c.modified || []).forEach(f => changedFilesMap.set(f, { filename: f, status: 'modified' }));
      (c.removed || []).forEach(f => changedFilesMap.set(f, { filename: f, status: 'removed' }));
    });

    return {
      ...base,
      eventType: 'push',
      branch,
      commit,
      baseCommit,
      headCommitMessage: payload.head_commit?.message || '',
      changedFiles: Array.from(changedFilesMap.values()),
      pullRequestId: null,
      pullRequestNumber: null,
      pullRequestTitle: null,
    };
  }

  if (eventName === 'pull_request') {
    const pr = payload.pull_request;
    if (!pr) return null;

    return {
      ...base,
      eventType: 'pull_request',
      action: payload.action, // 'opened', 'synchronize', 'reopened', 'closed'
      branch: pr.head?.ref || '',
      targetBranch: pr.base?.ref || '',
      commit: pr.head?.sha || '',
      baseCommit: pr.base?.sha || '',
      pullRequestId: String(pr.id),
      pullRequestNumber: pr.number,
      pullRequestTitle: pr.title || '',
      author: pr.user?.login || payload.sender?.login || 'unknown',
      changedFiles: [], // will be populated via PR files API
    };
  }

  if (eventName === 'installation' || eventName === 'installation_repositories') {
    return {
      ...base,
      eventType: 'installation',
      action: payload.action,
      repositories: (payload.repositories || payload.repositories_added || []).map(r => ({
        id: String(r.id),
        name: r.name,
        fullName: r.full_name,
        isPrivate: r.private,
      })),
      removedRepositories: (payload.repositories_removed || []).map(r => ({
        id: String(r.id),
        name: r.name,
        fullName: r.full_name,
      })),
    };
  }

  return null;
}

/**
 * Normalize a GitLab webhook event into internal representation.
 *
 * @param {string} eventHeader - X-Gitlab-Event
 * @param {object} payload
 * @returns {object|null}
 */
export function normalizeGitLabEvent(eventHeader, payload) {
  const project = payload.project;
  if (!project) return null;

  const base = {
    provider: 'gitlab',
    repositoryId: project.id ? String(project.id) : null,
    repositoryFullName: project.path_with_namespace || '',
    repositoryName: project.name || '',
    owner: project.namespace || '',
    installationId: null,
    author: payload.user_username || payload.user_name || 'unknown',
  };

  const objectKind = payload.object_kind || eventHeader?.toLowerCase();

  if (objectKind === 'push' || eventHeader === 'Push Hook') {
    const branch = (payload.ref || '').replace(/^refs\/heads\//, '');
    const commit = payload.after || payload.checkout_sha || '';
    const baseCommit = payload.before || null;

    const changedFilesMap = new Map();
    (payload.commits || []).forEach(c => {
      (c.added || []).forEach(f => changedFilesMap.set(f, { filename: f, status: 'added' }));
      (c.modified || []).forEach(f => changedFilesMap.set(f, { filename: f, status: 'modified' }));
      (c.removed || []).forEach(f => changedFilesMap.set(f, { filename: f, status: 'removed' }));
    });

    return {
      ...base,
      eventType: 'push',
      branch,
      commit,
      baseCommit,
      headCommitMessage: payload.commits?.[payload.commits.length - 1]?.message || '',
      changedFiles: Array.from(changedFilesMap.values()),
      pullRequestId: null,
      pullRequestNumber: null,
      pullRequestTitle: null,
    };
  }

  if (objectKind === 'merge_request' || eventHeader === 'Merge Request Hook') {
    const mr = payload.object_attributes;
    if (!mr) return null;

    return {
      ...base,
      eventType: 'pull_request',
      action: mr.action || 'synchronize',
      branch: mr.source_branch || '',
      targetBranch: mr.target_branch || '',
      commit: mr.last_commit?.id || payload.checkout_sha || '',
      baseCommit: mr.target?.default_branch || '',
      pullRequestId: String(mr.id),
      pullRequestNumber: mr.iid,
      pullRequestTitle: mr.title || '',
      author: payload.user?.username || mr.author_id || 'unknown',
      changedFiles: [],
    };
  }

  return null;
}
