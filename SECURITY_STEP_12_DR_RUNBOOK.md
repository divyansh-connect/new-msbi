# SECURITY STEP 12: DISASTER RECOVERY (DR) RUNBOOK
**Spine Brain Project — Operational & Disaster Recovery Procedures**
**Date:** 2026-08-24
**Scope:** Technical procedures for recovering from infrastructure failures, data corruption, security compromises, and operational disruptions.

---

## Executive Summary & DR Principles

This runbook establishes structured, step-by-step procedures for detecting, mitigating, and recovering from operational and disaster scenarios impacting the Spine Brain CRM. 

> [!IMPORTANT]
> **Operational Classification Principle:** Every procedure explicitly distinguishes between actions that are **AUTOMATED**, actions that are **MANUAL**, and items that are **MANUAL REVIEW REQUIRED**.
> **Compliance Notice:** Disaster recovery procedures must prioritize patient data confidentiality, data integrity, and compliance with the HIPAA Security Rule (45 CFR § 164.308(a)(7)). **This document does not certify the application as HIPAA compliant.**

---

## 1. Database Outage (MySQL Unavailability)

- **Classification:** **MANUAL** (Failover & restart monitoring) / **AUTOMATED** (Platform restart)
- **Detection:**
  - Health check endpoint `/health` or `/api/health` returns 500 or times out.
  - Pino backend logs report `PrismaClientInitializationError: Can't reach database server at ...` or `ECONNREFUSED`.
  - Application requests fail with HTTP 500 error responses.
- **Immediate Action:**
  1. Verify if the database hosting provider (e.g., Railway MySQL / Managed Cloud DB) is experiencing an active incident via provider status page.
  2. Attempt a graceful restart of the database instance via cloud hosting console.
- **Recovery Action:**
  1. If hosting platform provides high-availability multi-AZ standby, verify automatic failover initiation.
  2. If single-instance database failed, restart the service and check MySQL error logs for crash recovery (`InnoDB: Starting crash recovery`).
  3. Ensure database connection pool limit (default 9 connections) matches available MySQL connection capacity.
- **Validation:**
  1. Execute `npx prisma db pull` or run `npx ts-node check.ts` to confirm database connectivity.
  2. Query `/health` endpoint and verify HTTP 200 OK.
  3. Perform test user login on frontend to confirm session creation.
- **Rollback:** If container fails to boot after configuration change, revert environment variables to previous stable revision.
- **Escalation:** Escalate to Lead Database Administrator / Infrastructure Team if downtime exceeds 15 minutes.
- **Manual Dependencies:** Cloud hosting console access, database admin credentials.

---

## 2. Database Corruption

- **Classification:** **MANUAL** (Database point-in-time restore & integrity verification)
- **Detection:**
  - MySQL error logs show `InnoDB: Database page corruption` or table assertion errors.
  - Queries return `Table is marked as crashed and last (automatic?) repair failed` or inconsistent relation errors.
- **Immediate Action:**
  1. **ISOLATE TRAFFIC:** Immediately set backend application to maintenance mode or stop backend container to prevent writes to corrupted tables.
  2. Take a point-in-time snapshot / raw export of the existing database state for forensic analysis.
- **Recovery Action:**
  1. Identify the most recent uncorrupted automated backup snapshot.
  2. Provision a clean MySQL instance in a staging environment.
  3. Restore the uncorrupted backup snapshot to the clean instance.
  4. Run `npx prisma validate` and verify table row counts against pre-corruption metrics.
  5. If staging verification passes, update backend `DATABASE_URL` to point to the restored clean database instance.
- **Validation:**
  1. Run `npx ts-node test_resource_authorization.ts` and `npx ts-node test_audit_logging.ts`.
  2. Verify patient records, lead submissions, and user accounts match baseline counts.
  3. Verify audit log integrity (`SELECT COUNT(*) FROM activitylog`).
- **Rollback:** If restored database has integrity issues, restore the prior chronological backup snapshot.
- **Escalation:** Escalate to Chief Technology Officer and Compliance Officer immediately.
- **Manual Dependencies:** Backup snapshot repository access, staging MySQL environment.

---

## 3. Backend Application Outage

- **Classification:** **AUTOMATED** (Container restart by orchestrator) / **MANUAL** (Code rollback)
- **Detection:**
  - HTTP 502 Bad Gateway or 503 Service Unavailable returned by reverse proxy / edge.
  - Cloud monitoring reports container crash loop (`CrashLoopBackOff` or exit code 1).
- **Immediate Action:**
  1. Check deployment logs for startup fail-fast exceptions (`FATAL SECURITY CONFIGURATION: DATABASE_URL missing`, `FATAL: JWT_SECRET missing`).
  2. Check if a recent deployment or configuration change triggered the crash.
- **Recovery Action:**
  1. If caused by a bad code release: Trigger a rollback to the previous stable Git commit / deployment revision.
  2. If caused by out-of-memory (OOM): Increase container memory limits in hosting settings and restart.
  3. If caused by missing environment variable: Supply missing secret in hosting settings and redeploy.
