/**
 * prisma/seed.js
 *
 * Seed data for local development and testing.
 *
 * IMPORTANT:
 *   - All credentials here are 100% SYNTHETIC and non-functional test values.
 *   - Used only to demonstrate multi-tenant organization, projects, and findings.
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SecretShield multi-project platform…');

  // 1. Create demo user
  const passwordHash = await hashPassword('password1234');
  const user = await prisma.user.upsert({
    where: { email: 'developer@secretshield.dev' },
    update: {},
    create: {
      email: 'developer@secretshield.dev',
      name: 'Ray Mukku',
      passwordHash,
    },
  });

  // 2. Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-security' },
    update: {},
    create: {
      name: 'Acme Security Workspace',
      slug: 'acme-security',
      plan: 'pro',
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      },
    },
  });

  // 3. Create demo project
  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: 'Core Payments Service',
      slug: 'core-payments',
      description: 'Payment gateway integrations and card processor APIs',
      severityThreshold: 'HIGH',
    },
  });

  // 4. Create demo repository
  const repo = await prisma.repository.create({
    data: {
      projectId: project.id,
      provider: 'GITHUB',
      name: 'payments-backend',
      fullName: 'acme/payments-backend',
      defaultBranch: 'main',
      isPrivate: true,
      lastScannedAt: new Date(),
    },
  });

  // 5. Create demo scan & synthetic findings
  const scan = await prisma.scan.create({
    data: {
      scanId: `scan_seed_${Date.now()}`,
      projectId: project.id,
      repositoryId: repo.id,
      status: 'COMPLETED',
      durationMs: 42,
      filesScanned: 15,
      totalFindings: 2,
      criticalCount: 1,
      highCount: 1,
    },
  });

  await prisma.finding.createMany({
    data: [
      {
        scanId: scan.scanId,
        projectId: project.id,
        repositoryId: repo.id,
        fingerprint: 'seed_fp_aws_001',
        ruleId: 'AWS_ACCESS_KEY_ID',
        type: 'AWS_ACCESS_KEY_ID',
        category: 'Cloud Credentials',
        severity: 'CRITICAL',
        confidence: 98,
        file: 'config/aws.js',
        line: 12,
        maskedValue: 'AKIAIOSF••••••••KEY1',
        description: 'Synthetic test AWS key fixture',
        status: 'OPEN',
      },
      {
        scanId: scan.scanId,
        projectId: project.id,
        repositoryId: repo.id,
        fingerprint: 'seed_fp_stripe_002',
        ruleId: 'STRIPE_SECRET_KEY',
        type: 'STRIPE_SECRET_KEY',
        category: 'Payment APIs',
        severity: 'HIGH',
        confidence: 90,
        file: 'services/stripe.js',
        line: 8,
        maskedValue: 'sk_test_••••••••1234',
        description: 'Synthetic test Stripe fixture',
        status: 'OPEN',
      },
    ],
  });

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
