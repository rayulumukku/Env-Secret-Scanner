/**
 * lib/formatters/human.js
 *
 * Human-readable terminal output for SecretShield.
 *
 * Security: NEVER prints raw secret values.
 *           Only maskedValue is used in output.
 */

// ANSI escape codes — no external dependency
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';
const RED    = '\x1b[31m';
const ORANGE = '\x1b[33m';
const YELLOW = '\x1b[33m';
const BLUE   = '\x1b[34m';
const GREEN  = '\x1b[32m';
const CYAN   = '\x1b[36m';
const GRAY   = '\x1b[90m';

const SEVERITY_COLOR = {
  CRITICAL: RED,
  HIGH:     ORANGE,
  MEDIUM:   YELLOW,
  LOW:      BLUE,
};

const SEVERITY_LABEL = {
  CRITICAL: '🔴 CRITICAL',
  HIGH:     '🟠 HIGH    ',
  MEDIUM:   '🟡 MEDIUM  ',
  LOW:      '🔵 LOW     ',
};

function color(text, code, quiet = false) {
  if (quiet || !process.stdout.isTTY) return text;
  return `${code}${text}${RESET}`;
}

function bold(text, quiet = false) {
  return color(text, BOLD, quiet);
}

// ── BANNER ────────────────────────────────────────────────────────────────────

export function printBanner(quiet = false) {
  if (quiet) return;
  console.log('');
  console.log(bold('  SecretShield', quiet) + color('  v2.0  secret detection for developers', GRAY, quiet));
  console.log(color('  ─────────────────────────────────────', GRAY, quiet));
}

// ── SCAN START ────────────────────────────────────────────────────────────────

export function printScanStart({ target, mode }, quiet = false) {
  if (quiet) return;
  console.log('');
  console.log(color('  Scanning: ', GRAY, quiet) + bold(target, quiet));
  if (mode && mode !== 'directory') {
    console.log(color(`  Mode:     ${mode}`, GRAY, quiet));
  }
  console.log('');
}

// ── FINDINGS ──────────────────────────────────────────────────────────────────

export function printFindings(findings, { verbose = false, quiet = false, suppressed = 0 } = {}) {
  if (findings.length === 0 && suppressed === 0) return;

  if (!quiet) {
    if (findings.length > 0) {
      console.log(bold('  Findings:', quiet));
      console.log('');
    }
  }

  for (const finding of findings) {
    const sevColor = SEVERITY_COLOR[finding.severity] || BLUE;
    const label    = SEVERITY_LABEL[finding.severity] || '       ' + finding.severity;

    console.log(`  ${color(label, sevColor, quiet)}  ${bold(finding.description || finding.type, quiet)}`);
    console.log(color(`  ${finding.file}:${finding.line || '?'}`, GRAY, quiet));

    if (finding.maskedValue) {
      console.log(color(`  Found: `, GRAY, quiet) + finding.maskedValue);
    }

    if (verbose) {
      if (finding.confidence !== undefined) {
        console.log(color(`  Confidence: ${finding.confidence}%`, GRAY, quiet));
      }
      if (finding.rule || finding.ruleId) {
        console.log(color(`  Rule: ${finding.rule || finding.ruleId}`, GRAY, quiet));
      }
      if (finding.fingerprint) {
        console.log(color(`  Fingerprint: ${finding.fingerprint}`, GRAY, quiet));
      }
    }

    console.log('');
  }

  if (suppressed > 0 && !quiet) {
    console.log(color(`  ${suppressed} baseline finding(s) suppressed.`, GRAY, quiet));
    console.log('');
  }
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────

export function printSummary(stats, { quiet = false, suppressed = 0, baseline = false } = {}) {
  if (!quiet) {
    console.log(color('  ─────────────────────────────────────', GRAY, quiet));
    console.log('');
    console.log(bold('  Summary:', quiet));
    console.log(color(`  Files scanned:  ${stats.filesScanned}`, GRAY, quiet));

    if (stats.critical > 0) console.log(`  ${color('Critical:', RED, quiet)}     ${stats.critical}`);
    if (stats.high     > 0) console.log(`  ${color('High:', ORANGE, quiet)}        ${stats.high}`);
    if (stats.medium   > 0) console.log(`  ${color('Medium:', YELLOW, quiet)}      ${stats.medium}`);
    if (stats.low      > 0) console.log(`  ${color('Low:', BLUE, quiet)}         ${stats.low}`);

    if (stats.total === 0 && suppressed === 0) {
      console.log(`  ${color('✓ No findings', GREEN, quiet)}`);
    }
    if (suppressed > 0) {
      console.log(color(`  Baseline:     ${suppressed} suppressed`, GRAY, quiet));
    }

    console.log('');
  }
}

// ── RESULT ────────────────────────────────────────────────────────────────────

export function printResult(findings, { quiet = false } = {}) {
  if (findings.length === 0) {
    if (!quiet) {
      console.log(color('  ✓ Scan passed. No active findings.', GREEN, quiet));
      console.log('');
    }
  } else {
    console.log(color('  ✖ Scan failed.', RED, quiet));
    console.log('');
  }
}

// ── PRE-COMMIT BLOCK ──────────────────────────────────────────────────────────

export function printPreCommitBlock(findings) {
  console.error('');
  console.error(bold('  SecretShield blocked this commit.'));
  console.error('');
  console.error(`  ${findings.length} secret(s) detected in staged files.`);
  console.error('');

  for (const f of findings) {
    const sevColor = SEVERITY_COLOR[f.severity] || BLUE;
    console.error(`  ${color(f.severity, sevColor)}  ${f.description || f.type}`);
    console.error(`  ${f.file}:${f.line || '?'}`);
    console.error('');
  }

  console.error('  Remove the secret(s) and try again.');
  console.error('');
  console.error(color('  To bypass (not recommended):', GRAY));
  console.error(color('    git commit --no-verify', GRAY));
  console.error('');
}

// ── CI OUTPUT ─────────────────────────────────────────────────────────────────

export function printCiResult({ findings, suppressed, stats, prContext, quiet = false }) {
  if (quiet) return;

  if (prContext?.isPr) {
    console.log('');
    console.log(bold('  SecretShield — PR scan'));
    if (prContext.baseRef && prContext.headRef) {
      console.log(color(`  ${prContext.baseRef} ← ${prContext.headRef}`, GRAY));
    }
    console.log('');
  }

  printFindings(findings, { quiet, suppressed });
  printSummary(stats, { quiet, suppressed, baseline: suppressed > 0 });
  printResult(findings, { quiet });
}

// ── BASELINE MESSAGES ─────────────────────────────────────────────────────────

export function printBaselineCreated(count, filePath) {
  console.log('');
  console.log(bold(`  Baseline created: ${filePath}`));
  console.log(color(`  ${count} fingerprint(s) stored.`, GRAY));
  console.log(color('  Use with: secretshield ci --baseline <file>', GRAY));
  console.log('');
}

// ── WARNINGS ─────────────────────────────────────────────────────────────────

export function printWarnings(warnings, quiet = false) {
  if (quiet || !warnings.length) return;
  for (const w of warnings) {
    console.warn(color(`  ⚠ ${w}`, YELLOW, quiet));
  }
}
