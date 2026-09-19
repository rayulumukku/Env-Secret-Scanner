/**
 * lib/jobs/index.js
 *
 * Job queue initializer and handler registrations.
 */

import { registerJobHandler, enqueueJob, getJob, JobStatus, resetJobQueue } from './queue.js';
import { executeScannerJob } from './scanner-job.js';
import { executeGitHubCheckJob } from './github-check-job.js';
import { executeNotificationJob } from './notification-job.js';

// Register standard job handlers
registerJobHandler('SCAN_EVENT', executeScannerJob);
registerJobHandler('GITHUB_CHECK', executeGitHubCheckJob);
registerJobHandler('NOTIFICATIONS', executeNotificationJob);

export {
  registerJobHandler,
  enqueueJob,
  getJob,
  JobStatus,
  resetJobQueue,
  executeScannerJob,
  executeGitHubCheckJob,
  executeNotificationJob,
};
