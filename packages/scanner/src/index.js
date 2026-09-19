/**
 * @secretshield/scanner — Public Package Entry Point
 *
 * Deterministic, privacy-first secret scanner engine for developers.
 * Pure Node.js / JavaScript with zero dependencies on React, Next.js, or cloud AI services.
 */

// High-level public APIs
export {
  scanText,
  scanFile,
  scanFiles,
  scanDirectory,
  scanGitDiff,
} from './api.js';

// Core engine methods
export {
  scan,
  scanSync,
  detectInContent,
} from './engine.js';

// Rules & Catalog
export {
  ALL_RULES,
  getRuleById,
  getRulesByCategory,
} from './rules/index.js';

// Detection Intelligence & Entropy
export {
  shannonEntropy,
  isHighEntropySecret,
  isBase64,
  isHex,
} from './entropy.js';

export {
  computeConfidence,
  scoreToSeverity,
} from './confidence.js';

export {
  maskSecret,
  maskAllInString,
} from './masking.js';

export {
  createFingerprint,
  deduplicateFindings,
} from './fingerprint.js';

export {
  shouldScanFile,
  isBinaryContent,
} from './file-filter.js';

export {
  isPlaceholder,
  extractContext,
} from './context.js';

export {
  validateRegexSafety,
} from './regex-safety.js';

export {
  detectLanguage,
} from './intelligence/language-detector.js';

export {
  generateQuickFix,
} from './intelligence/quick-fixes.js';
