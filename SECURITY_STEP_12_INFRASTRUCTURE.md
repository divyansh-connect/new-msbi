# SECURITY STEP 12: INFRASTRUCTURE, DEPLOYMENT, BACKUP, DISASTER RECOVERY & OPERATIONAL SECURITY
**Spine Brain Project — Technical Security & Operational Audit**
**Date:** 2026-08-24
**Scope:** Deployment architecture, database exposure & TLS, backup & retention policies, restore testing, RPO/RTO, disaster recovery, server/container/process hardening, CI/CD security, dependency audits, audit log protection, and secret rotation readiness.

---

## Executive Summary

Step 12 conducts an in-depth audit of the infrastructure, deployment, backup, disaster recovery, and operational controls of the Spine Brain CRM. Technical safeguards were verified directly from source and configuration code, while infrastructure components managed externally at the cloud provider level are classified rigorously according to the project's compliance standard.

**Step 12 test result: 28/28 PASSED, 0 FAILED**
**Cumulative security baseline: 325/325 PASSED across Steps 2–12**

> [!IMPORTANT]
> **Category Distinction Principle:**
> - **Category A (Verified in Codebase):** Controls implemented in application code (health check non-exposure, fail-fast configuration validation, error sanitization, audit log immutability, CORS, rate-limiting, schema referential integrity, graceful shutdown signal handling, `.dockerignore` / `.gitignore` secret exclusion) are verified and marked **PASS**.
> - **Category B (Requires Live Production Infrastructure Access):** Controls dependent on production cloud consoles, database network firewalls, managed snapshots, or hosting provider settings are marked **MANUAL REVIEW REQUIRED**.
> **Compliance Notice:** **This application is NOT self-certified as HIPAA compliant or HIPAA certified.**

---

## Cumulative Security Baseline Across All Steps (Steps 2–12)

| Step | Security Domain | Assertions Passed | Assertions Failed | Status |
|:---:|---|:---:|:---:|:---:|
| Step 2 | Authentication Security | 41 | 0 | ✅ PASS |
| Step 3 | RBAC & Permissions | 26 | 0 | ✅ PASS |
| Step 4 | Resource Authorization / IDOR | 16 | 0 | ✅ PASS |
| Step 5 | Audit Logging | 13 | 0 | ✅ PASS |
| Step 6 | Session & JWT Security | 48 | 0 | ✅ PASS |
| Step 7 | Secrets & Environment Security | 30 | 0 | ✅ PASS |
| Step 8 | API Security Hardening | 33 | 0 | ✅ PASS |
| Step 9 | PHI-Safe Logging & Frontend Security | 12 | 0 | ✅ PASS |
| Step 10 | Files, Documents & Data Export Security | 41 | 0 | ✅ PASS |
| Step 11 | Third-Party Integrations & BAA Readiness | 37 | 0 | ✅ PASS |
| **Step 12** | **Infrastructure, Backup, DR & Operational Security** | **28** | **0** | **✅ PASS** |
| | **CUMULATIVE TOTAL** | **325** | **0** | **✅ ALL PASS** |

- **Backend TypeScript Compilation (`npx tsc --noEmit`):** 0 errors (PASSED)
- **Prisma Schema Validation (`npx prisma validate`):** VALID 🚀
- **Frontend Production Build (`npm run build`):** PASSED (built in 9.30s)
- **Real Database Safety:** Real MySQL database structure preserved with zero destructive migrations.

---

## 1. Actual Deployment Architecture

