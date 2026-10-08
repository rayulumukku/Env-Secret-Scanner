import { isSupportedMetric } from './metrics.js';
import { isSupportedDimension } from './dimensions.js';
import { validateScopedQuery } from './permissions.js';

export function buildSecurityQuery({
  organizationId,
  projectId = null,
  repositoryId = null,
  metric = 'open_findings',
  dimension = 'date',
  rangeDays = 30,
  page = 1,
  pageSize = 50,
  timeoutMs = 3000,
}) {
  const errors = [];

  if (!organizationId) errors.push('organizationId is required');
  if (!isSupportedMetric(metric)) errors.push(`unsupported metric: ${metric}`);
  if (!isSupportedDimension(dimension)) errors.push(`unsupported dimension: ${dimension}`);
  if (rangeDays <= 0 || rangeDays > 3650) errors.push('rangeDays must be between 1 and 3650');
  if (page < 1) errors.push('page must be >= 1');
  if (pageSize < 1 || pageSize > 500) errors.push('pageSize must be between 1 and 500');
  if (timeoutMs < 100 || timeoutMs > 15000) errors.push('timeoutMs must be between 100 and 15000');

  const access = validateScopedQuery({ organizationId, projectId, repositoryId });
  if (!access.allowed) errors.push(access.reason);

  return {
    organizationId,
    projectId,
    repositoryId,
    metric,
    dimension,
    rangeDays,
    page,
    pageSize,
    timeoutMs,
    errors,
    valid: errors.length === 0,
    scoped: true,
  };
}
