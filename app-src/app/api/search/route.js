/**
 * app/api/search/route.js
 *
 * Fast local search endpoint across:
 * - Documentation articles & sections
 * - Authorized Projects & Repositories
 * - Security Findings & Scans
 *
 * Privacy & Security:
 * Returns ONLY sanitized metadata and masked values. Never exposes raw credentials.
 */

import { NextResponse } from 'next/server';
import { DOC_PAGES } from '@/lib/docs/data';
import { getDb, memoryDb } from '@/lib/db/client';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim().toLowerCase();

  if (!query) {
    return NextResponse.json({
      success: true,
      data: {
        docs: [],
        projects: [],
        repositories: [],
        findings: [],
      },
    });
  }

  // 1. Search Documentation
  const docResults = Object.values(DOC_PAGES).filter(page => {
    return (
      page.title.toLowerCase().includes(query) ||
      page.description.toLowerCase().includes(query) ||
      page.category.toLowerCase().includes(query) ||
      page.content.toLowerCase().includes(query)
    );
  }).map(p => ({
    id: `doc_${p.slug}`,
    type: 'doc',
    title: p.title,
    category: p.category,
    description: p.description,
    href: `/docs/${p.slug}`,
  }));

  // 2. Search Database / Memory store for projects, repositories, and findings
  const { client, isPostgres } = await getDb();
  let projectResults = [];
  let repositoryResults = [];
  let findingResults = [];

  if (isPostgres) {
    const [dbProjects, dbRepos, dbFindings] = await Promise.all([
      client.project.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: 5,
        select: { id: true, name: true, description: true },
      }),
      client.repository.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: 5,
        select: { id: true, name: true, fullName: true, provider: true },
      }),
      client.finding.findMany({
        where: {
          OR: [
            { ruleName: { contains: query, mode: 'insensitive' } },
            { filePath: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, ruleName: true, severity: true, filePath: true, lineNumber: true },
      }),
    ]);

    projectResults = dbProjects.map(p => ({
      id: p.id,
      type: 'project',
      title: p.name,
      description: p.description || 'Project workspace',
      href: `/projects`,
    }));

    repositoryResults = dbRepos.map(r => ({
      id: r.id,
      type: 'repository',
      title: r.fullName || r.name,
      description: `Provider: ${r.provider}`,
      href: `/repositories/${r.id}`,
    }));

    findingResults = dbFindings.map(f => ({
      id: f.id,
      type: 'finding',
      title: f.ruleName,
      description: `${f.filePath}:${f.lineNumber}`,
      severity: f.severity,
      href: `/findings/${f.id}`,
    }));
  } else {
    projectResults = Array.from(memoryDb.projects.values())
      .filter(p => p.name.toLowerCase().includes(query))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        type: 'project',
        title: p.name,
        description: p.description || 'Project workspace',
        href: `/projects`,
      }));

    repositoryResults = Array.from(memoryDb.repositories.values())
      .filter(r => r.name.toLowerCase().includes(query) || (r.fullName && r.fullName.toLowerCase().includes(query)))
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        type: 'repository',
        title: r.fullName || r.name,
        description: `Provider: ${r.provider || 'LOCAL'}`,
        href: `/repositories`,
      }));

    findingResults = Array.from(memoryDb.findings.values())
      .filter(f => (f.ruleName && f.ruleName.toLowerCase().includes(query)) || (f.filePath && f.filePath.toLowerCase().includes(query)))
      .slice(0, 5)
      .map(f => ({
        id: f.id,
        type: 'finding',
        title: f.ruleName,
        description: `${f.filePath}:${f.lineNumber}`,
        severity: f.severity,
        href: `/findings/${f.id}`,
      }));
  }

  return NextResponse.json({
    success: true,
    data: {
      docs: docResults,
      projects: projectResults,
      repositories: repositoryResults,
      findings: findingResults,
    },
  });
}