- **Validation:**
  1. Verify `/health` returns 200 OK.
  2. Verify Fastify server logs indicate `Connected to MySQL Database via Prisma`.
- **Rollback:** Redeploy previous working container image tag.
- **Escalation:** DevOps / Lead Backend Engineer.
- **Manual Dependencies:** Hosting dashboard access.

---

## 4. Frontend Application Outage

- **Classification:** **AUTOMATED** (CDN edge distribution) / **MANUAL** (Static build rollback)
- **Detection:**
  - Browser displays 404 Not Found, 502 Bad Gateway, or white screen on frontend domain.
  - S3 / CDN / Vercel / Railway static server reports deployment failure.
- **Immediate Action:**
  1. Check browser developer console for bundle loading errors (`Failed to fetch dynamically imported module`).
  2. Check CDN / static hosting status.
- **Recovery Action:**
  1. Run `npm run build` in `Spine-brain-frontend` to verify production build succeeds locally (`dist/index.html` generated).
  2. If hosting deployment corrupted, trigger clean redeployment of `dist` bundle.
  3. Clear CDN edge cache.
- **Validation:**
  1. Load frontend application in incognito browser window.
  2. Confirm login page renders and Vite assets load over HTTPS.
- **Rollback:** Rollback static hosting to prior release build.
- **Escalation:** Lead Frontend Engineer.
- **Manual Dependencies:** CDN / Hosting provider console access.

---

## 5. DNS Outage

- **Classification:** **MANUAL** (DNS provider intervention)
- **Detection:**
  - Domain resolution fails globally (`NXDOMAIN` or `SERVFAIL`).
  - Uptime monitoring reports domain unreachable across external probes.
- **Immediate Action:**
  1. Check authoritative DNS provider (Cloudflare, Route53, Namecheap, etc.) for outage announcements.
  2. Verify domain registration expiration and nameserver delegation.
- **Recovery Action:**
  1. Verify A / CNAME records point to active reverse proxy or edge ingress endpoints.
  2. If primary DNS provider is down, switch nameservers to secondary provider if secondary DNS is configured.
  3. Keep DNS TTLs set to reasonable durations (300 seconds for critical services) during maintenance.
- **Validation:**
  1. Execute `nslookup <domain>` and `dig <domain> +trace` from multiple external networks.
- **Rollback:** Revert modified DNS records to previous working IP / CNAME targets.
- **Escalation:** Network Administrator / Domain Registrar.
- **Manual Dependencies:** DNS management portal credentials.

---

## 6. TLS Certificate Expiry or Failure

