/**
 * @secretshield/scanner — Main Entry Point
 *
 * Standalone, framework-independent secret scanner engine.
 * No Next.js or React dependencies. Pure Node.js / JavaScript.
 */

export { scan, scanSync } from '../../app-src/lib/scanner/engine.js';
export { ALL_RULES, getRuleById, getRulesByCategory } from '../../app-src/lib/scanner/rules/index.js';
export { shannonEntropy, isHighEntropySecret, isBase64, isHex } from '../../app-src/lib/scanner/entropy.js';
export { maskSecret, maskAllInString } from '../../app-src/lib/scanner/masking.js';
export { createFingerprint, deduplicateFindings } from '../../app-src/lib/scanner/fingerprint.js';
export { computeConfidence, scoreToSeverity } from '../../app-src/lib/scanner/confidence.js';
export { shouldScanFile, isBinaryContent } from '../../app-src/lib/scanner/file-filter.js';
export { isPlaceholder, extractContext } from '../../app-src/lib/scanner/context.js';
