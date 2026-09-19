/**
 * lib/scanner/intelligence/index.js
 *
 * SecretShield Detection Intelligence Layer Entry Point.
 */

export { detectLanguage } from './language-detector.js';
export { evaluateEntropy, calculateShannonEntropy, analyzeCharset } from './entropy-engine.js';
export { extractLanguageContext, analyzeContextSignals, SECRET_KEYWORDS } from './context-engine.js';
export { analyzeFalsePositive, isSuppressed } from './false-positive-engine.js';
export { calculateConfidence, scoreToSeverity } from './confidence-engine.js';
export { groupSimilarFindings, areSimilarFindings } from './similarity.js';
export { generateQuickFix } from './quick-fixes.js';