- **Classification:** **AUTOMATED** (Let's Encrypt / Managed Edge cert renewal) / **MANUAL** (Cert reissue)
- **Detection:**
  - Browsers show `NET::ERR_CERT_DATE_INVALID` or `SSL_ERROR_BAD_CERT_DOMAIN`.
  - Edge reverse proxy rejects incoming TLS connections.
- **Immediate Action:**
  1. Check certificate expiration date using `openssl s_client -connect <domain>:443 -servername <domain>`.
- **Recovery Action:**
  1. If managed edge (Cloudflare / Railway / AWS ACM): Trigger manual certificate renewal in cloud console.
  2. If Certbot / Let's Encrypt: Run `certbot renew --force-renewal` and reload web server (`nginx -s reload`).
  3. Verify CAA records in DNS permit the certificate authority (e.g., `letsencrypt.org`, `digicert.com`).
- **Validation:**
  1. Verify HTTPS connection succeeds in modern browser without certificate warnings.
  2. Check SSL Labs / OpenSSL report for valid chain and expiration > 30 days.
- **Rollback:** Reinstall previous valid certificate if renewal generated mismatched domain names.
- **Escalation:** Infrastructure Security Lead.
- **Manual Dependencies:** Certificate Authority portal / Cloud console access.

---

## 7. Credential & Secret Compromise

- **Classification:** **MANUAL** (Coordinated key rotation)
- **Detection:**
  - Unauthorized access observed in ActivityLog from unknown IP address.
  - Secret leaked in public git repository, logs, or external paste site.
- **Immediate Action:**
  1. **REVOKE SESSIONS:** Terminate all active sessions via database query (`UPDATE user_session SET revokedAt = NOW() WHERE revokedAt IS NULL`).
  2. Generate a new high-entropy 256-bit secret (`crypto.randomBytes(32).toString('hex')`).
  3. Update `JWT_SECRET` in production hosting environment variables.
  4. Restart backend container to immediately invalidate all outstanding JWT access tokens.
- **Recovery Action:**
  1. Rotate compromised API keys (SendGrid, Twilio, CallRail, Google OAuth secret).
  2. Invalidate third-party OAuth tokens in Google Cloud Console and re-authenticate.
  3. Review ActivityLog for unauthorized actions during the exposure window.
- **Validation:**
  1. Verify old JWT tokens are rejected with 401 Unauthorized.
  2. Verify new logins succeed and issue valid tokens.
- **Rollback:** N/A (Compromised credentials must NEVER be rolled back or re-used).
- **Escalation:** Chief Information Security Officer (CISO) and Legal Counsel.
- **Manual Dependencies:** Production environment secret manager access.

---

## 8. Integration Encryption Key Compromise

- **Classification:** **MANUAL** (Coordinated re-encryption migration)
- **Detection:**
  - `INTEGRATION_ENCRYPTION_KEY` exposed in repository or server breach.
- **Immediate Action:**
  1. Temporarily disable third-party background sync jobs (`isActive = false` in `IntegrationCredential`).
- **Recovery Action:**
  1. Generate new 32-byte AES-256 key (`crypto.randomBytes(32).toString('hex')`).
  2. Execute migration script to decrypt stored credentials using OLD key and re-encrypt with NEW key:
     ```ts
     const oldKey = Buffer.from(OLD_KEY_HEX, 'hex');
     const newKey = Buffer.from(NEW_KEY_HEX, 'hex');
     // Decrypt with oldKey, encrypt with newKey, update DB records in transaction
     ```
  3. Update `INTEGRATION_ENCRYPTION_KEY` in production environment variables.
  4. Re-enable sync jobs.
- **Validation:**
  1. Run `npx ts-node test_third_party_security.ts` to verify credential encryption/decryption round-trip.
  2. Trigger test integration status check (`GET /api/v1/integrations/status`).
- **Rollback:** Retain backup of encrypted values before re-encryption migration.
- **Escalation:** Security Lead & Database Administrator.
- **Manual Dependencies:** DB migration execution script.

---

## 9. Third-Party Provider Outage

- **Classification:** **AUTOMATED** (Circuit breaking / error handling) / **MANUAL** (Sync pausing)
- **Detection:**
  - Third-party API calls (Google, Meta, CallRail, HubSpot) return 5xx errors or time out.
  - Integration status transitions to `error` state in `IntegrationCredential` table.
- **Immediate Action:**
  1. Check provider status pages (Google Workspace, Meta Business Status, CallRail Status).
- **Recovery Action:**
  1. Core CRM operations (User auth, patient records, leads, campaigns) continue functioning independently.
  2. Background sync intervals back off automatically.
  3. When provider recovers, trigger manual sync via `POST /api/v1/integrations/sync` from Admin settings.
- **Validation:**
  1. Verify `lastSuccessfulSyncAt` updates on subsequent sync run.
  2. Verify no unhandled exceptions crash backend server.
- **Rollback:** Disable specific failing integration toggle until provider stabilizes.
- **Escalation:** Integrations Lead.
- **Manual Dependencies:** Integration Admin UI toggle.

---

## 10. Backup Restore Procedure (Step-by-Step)

- **Classification:** **MANUAL** (Requires human verification)
- **Procedure:**
  1. **Prepare Target Database:** Provision a dedicated recovery MySQL instance. Never restore over active production without pre-restore snapshot.
  2. **Retrieve Backup:** Download the designated point-in-time SQL dump or snapshot from secure, encrypted backup storage.
  3. **Execute Restore:**
     ```bash
     mysql -h <recovery_host> -u <recovery_user> -p <recovery_database> < backup_file.sql
     ```
  4. **Run Schema Validation:**
     ```bash
     DATABASE_URL="mysql://..." npx prisma validate
     ```
  5. **Data Integrity Audit:**
     - Verify record counts in `User`, `Role`, `ActivityLog`, `Lead`, `Campaign`, `Vendor`.
     - Verify foreign key constraints are intact without orphaned records.
  6. **Cutover Traffic:** Update backend `DATABASE_URL` secret to point to the validated recovered database and restart backend.
  7. **Post-Restore Verification:** Run `npx ts-node test_infrastructure_security.ts` and verify 100% test pass rate.

---

## 11. Full Environment Rebuild Procedure

- **Classification:** **MANUAL**
- **Procedure:**
  1. **Provision Infrastructure:** Deploy fresh Linux container / server environment with Node.js 18+ and MySQL 8.0+.
  2. **Clone Codebase:** Check out verified production Git commit tag.
  3. **Restore Database:** Execute Backup Restore Procedure (Section 10).
  4. **Configure Secrets:** Populate `.env` from secure enterprise password vault (`DATABASE_URL`, `JWT_SECRET`, `INTEGRATION_ENCRYPTION_KEY`, webhook secrets).
  5. **Build Backend:** `npm ci && npm run build` in `Spine-Brain-backend`.
  6. **Build Frontend:** `npm ci && npm run build` in `Spine-brain-frontend`.
  7. **Launch Services:** Start backend process with process manager (`npm run start` or container supervisor).
  8. **Configure Reverse Proxy:** Set up Nginx/Cloudflare HTTPS termination and forward `/api` to port 8000 and `/` to static frontend build.
  9. **Execute Full Security Suite:** Run all security test suites (Steps 2–12) to verify full operational readiness.

---

*End of SECURITY_STEP_12_DR_RUNBOOK.md*
