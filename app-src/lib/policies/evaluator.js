/**
 * @file lib/policies/evaluator.js
 * @description Evaluates policy conditions against finding, scan, repository, and PR payloads.
 * 
 * FACTUAL & DETERMINISTIC EVALUATION:
 *   - Strictly evaluates documented fields against specified criteria.
 *   - AND logic: All conditions in a policy must match for the policy to trigger.
 *   - NEVER displays or formats raw secrets in explanations.
 */

import { ConditionField, ConditionOperator } from './schemas.js';

const SEVERITY_RANKS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

/**
 * Extracts the target field value from a context object (finding / scan / repo / PR).
 * 
 * @param {string} field 
 * @param {Object} context 
 * @returns {any}
 */
export function extractFieldValue(field, context = {}) {
  const finding = context.finding || context;
  const scan = context.scan || {};
  const repository = context.repository || {};
  const pr = context.pr || {};

  switch (field) {
    case ConditionField.SEVERITY:
      return String(finding.severity || 'LOW').toUpperCase();

    case ConditionField.CONFIDENCE:
      return Number(finding.confidence || 0);

    case ConditionField.FINDING_STATUS:
      return String(finding.status || 'OPEN').toUpperCase();

    case ConditionField.REPOSITORY:
      return finding.repositoryName || finding.repository || repository.name || repository.fullName || '';

    case ConditionField.PROJECT:
      return repository.projectName || repository.projectId || context.project || '';

    case ConditionField.BRANCH:
      return finding.branch || scan.branch || pr.targetBranch || pr.branch || repository.defaultBranch || 'main';

    case ConditionField.FILE_PATTERN:
      return finding.file || finding.filePath || '';

    case ConditionField.RULE_ID:
      return finding.ruleId || finding.type || '';

    case ConditionField.SCAN_TYPE:
      return String(scan.type || scan.mode || context.scanType || 'STANDARD').toUpperCase();

    case ConditionField.REPOSITORY_VISIBILITY:
      return repository.isPrivate ? 'PRIVATE' : 'PUBLIC';

    case ConditionField.LAST_SCAN_AGE_HOURS: {
      const lastScan = repository.lastScanned || scan.timestamp;
      if (!lastScan) return 999999;
      const diffMs = Date.now() - new Date(lastScan).getTime();
      return Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
    }

    case ConditionField.HISTORY_SCAN_STATUS:
      return repository.hasHistoryScanned ? 'SCANNED' : 'NOT_SCANNED';

    case ConditionField.CI_STATUS:
      return repository.ciEnabled || repository.githubActions ? 'PROTECTED' : 'UNPROTECTED';

    default:
      return finding[field] ?? scan[field] ?? repository[field] ?? null;
  }
}

/**
 * Evaluates a single condition predicate against an observed value.
 * 
 * @param {Object} condition 
 * @param {any} observedValue 
 * @returns {boolean}
 */
export function evaluateConditionPredicate(condition, observedValue) {
  const { field, operator, value } = condition;
  if (observedValue === undefined || observedValue === null) return false;

  // Severity Hierarchy comparison
  if (field === ConditionField.SEVERITY) {
    const obsRank = SEVERITY_RANKS[String(observedValue).toUpperCase()] || 0;
    const expRank = SEVERITY_RANKS[String(value).toUpperCase()] || 0;

    switch (operator) {
      case ConditionOperator.EQUALS:
        return obsRank === expRank;
      case ConditionOperator.NOT_EQUALS:
        return obsRank !== expRank;
      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return obsRank >= expRank;
      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return obsRank <= expRank;
      case ConditionOperator.IN:
        return Array.isArray(value) && value.map(v => String(v).toUpperCase()).includes(String(observedValue).toUpperCase());
      case ConditionOperator.NOT_IN:
        return Array.isArray(value) && !value.map(v => String(v).toUpperCase()).includes(String(observedValue).toUpperCase());
      default:
        return false;
    }
  }

  // Numeric comparisons (confidence, lastScanAgeHours)
  if (field === ConditionField.CONFIDENCE || field === ConditionField.LAST_SCAN_AGE_HOURS) {
    const obsNum = Number(observedValue);
    const expNum = Number(value);

    switch (operator) {
      case ConditionOperator.EQUALS:
        return obsNum === expNum;
      case ConditionOperator.NOT_EQUALS:
        return obsNum !== expNum;
      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return obsNum >= expNum;
      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return obsNum <= expNum;
      default:
        return false;
    }
  }

  // File Pattern Glob / Regex / Substring Match
  if (field === ConditionField.FILE_PATTERN) {
    const strObs = String(observedValue).toLowerCase();
    const strPattern = String(value).toLowerCase();

    if (operator === ConditionOperator.MATCHES_PATTERN || operator === ConditionOperator.EQUALS) {
      if (strPattern.includes('*')) {
        let p = strPattern.startsWith('*') && !strPattern.startsWith('**')
          ? '**/' + strPattern
          : strPattern;
        p = p.replace(/\./g, '\\.')
             .replace(/\*\*\//g, '___GLOB_STAR_SLASH___')
             .replace(/\*\*/g, '___GLOB_STAR_STAR___')
             .replace(/\*/g, '[^/]*')
             .replace(/___GLOB_STAR_SLASH___/g, '(?:.*/)?')
             .replace(/___GLOB_STAR_STAR___/g, '.*');
        return new RegExp('^' + p + '$', 'i').test(strObs);
      }
      return strObs.includes(strPattern);
    }
    if (operator === ConditionOperator.NOT_EQUALS) {
      return !strObs.includes(strPattern);
    }
  }

  // General String / Array comparisons
  const strObs = String(observedValue).toUpperCase();
  const strExp = typeof value === 'string' ? value.toUpperCase() : value;

  switch (operator) {
    case ConditionOperator.EQUALS:
      return strObs === strExp;
    case ConditionOperator.NOT_EQUALS:
      return strObs !== strExp;
    case ConditionOperator.IN:
      return Array.isArray(value) && value.map(v => String(v).toUpperCase()).includes(strObs);
    case ConditionOperator.NOT_IN:
      return Array.isArray(value) && !value.map(v => String(v).toUpperCase()).includes(strObs);
    case ConditionOperator.MATCHES_PATTERN:
      return strObs.includes(String(value).toUpperCase());
    default:
      return false;
  }
}

/**
 * Evaluates all conditions of a policy against a context (using AND logic).
 * 
 * @param {Object} policy 
 * @param {Object} context - Payload containing finding, scan, repo, PR
 * @returns {{
 *   matched: boolean,
 *   conditionEvaluations: Array<{ field: string, operator: string, expected: any, observed: any, matched: boolean }>,
 *   explanation: string
 * }}
 */
export function evaluatePolicyConditions(policy, context) {
  const conditions = policy.conditions || [];
  const evaluations = [];
  let allMatched = true;

  for (const cond of conditions) {
    const observed = extractFieldValue(cond.field, context);
    const matched = evaluateConditionPredicate(cond, observed);

    evaluations.push({
      field: cond.field,
      operator: cond.operator,
      expected: cond.value,
      observed,
      matched
    });

    if (!matched) {
      allMatched = false;
    }
  }

  const explanation = allMatched
    ? `All ${conditions.length} condition(s) matched for policy "${policy.name}".`
    : `Policy condition check failed: ${evaluations.filter(e => !e.matched).map(e => `${e.field} (observed: ${e.observed}, expected: ${e.operator} ${JSON.stringify(e.expected)})`).join('; ')}`;

  return {
    matched: allMatched,
    conditionEvaluations: evaluations,
    explanation
  };
}