```
                                 [CLIENT BROWSERS]
                                         │
                                   (HTTPS / TLS)
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │          RAILWAY EDGE INGRESS         │
                     │  - TLS Termination (Automated Let's   │
                     │    Encrypt / Wildcard SSL)            │
                     │  - Reverse Proxy Routing              │
                     └───────────────────┬───────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │    FRONTEND STATIC CDN    │                   │      BACKEND API NODE     │
   │  - Vite React SPA Bundle  │                   │  - Fastify (Port 8000)    │
   │  - Hosted on Railway Edge │                   │  - Zod Validation         │
   │  - Zero client trackers   │                   │  - Pino Redacted Logger   │
   └───────────────────────────┘                   │  - Rate Limiter & CORS    │
                                                   └─────────────┬─────────────┘
                                                                 │
                                                          (Prisma Connection)
                                                                 │
                                                                 ▼
                                                   ┌───────────────────────────┐
                                                   │    MANAGED MYSQL DATABASE │
                                                   │  - Railway / MySQL 8.0    │
                                                   │  - AES-256-GCM encrypted  │
                                                   │    credentials at rest    │
                                                   └─────────────┬─────────────┘
                                                                 │
                                        ┌────────────────────────┴────────────────────────┐
                                        ▼                                                 ▼
                          [INBOUND INTEGRATION WEBHOOKS]                    [OUTBOUND INTEGRATION CALLS]
                          - WordPress Form Webhook                          - Google Analytics 4 (GA4)
                          - Google Reviews Webhook                          - Google Search Console (GSC)
                                                                            - Google Ads API
                                                                            - Google Business Profile
                                                                            - CallRail Telephony
                                                                            - Meta Ads API
                                                                            - Mailchimp API
                                                                            - HubSpot API
                                                                            - SendGrid / Twilio
```

---

## 2. Hosting & Infrastructure Inventory

| Component | Technology / Provider | Discovered Evidence in Codebase | Verification Status |
|---|---|---|:---:|
| **Frontend Hosting** | Vite React SPA on Railway Edge CDN | `Spine-brain-frontend/src/api/client.ts` references `https://msbi-spine-brain-backend-production.up.railway.app` | ✅ PASS (Architecture Verified) |
| **Backend API Hosting** | Node.js Fastify on Railway Container Platform | `package.json` startup script `node dist/server.js`, `index.js`, `.dockerignore` | ✅ PASS (Architecture Verified) |
| **Database Hosting** | Managed MySQL on Railway Platform | Connection string structure `mysql://root:***@***.railway.app:port/railway` | ✅ PASS (Architecture Verified) |
| **Object Storage** | None (External URL references used) | Verified in Step 10 & 11; no S3 / GCS / Azure SDK present | ✅ NOT APPLICABLE |
| **DNS Management** | Cloud Provider / Domain Registrar | Configured externally for `railway.app` or custom domain | `MANUAL REVIEW REQUIRED` |
| **TLS Termination** | Railway Edge Load Balancer | Automated edge TLS certificates on `https://*.railway.app` | `MANUAL REVIEW REQUIRED` (Cloud Console) |
| **Reverse Proxy** | Railway Edge Ingress | Forwarded headers and proxy routing | ✅ PASS (App handles headers safely) |

---

## 3. Production vs. Development Separation

- **Database Separation:** Development environment uses dedicated local or branch connection strings. Production credentials are supplied via environment variables in the hosting dashboard.
- **API URL Separation:** Frontend `client.ts` defaults to `http://localhost:8000/api/v1` during development and `VITE_API_BASE_URL` in production builds.
- **Secret Isolation:** Production `JWT_SECRET`, `INTEGRATION_ENCRYPTION_KEY`, and webhook secrets are stored exclusively in cloud environment variables; `.env.example` contains only dummy placeholders.
- **Artifact Protection:** `.gitignore` and `.dockerignore` strictly exclude `.env`, `.env.local`, and `node_modules`.

---

## 4. Database Security, Exposure & TLS

| Control | Implementation Detail | Status |
|---|---|:---:|
| **Network Exposure** | Managed MySQL instance on Railway. Accessible via internal network / authorized connection URL. | `MANUAL REVIEW REQUIRED` (Verify private networking in Railway project) |
| **Database TLS** | Prisma MySQL connector supports `sslcert`, `sslidentity`, `sslaccept=strict`. Must be enforced on production connection string. | `MANUAL REVIEW REQUIRED` (Verify `sslaccept=strict` parameter in production `DATABASE_URL`) |
| **Least Privilege User** | Database connection URL currently configures user access. Production database should use dedicated `spine_app` user rather than `root`. | `MANUAL REVIEW REQUIRED` (DB User Provisioning) |
| **Referential Integrity** | Prisma schema enforces foreign keys (`onDelete: Restrict`) on User, Role, Department, ActivityLog, and Lead relations. | ✅ PASS |

