/**
 * packages/dependency-engine/src/sarif/index.js
 *
 * SARIF 2.1.0 Exporter for Dependency Vulnerability Findings.
 * Formats findings for GitHub Code Scanning and enterprise SAST/SCA ingestors.
 *
 * SECURITY INVARIANTS:
 * - NEVER includes secret credentials.
 * - Adheres strictly to OASIS SARIF 2.1.0 schema specification.
 */

/**
 * Maps SecretShield severity to SARIF level string.
 * @param {string} severity
 * @returns {'error'|'warning'|'note'}
 */
export function mapSeverityToSarifLevel(severity) {
  const s = String(severity || '').toUpperCase();
  if (s === 'CRITICAL' || s === 'HIGH') return 'error';
  if (s === 'MEDIUM') return 'warning';
  return 'note';
}

/**
 * Generates SARIF 2.1.0 representation from DEPENDENCY_VULNERABILITY findings.
 *
 * @param {Array<object>} findings - List of dependency vulnerability findings
 * @param {object} [metadata={}] - Scanner context metadata
 * @returns {object} SARIF 2.1.0 JSON object
 */
export function generateDependencySarif(findings = [], metadata = {}) {
  const rulesMap = new Map();

  // Deduplicate and define rules
  for (const f of findings) {
    const ruleId = f.advisoryId || f.ruleId || 'DEP-VULN';
    if (!rulesMap.has(ruleId)) {
      rulesMap.set(ruleId, {
        id: ruleId,
        name: `DependencyVulnerability_${f.package || 'unknown'}`,
        shortDescription: {
          text: f.summary || `Vulnerability in package ${f.package}`
        },
        fullDescription: {
          text: f.description || f.summary || `Known security advisory affecting ${f.package}@${f.installedVersion}.`
        },
        defaultConfiguration: {
          level: mapSeverityToSarifLevel(f.severity)
        },
        help: {
          text: f.remediation?.upgradeGuidance || `Upgrade ${f.package} to ${f.fixedVersion || 'latest'}.`,
          markdown: `### Remediation\n${f.remediation?.upgradeGuidance || 'Upgrade package.'}\n\n**Advisory**: [${f.advisoryId}](${f.references?.[0] || 'https://secretshield.dev'})`
        },
        properties: {
          cve: f.cveId || null,
          severity: f.severity,
          ecosystem: f.ecosystem,
        }
      });
    }
  }

  const results = findings.map(f => {
    const ruleId = f.advisoryId || f.ruleId || 'DEP-VULN';
    const filePath = f.evidence?.manifestPath || f.evidence?.lockfilePath || 'package.json';

    return {
      ruleId,
      level: mapSeverityToSarifLevel(f.severity),
      message: {
        text: `Vulnerable dependency ${f.package}@${f.installedVersion} (${f.severity}) satisfies affected range ${f.affectedRange}. ${f.summary || ''}`
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: filePath,
              uriBaseId: '%SRCROOT%'
            },
            region: {
              startLine: 1,
              startColumn: 1
            }
          }
        }
      ],
      properties: {
        package: f.package,
        installedVersion: f.installedVersion,
        fixedVersion: f.fixedVersion,
        affectedRange: f.affectedRange,
        isDirect: f.isDirect,
        dependencyPath: f.dependencyPath,
        reachabilityStatus: f.reachabilityStatus,
        evidence: f.evidence,
      }
    };
  });

  return {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'SecretShield Dependency Intelligence',
            version: '2.0.0',
            informationUri: 'https://secretshield.dev/docs/dependencies',
            rules: Array.from(rulesMap.values())
          }
        },
        results
      }
    ]
  };
}
