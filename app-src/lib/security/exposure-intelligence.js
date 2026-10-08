const SEVERITY_WEIGHT = {
  LOW: 6,
  MEDIUM: 12,
  HIGH: 18,
  CRITICAL: 24,
};

export class ExposureIntelligenceEngine {
  constructor({ organizationId = 'default' } = {}) {
    this.organizationId = organizationId;
  }

  calculateExposureScore({
    secretSeverity = 'HIGH',
    assetCriticality = 50,
    isPublic = false,
    runtimeExposure = false,
    cloudExposure = false,
    threatCorrelation = 0,
    exposureDurationDays = 0,
    deploymentStatus = 'STAGING',
    recurrence = 0,
  }) {
    const severityWeight = SEVERITY_WEIGHT[String(secretSeverity).toUpperCase()] ?? 12;
    const assetWeight = Number(assetCriticality) * 0.18;
    const publicWeight = isPublic ? 17 : 0;
    const runtimeWeight = runtimeExposure ? 8 : 0;
    const cloudWeight = cloudExposure ? 7 : 0;
    const threatWeight = Number(threatCorrelation || 0) * 9;
    const durationWeight = Math.min(Number(exposureDurationDays || 0), 30) * 0.1;
    const deployWeight = deploymentStatus === 'PRODUCTION' ? 8 : deploymentStatus === 'STAGING' ? 3 : 1;
    const recurrenceWeight = Number(recurrence || 0) * 2;

    const raw = severityWeight + assetWeight + publicWeight + runtimeWeight + cloudWeight + threatWeight + durationWeight + deployWeight + recurrenceWeight;
    const score = Math.min(100, Math.round(raw));
    const level = score >= 90 ? 'CRITICAL' : score >= 75 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW';

    return {
      score,
      level,
      explanation: `Exposure score derived from secret severity ${secretSeverity}, asset criticality ${assetCriticality}, public exposure ${Boolean(isPublic)}, runtime exposure ${Boolean(runtimeExposure)}, cloud exposure ${Boolean(cloudExposure)}, threat correlation ${Number(threatCorrelation || 0).toFixed(2)}, and recurrence ${Number(recurrence || 0)}.`,
    };
  }
}

export const exposureIntelligenceEngine = new ExposureIntelligenceEngine({ organizationId: 'default' });