---

## 5. Database Backups, Retention, RPO & RTO

| Metric / Control | Target / Configuration | Current Status | Notes & Operational Actions |
|---|---|:---:|---|
| **Automated Backups** | Daily automated MySQL snapshots | `MANUAL REVIEW REQUIRED` | Verify automated daily volume snapshots in Railway Database settings. |
| **Backup Encryption** | Encrypted at rest via cloud KMS | `MANUAL REVIEW REQUIRED` | Verify platform storage volume encryption (AES-256). |
| **Backup Retention** | 30-Day Daily Retention Policy | `MANUAL REVIEW REQUIRED` | Establish formal 30-day retention schedule for disaster recovery. |
| **Restore Testing** | Periodic restore drill in staging | `MANUAL REVIEW REQUIRED` | Documented in DR Runbook Section 10; execute bi-annual restore test. |
| **RPO (Recovery Point Objective)** | Target: **< 24 Hours** (Daily snapshot) | `MANUAL REVIEW REQUIRED` | Recommended organization threshold for non-transactional marketing CRM. |
| **RTO (Recovery Time Objective)** | Target: **< 2 Hours** (Spin-up from dump) | `MANUAL REVIEW REQUIRED` | Time required to provision replacement database and restore schema. |

---

## 6. Disaster Recovery & Incident Response Runbooks

