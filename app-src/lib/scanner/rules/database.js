/**
 * Database connection string and credential detection rules.
 */

import { maskSecret } from '../masking.js';

const DATABASE_RULES = [
  {
    name: 'PostgreSQL Connection String',
    type: 'DATABASE_POSTGRES',
    category: 'Database Credentials',
    pattern: /postgres(?:ql)?:\/\/[^:]+:[^@\s'"]+@[^\s'"]+/gi,
    severity: 'CRITICAL',
    confidence: 95,
    description: 'PostgreSQL connection string with credentials detected.',
    remediation: 'Rotate database password immediately. Use environment variables or a secrets manager.',
  },
  {
    name: 'MySQL Connection String',
    type: 'DATABASE_MYSQL',
    category: 'Database Credentials',
    pattern: /mysql(?:2)?:\/\/[^:]+:[^@\s'"]+@[^\s'"]+/gi,
    severity: 'CRITICAL',
    confidence: 95,
    description: 'MySQL connection string with credentials detected.',
    remediation: 'Rotate database password. Audit database access logs for unauthorized queries.',
  },
  {
    name: 'MongoDB Connection String',
    type: 'DATABASE_MONGODB',
    category: 'Database Credentials',
    pattern: /mongodb(?:\+srv)?:\/\/[^:]+:[^@\s'"]+@[^\s'"]+/gi,
    severity: 'CRITICAL',
    confidence: 95,
    description: 'MongoDB connection string with credentials detected.',
    remediation: 'Rotate credentials in MongoDB Atlas/console. Check for unauthorized database access.',
  },
  {
    name: 'Redis Connection String',
    type: 'DATABASE_REDIS',
    category: 'Database Credentials',
    pattern: /redis(?:s)?:\/\/[^:]*:[^@\s'"]+@[^\s'"]+/gi,
    severity: 'HIGH',
    confidence: 90,
    description: 'Redis connection string with password detected.',
    remediation: 'Rotate the Redis AUTH password. Redis exposure can lead to data theft or server compromise.',
  },
  {
    name: 'SQL Server Connection String',
    type: 'DATABASE_MSSQL',
    category: 'Database Credentials',
    pattern: /(?:Server|Data Source)\s*=\s*[^;]+;\s*(?:Database|Initial Catalog)\s*=\s*[^;]+;\s*(?:User Id|UID)\s*=\s*[^;]+;\s*Password\s*=\s*([^;'"]+)/gi,
    severity: 'CRITICAL',
    confidence: 88,
    description: 'SQL Server connection string with credentials detected.',
    remediation: 'Rotate SQL Server credentials. Use Windows Authentication where possible.',
    captureGroup: 1,
  },
  {
    name: 'Generic Database URL',
    type: 'DATABASE_URL_GENERIC',
    category: 'Database Credentials',
    // Catches things like DATABASE_URL=something with credentials
    pattern: /(?:DATABASE_URL|DB_URL|DATABASE_URI|DB_URI|CONNECTION_STRING)\s*[=:]\s*["']?[a-z]+:\/\/[^:]+:[^@\s'"]{4,}@[^\s'"]+["']?/gi,
    severity: 'CRITICAL',
    confidence: 85,
    description: 'Database URL environment variable with embedded credentials detected.',
    remediation: 'Never embed credentials in URLs. Use environment variables with a secrets manager.',
  },
];

/**
 * Detect database credentials in file content.
 *
 * @param {string} content
 * @param {string} filename
 * @returns {object[]}
 */
export function detect(content, filename) {
  const findings = [];
  const lines = content.split('\n');

  for (const rule of DATABASE_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = regex.exec(content)) !== null) {
      const rawValue = match[0];

      const upToMatch = content.slice(0, match.index);
      const line = upToMatch.split('\n').length;
      const lastNewline = upToMatch.lastIndexOf('\n');
      const column = match.index - lastNewline;

      // For connection strings, mask the password portion
      // Pattern: protocol://user:PASSWORD@host/db
      const maskedValue = rawValue.replace(/:([^@]{4,})@/, ':••••••••@');

      findings.push({
        type: rule.type,
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        line,
        column,
        file: filename,
        maskedValue: maskedValue.length > 80 ? maskedValue.slice(0, 77) + '...' : maskedValue,
        description: rule.description,
        remediation: rule.remediation,
        lineContent: lines[line - 1] || '',
      });
    }
  }

  return findings;
}
