/**
 * rules/database.js — Database connection string / URL detection.
 * Detects: PostgreSQL, MySQL, MongoDB, Redis, MSSQL, connection strings with credentials.
 */

export const RULES = [
  {
    id: 'DATABASE_POSTGRES_URL',
    name: 'PostgreSQL Connection URL',
    type: 'DATABASE_POSTGRES_URL',
    category: 'Database Credentials',
    // postgresql://user:password@host/db
    pattern: /postgres(?:ql)?:\/\/[^:@\s]+:[^@\s]{3,}@[^\s"']+/gi,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 15, showSuffix: 4 },
    description: 'PostgreSQL connection URL with embedded credentials.',
    remediation: 'Move to environment variables. Rotate the database password immediately.',
  },
  {
    id: 'DATABASE_MYSQL_URL',
    name: 'MySQL Connection URL',
    type: 'DATABASE_MYSQL_URL',
    category: 'Database Credentials',
    pattern: /mysql(?:2)?:\/\/[^:@\s]+:[^@\s]{3,}@[^\s"']+/gi,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 12, showSuffix: 4 },
    description: 'MySQL connection URL with embedded credentials.',
    remediation: 'Move to environment variables. Rotate the database password.',
  },
  {
    id: 'DATABASE_MONGODB_URL',
    name: 'MongoDB Connection URL',
    type: 'DATABASE_MONGODB_URL',
    category: 'Database Credentials',
    pattern: /mongodb(?:\+srv)?:\/\/[^:@\s]+:[^@\s]{3,}@[^\s"']+/gi,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 14, showSuffix: 4 },
    description: 'MongoDB connection URL with embedded credentials.',
    remediation: 'Move to environment variables. Rotate MongoDB Atlas or self-hosted credentials.',
  },
  {
    id: 'DATABASE_REDIS_URL',
    name: 'Redis Connection URL',
    type: 'DATABASE_REDIS_URL',
    category: 'Database Credentials',
    // redis://:password@host or redis://user:password@host
    pattern: /redis(?:s)?:\/\/(?:[^:@\s]+:)?[^@\s]{3,}@[^\s"']+/gi,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 10, showSuffix: 4 },
    description: 'Redis connection URL with embedded password.',
    remediation: 'Move to environment variables. Rotate the Redis password.',
  },
  {
    id: 'DATABASE_MSSQL_URL',
    name: 'MSSQL Connection String',
    type: 'DATABASE_MSSQL_URL',
    category: 'Database Credentials',
    pattern: /(?:mssql|sqlserver):\/\/[^:@\s]+:[^@\s]{3,}@[^\s"']+/gi,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 12, showSuffix: 4 },
    description: 'Microsoft SQL Server connection string with embedded credentials.',
    remediation: 'Move to environment variables. Rotate SQL Server credentials.',
  },
  {
    id: 'DATABASE_GENERIC_PASSWORD',
    name: 'Database Password Assignment',
    type: 'DATABASE_GENERIC_PASSWORD',
    category: 'Database Credentials',
    // DB_PASSWORD = "something" or db-password: "something"
    pattern: /(?:db[_\-]?password|database[_\-]?password|db[_\-]?pass(?:word)?)\s*[=:]\s*["']([^"'\s]{6,})["']/gi,
    captureGroup: 1,
    severity: 'CRITICAL',
    isProviderRule: false,
    entropyThreshold: 2.5,
    maskOptions: { showPrefix: 4, showSuffix: 4 },
    description: 'Database password assigned in source code.',
    remediation: 'Move to environment variables or secrets manager. Rotate the password.',
  },
];

export { RULES as rules };