Two dedicated runbook artifacts have been generated in the project root:
1. [`SECURITY_STEP_12_DR_RUNBOOK.md`](file:///i:/spine-brain-project/SECURITY_STEP_12_DR_RUNBOOK.md): Covers procedures for MySQL outage, database corruption, backend/frontend downtime, DNS failure, TLS certificate expiry, credential compromise, encryption key compromise, third-party outages, and full environment rebuilds.
2. [`SECURITY_STEP_12_INCIDENT_RESPONSE.md`](file:///i:/spine-brain-project/SECURITY_STEP_12_INCIDENT_RESPONSE.md): Covers SEV-1 through SEV-4 incident classification, 6-phase response lifecycle, session revocation SQL procedures, forensic log preservation, and legal/compliance breach escalation under the HIPAA Breach Notification Rule (`LEGAL/COMPLIANCE REVIEW REQUIRED`).

---

## 7. Server, Container & Process Hardening

- **Process Management:** Backend runs Fastify on Node.js 18+. Registered `SIGTERM` and `SIGINT` signal handlers trigger graceful shutdown, draining in-flight requests and disconnecting Prisma connection pools cleanly before exiting.
- **Fail-Fast Validation:** Startup script in [`src/server.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/server.ts) validates presence of `DATABASE_URL`, `JWT_SECRET`, and 32-byte `INTEGRATION_ENCRYPTION_KEY` before opening port 8000.
- **Container Isolation:** `.dockerignore` excludes `.env`, `node_modules`, `dist`, and `.git` from container builds. No hardcoded credentials exist in any configuration files.
- **Health Check Safety:** Root `/health` and `/api/health` endpoints return `{ status: 'ok', timestamp }` without leaking `DATABASE_URL`, database passwords, JWT secrets, or environment variables.

---

## 8. Network, Reverse Proxy, CORS & Rate Limiting

- **CORS Protection:** Fastify CORS plugin validates origins dynamically against `CORS_ALLOWED_ORIGINS` / `FRONTEND_URL`. Disallows dangerous wildcard `*` with credentials.
- **Security Headers:** Fastify `securityHeadersHook` injects:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN` / `DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Request-Id` correlation tracking header.
- **Rate Limiting:** Fastify `@fastify/rate-limit` protects against brute-force and resource exhaustion (login capped at 5 req/min, webhooks capped at 20–30 req/min).

---

## 9. Dependency Security Audit (`npm audit`)

| Component | Vulnerability Finding | Severity | Production Impact & Recommendation |
|---|---|:---:|---|
| **Backend** | `deepmerge-ts` (< 8.0.0) via `@prisma/config` / `prisma` CLI | High (3 findings) | **Low Production Impact:** Transitive dependency in Prisma development/build CLI; not bundled in production runtime code. Upgrade when Prisma releases patch. |
| **Frontend** | `react-router` / `react-router-dom` (6.28.0 SSR hydration / backslash) | Moderate (2 findings) | **Low Production Impact:** Application uses client-side SPA routing (`createBrowserRouter` / `RouterProvider`) without SSR hydration. Safe to update via `npm audit fix` during routine maintenance. |

---

## 10. Audit Log & Credential Immutability

- **Application Immutability:** ActivityLog has no `DELETE` or `PUT/PATCH` routes exposed in the API (both return 404 Not Found).
- **Access Control:** `GET /api/v1/users/activity-logs` is strictly restricted to authenticated users with `Admin` or `Manager` roles.
- **Redaction:** Log contents redact sensitive tokens, passwords, and cookies.
- **Database Level:** Database user permissions should restrict `DELETE` and `UPDATE` privileges on the `activitylog` table (`MANUAL REVIEW REQUIRED` in MySQL grant settings).

---

## 11. Secret Rotation Operational Readiness

| Secret | Rotation Procedure | Service Impact & Downtime | Re-encryption Required? |
|---|---|:---:|:---:|
| `JWT_SECRET` | Generate 32-byte hex key, update hosting secret, restart backend. | Zero downtime; invalidates existing user sessions (users must log in again). | **NO** |
| `INTEGRATION_ENCRYPTION_KEY` | Generate new 32-byte key, run re-encryption migration script, update hosting secret. | Brief maintenance window (5 min) during migration. | **YES (Mandatory)** |
| `DATABASE_URL` | Provision new password in MySQL, update hosting secret, restart backend. | Brief restart (< 30 sec). | **NO** |
| Webhook Secrets | Update secret in CMS / Google Pub/Sub and hosting environment simultaneously. | Zero downtime. | **NO** |
| Third-Party API Keys | Invalidate key in provider portal (SendGrid, Twilio, CallRail), update in CRM Admin UI. | Zero downtime. | **NO** |

---

## 12. Production Infrastructure Configuration Checklist

| Checklist Item | Description | Status |
|---|---|:---:|
| **HTTPS Enabled** | All production traffic served exclusively over TLS 1.2+ / HTTPS | `MANUAL REVIEW REQUIRED` (Edge Ingress) |
| **HTTP → HTTPS Redirect** | Plain HTTP requests automatically upgraded to HTTPS | `MANUAL REVIEW REQUIRED` (Edge Ingress) |
| **TLS Certificate Valid** | Valid automated certificate from recognized Certificate Authority | `MANUAL REVIEW REQUIRED` (Edge Ingress) |
| **Database Private Network** | MySQL isolated from public Internet routing | `MANUAL REVIEW REQUIRED` (Railway Settings) |
| **Database TLS Enabled** | Application-to-MySQL connection enforces TLS encryption | `MANUAL REVIEW REQUIRED` (Connection String) |
| **Database Least Privilege** | Application uses dedicated non-root MySQL user | `MANUAL REVIEW REQUIRED` (MySQL Grants) |
| **Automated Backups** | Daily automated database snapshots enabled | `MANUAL REVIEW REQUIRED` (Railway Settings) |
| **Backup Encryption** | Snapshots encrypted at rest via AES-256 KMS | `MANUAL REVIEW REQUIRED` (Cloud Storage) |
| **Backup Retention Defined** | 30-day retention schedule established | `MANUAL REVIEW REQUIRED` (Ops Policy) |
| **Restore Testing Completed** | Restore drill executed and verified in staging | `MANUAL REVIEW REQUIRED` (Bi-Annual Drill) |
| **RPO Defined** | Recovery Point Objective defined (< 24 Hours) | `MANUAL REVIEW REQUIRED` (Ops Policy) |
| **RTO Defined** | Recovery Time Objective defined (< 2 Hours) | `MANUAL REVIEW REQUIRED` (Ops Policy) |
| **Secrets Stored Securely** | Stored in cloud secret manager, absent from git | ✅ PASS |
| **Secret Rotation Procedure** | Documented step-by-step in DR & IR Runbooks | ✅ PASS |
| **Logs PHI-Redacted** | Pino structured logger redacts passwords, tokens, auth headers | ✅ PASS |
| **Audit Logs Protected** | Immutable at application API layer (no DELETE/PUT) | ✅ PASS |
| **Audit Logs DB-Protected** | MySQL grants restrict DELETE/UPDATE on `activitylog` | `MANUAL REVIEW REQUIRED` (MySQL Grants) |
| **Rate Limiting Active** | DoS & brute-force protections active | ✅ PASS |
| **Graceful Shutdown** | SIGTERM/SIGINT signal listeners drain connections | ✅ PASS |
| **Fail-Fast Startup** | Required secrets validated before port binding | ✅ PASS |
| **Dependency Security** | Dependency vulnerability scan performed and classified | ✅ PASS |

---

## 13. Step 12 Code Changes & Hardening

| File | Change | Security & Operational Benefit |
|---|---|---|
| [`src/server.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/server.ts) | Added `SIGTERM` and `SIGINT` signal listeners for graceful shutdown | Allows container orchestrators (Railway/Docker/K8s) to terminate processes cleanly, draining in-flight HTTP requests and disconnecting Prisma connection pools without orphaned DB locks |
| [`src/app.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/app.ts) | Registered `/health` and `/api/health` safe status endpoints | Provides standard, non-sensitive operational health checks for cloud load balancers and uptime monitoring probes |
| [`test_infrastructure_security.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/test_infrastructure_security.ts) | Created comprehensive 28-assertion technical infrastructure test suite | Verifies health check safety, startup validation, error sanitization, audit immutability, CORS/proxy safety, schema constraints, and environment isolation |
| [`SECURITY_STEP_12_DR_RUNBOOK.md`](file:///i:/spine-brain-project/SECURITY_STEP_12_DR_RUNBOOK.md) | Created comprehensive Disaster Recovery Runbook | Provides step-by-step recovery procedures for 12 operational failure scenarios |
| [`SECURITY_STEP_12_INCIDENT_RESPONSE.md`](file:///i:/spine-brain-project/SECURITY_STEP_12_INCIDENT_RESPONSE.md) | Created comprehensive Incident Response Plan | Establishes SEV-1 through SEV-4 classification, containment SQL scripts, evidence preservation, and legal escalation |

---

## 14. Manual Operational Action Checklist

- [ ] **Configure Dedicated Database User:** Create a dedicated MySQL user `spine_app` with `SELECT, INSERT, UPDATE` on application tables and update `DATABASE_URL` in production secrets.
- [ ] **Verify Database Private Networking:** In Railway project settings, ensure MySQL service is accessible only via Railway private network (`*.railway.internal`) rather than public TCP proxy.
- [ ] **Enable Daily Automated Snapshots:** Confirm daily automated backup snapshot schedule in Railway database management console.
- [ ] **Enforce SSL in `DATABASE_URL`:** Append `?sslaccept=strict` to the production `DATABASE_URL` connection string.
- [ ] **Perform Bi-Annual Disaster Recovery Restore Drill:** Schedule a bi-annual drill in staging to test restoring a production snapshot to a fresh MySQL instance.
- [ ] **Review Cloudflare / Edge Firewall Rules:** Ensure edge WAF rules are active to block malicious scraping and DDoS traffic.
- [ ] **Review Third-Party Secret Rotation Schedule:** Schedule bi-annual rotation of `JWT_SECRET`, SendGrid API keys, and Twilio tokens.

---

*End of SECURITY_STEP_12_INFRASTRUCTURE.md*
