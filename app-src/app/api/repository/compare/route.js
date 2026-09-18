/**
 * app/api/repository/compare/route.js
 *
 * POST /api/repository/compare
 *
 * Compares two scan results by fingerprint to show new/resolved/persistent findings.
 * Accepts safe scan data from client — no raw secrets involved.
 *
 * Body:
 *   { previousFindings: Finding[], currentFindings: Finding[] }
 */

import { NextResponse } from 'next/server';
import { compareFindings } from '@/lib/models/index';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { previousFindings = [], currentFindings = [] } = body;

  if (!Array.isArray(previousFindings) || !Array.isArray(currentFindings)) {
    return NextResponse.json({ error: 'previousFindings and currentFindings must be arrays' }, { status: 400 });
  }

  // Validate that no raw secrets were sent (all values should be masked with ●)
  // We enforce this by only accepting findings that have maskedValue, not any rawValue field
  const sanitize = findings => findings.map(f => ({
    fingerprint:  f.fingerprint,
    type:         f.type,
    category:     f.category,
    severity:     f.severity,
    confidence:   f.confidence,
    file:         f.file,
    line:         f.line,
    maskedValue:  f.maskedValue,
    description:  f.description,
  }));

  const safePrev = sanitize(previousFindings);
  const safeCurr = sanitize(currentFindings);

  const comparison = compareFindings(safePrev, safeCurr);

  return NextResponse.json({
    newFindings:        comparison.newFindings,
    resolvedFindings:   comparison.resolvedFindings,
    persistentFindings: comparison.persistentFindings,
    summary: {
      previousTotal:  previousFindings.length,
      currentTotal:   currentFindings.length,
      newCount:       comparison.newFindings.length,
      resolvedCount:  comparison.resolvedFindings.length,
      persistentCount: comparison.persistentFindings.length,
      delta: currentFindings.length - previousFindings.length,
    },
  });
}
