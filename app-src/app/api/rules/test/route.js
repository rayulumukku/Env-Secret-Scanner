import { NextResponse } from 'next/server';
import { validateRegexSafety, safeRegexExec } from '@/lib/scanner/regex-safety';
import { maskSecretInLine } from '@/lib/scanner/masking';
import { calculateShannonEntropy } from '@/lib/scanner/entropy';
import { evaluateRuleQuality } from '@/lib/scanner/rule-packs/quality';

export async function POST(request) {
  try {
    const body = await request.json();
    const { rule, content, filename = 'test.js', runFixtures = false } = body;

    if (!rule || (!rule.pattern && !rule.patterns)) {
      return NextResponse.json(
        { success: false, error: { message: 'Rule object with pattern is required' } },
        { status: 400 }
      );
    }

    const patternStr = Array.isArray(rule.patterns)
      ? (typeof rule.patterns[0] === 'string' ? rule.patterns[0] : rule.patterns[0]?.regex)
      : (typeof rule.pattern === 'string' ? rule.pattern : rule.pattern?.regex);

    if (!patternStr) {
      return NextResponse.json(
        { success: false, error: { message: 'Valid regex pattern is required' } },
        { status: 400 }
      );
    }

    // 1. ReDoS Safety Check
    const safety = validateRegexSafety(patternStr, 'g');
    if (!safety.valid || !safety.safeRegex) {
      return NextResponse.json(
        { success: false, error: { message: `Regex safety rejection: ${safety.error}` } },
        { status: 400 }
      );
    }

    const matches = [];
    const testContent = typeof content === 'string' ? content : '';
    const lines = testContent.split('\n');

    if (testContent.trim()) {
      const execMatches = safeRegexExec(safety.safeRegex, testContent, 2000);

      for (const m of execMatches) {
        const rawValue = m[0];
        if (!rawValue || rawValue.length < 3) continue;

        const upToMatch = testContent.slice(0, m.index);
        const lineIdx = upToMatch.split('\n').length - 1;
        const lastNewline = upToMatch.lastIndexOf('\n');
        const column = m.index - lastNewline;
        const line = lineIdx + 1;

        // Mask immediately
        const len = rawValue.length;
        const maskedValue = len <= 8
          ? '•'.repeat(Math.min(len, 8))
          : rawValue.slice(0, 4) + '•'.repeat(Math.min(len - 8, 12)) + rawValue.slice(-4);

        const lineText = lines[lineIdx] || '';
        const maskedLineText = maskSecretInLine(lineText, rawValue);
        const entropyScore = calculateShannonEntropy(rawValue);

        matches.push({
          ruleId: rule.id || 'test-rule',
          name: rule.name || 'Test Rule',
          severity: rule.severity || 'HIGH',
          confidence: rule.confidence || 85,
          line,
          column,
          file: filename,
          maskedValue,
          entropy: Number(entropyScore.toFixed(2)),
          lineTextMasked: maskedLineText,
          whyDetected: [
            `Pattern matched regular expression: /${patternStr.slice(0, 32)}${patternStr.length > 32 ? '…' : ''}/`,
            `Shannon entropy calculated at ${entropyScore.toFixed(2)} bits/character`,
          ],
        });
      }
    }

    // Optional Quality / Fixture Evaluation
    let qualityReport = null;
    if (runFixtures || (rule.testFixtures && (rule.testFixtures.positive?.length || rule.testFixtures.negative?.length))) {
      qualityReport = evaluateRuleQuality(rule);
    }

    return NextResponse.json({
      success: true,
      data: {
        matchesCount: matches.length,
        matches,
        safety: { valid: true },
        qualityReport,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
