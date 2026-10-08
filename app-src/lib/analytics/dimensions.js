export const SUPPORTED_DIMENSIONS = Object.freeze([
  'organizationId',
  'projectId',
  'repositoryId',
  'environment',
  'rule',
  'package',
  'provider',
  'severity',
  'date',
  'eventType',
]);

export function isSupportedDimension(dimension) {
  return SUPPORTED_DIMENSIONS.includes(dimension);
}
