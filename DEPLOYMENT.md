# SecretShield — Production Deployment & Architecture Guide

This guide documents the architecture, infrastructure requirements, and deployment procedures for running SecretShield in production without mandatory paid services.

---

## 1. System Architecture

```
User Browser / CLI / VS Code
          │
          ▼ HTTPS
┌──────────────────────────────────────────┐
│        Next.js Edge / App Server         │
│  - Static Pages & SSR UI                 │
│  - REST API Routing & Rate Limiting      │
│  - Centralized Secret Redactor           │
└──────────────────┬───────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌──────────────────┐  ┌───────────────────┐
│  Scanner Engine  │  │   Job Queue       │
│  - Shannon Calc  │  │   - Push Scans    │
│  - 50+ Regexes   │  │   - PR Scans      │
│  - ReDoS Guard   │  │   - Notifications │
└────────┬─────────┘  └────────┬──────────┘
         │                     │
         └──────────┬──────────┘
                    ▼
┌──────────────────────────────────────────┐
│      PostgreSQL 14+ / Prisma ORM         │
│  - AES-256-GCM Token Encryption          │
│  - Masked Credentials & Fingerprints     │
│  - Isolated Organization Partitioning    │
└──────────────────────────────────────────┘
```

---

## 2. Infrastructure Requirements

SecretShield is intentionally built to run on standard low-cost or free-tier infrastructure:

| Component | Minimum Spec | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **App Runtime** | 1 vCPU, 512MB RAM | 2 vCPU, 2GB RAM | Node.js 20+ LTS |
| **Database** | PostgreSQL 14+ (Shared) | PostgreSQL 15+ (Dedicated) | Local In-Memory fallback supported for test |
| **Object Store** | Optional | S3-compatible bucket | For backup snapshot storage |

---

## 3. Environment Configuration

Ensure the following variables are configured in your deployment environment:

```env
# Application
NEXT_PUBLIC_APP_URL=https://secretshield.yourdomain.com
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://secretshield_user:STRONG_PASSWORD@db-host:5432/secretshield?sslmode=require

# Authentication
AUTH_SECRET=GENERATE_32_BYTE_SECRET

# Encryption (AES-256-GCM token storage)
ENCRYPTION_KEY=GENERATE_32_BYTE_HEX_KEY
```

---

## 4. Docker Deployment

### Building the Container
```bash
docker build -t secretshield:latest .
```

### Running the Container
```bash
docker run -d \
  -p 3000:3000 \
  --name secretshield \
  --env-file .env.production \
  secretshield:latest
```

---

## 5. Health & Liveness Endpoints

- **Liveness Probe**: `GET /api/health/liveness` (Returns HTTP 200 `{ status: "alive" }`)
- **Readiness Probe**: `GET /api/health/readiness` (Verifies DB connection, scanner rules, and returns HTTP 200 or 503)
- **High-Level Probe**: `GET /api/health`
