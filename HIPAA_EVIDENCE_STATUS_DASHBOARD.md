# HIPAA EVIDENCE STATUS DASHBOARD
**System:** Spine Brain / Midwest Spine & Brain Institute (MSBI) Clinical Intelligence CRM  
**Date:** 2026-08-25  
**Technical Security Status:** 497 / 497 Automated Security Assertions PASSED  
**Governance Framework:** HIPAA Security, Privacy & Breach Notification Rules  

---

> [!IMPORTANT]
> ### THREE-TIER COMPLIANCE CLASSIFICATION
> - **🟢 GREEN (Technically Verified)**: 100% complete in application code and verified by automated regression test suites.
> - **🟡 YELLOW (Infrastructure / Cloud Configuration)**: Operational and storage controls active on cloud hosting requiring documentary verification.
> - **🔴 RED (Manual / Organizational / Legal)**: Institutional policies, workforce procedures, physical security, and legal contracts required for full organizational compliance.

---

## 🟢 GREEN — IMPLEMENTED AND TECHNICALLY VERIFIED

All controls in this section are fully implemented in application source code, backed by database constraints, and verified by 497 automated security assertions across 16 regression test suites.

| Security Domain | Specific Control Implemented | Code / Schema Evidence | Test Suite & Baseline |
|:---|:---|:---|:---|
| **Authentication** | Bcrypt password hashing (cost 10+), generic error messages preventing user enumeration, account deactivation guard. | `src/services/auth.service.ts`, `src/middlewares/auth.middleware.ts` | `test_auth_security.ts` (41/41 PASSED) |
| **RBAC & Authorization** | Dynamic role-based permissions matrix, `requirePermission` preHandler hook, admin super-role bypass. | `src/middlewares/rbac.middleware.ts`, `src/controllers/rbac.controller.ts` | `test_rbac_security.ts` (26/26 PASSED) |
| **Resource Auth / IDOR** | Relational ownership checks, tenant isolation, user ID binding for leads, calls, forms, campaigns. | `src/utils/resource-auth.ts`, `src/controllers/leads.controller.ts` | `test_resource_authorization.ts` (16/16 PASSED) |
| **Audit Logging** | Centralized immutable `ActivityLog` table, tracking IP, user ID, role, method, route, resource, success/failure. | `src/services/audit.service.ts`, `prisma/schema.prisma` | `test_audit_logging.ts` (13/13 PASSED) |
| **Session Security** | 15-min JWT access tokens, 7-day DB session TTL, refresh token rotation, token reuse detection, all-session revoke. | `src/services/auth.service.ts`, `src/models/userSession` | `test_session_security.ts` (48/48 PASSED) |
| **Secrets & Encryption** | AES-256-GCM authenticated encryption (`v1:iv:tag:ciphertext`), 32-byte key length startup guard, env isolation. | `src/utils/crypto.ts`, `.gitignore`, `.dockerignore` | `test_secrets_security.ts` (30/30 PASSED) |
| **API Security** | Global rate limiting, 1MB payload limits, Zod schema validation, generic 500 errors (zero stack leakage). | `src/app.ts`, `src/middlewares/error.middleware.ts` | `test_api_security.ts` (33/33 PASSED) |
| **PHI-Safe Logging** | Pino structured logger with redaction for authorization, cookies, passwords, tokens, API keys, SSNs, credit cards. | `src/utils/logger.ts`, `src/middlewares/error.middleware.ts` | `test_phi_frontend_security.ts` (12/12 PASSED) |
| **Files & Data Exports** | In-memory client streaming, CSV formula injection defense (`'` prefix), zero server-side export caching. | `src/utils/exportUtils.ts`, `src/controllers/reports.controller.ts` | `test_file_security.ts` (41/41 PASSED) |
| **Third-Party Security** | Encrypted integration tokens, webhook secret verification, outbound PHI transmission blockers for ad networks. | `src/services/integrations.service.ts`, `src/services/wordpress.service.ts` | `test_third_party_security.ts` (37/37 PASSED) |
| **Infrastructure Readiness** | Container non-root execution, readiness probes, environment segregation, DB connection pooling. | `Dockerfile`, `src/server.ts`, `src/plugins/db.ts` | `test_infrastructure_security.ts` (28/28 PASSED) |
| **HIPAA Technical Controls** | Technical safeguard mapping, emergency access override, minimum necessary response shaping. | `src/controllers/compliance.controller.ts` | `test_hipaa_compliance_controls.ts` (25/25 PASSED) |
| **Multi-Factor Auth (MFA)** | RFC 6238 TOTP, encrypted secrets at rest, single-use 5-min challenges, 10 hashed SHA-256 recovery codes. | `src/services/mfa.service.ts`, `src/routes/auth.routes.ts` | `test_mfa_security.ts` (64/64 PASSED) |
| **Backup & DR Diagnostics** | `/api/v1/compliance/recovery-status` endpoint, non-destructive 16-model DB integrity check, secret presence. | `src/controllers/compliance.controller.ts` | `test_backup_recovery_security.ts` (38/38 PASSED) |
| **Production Hardening** | Security headers (CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff), CORS whitelist. | `src/middlewares/security-headers.middleware.ts`, `src/app.ts` | `test_step16_final_security.ts` (45/45 PASSED) |

---

## 🟡 YELLOW — INFRASTRUCTURE / CONFIGURATION EVIDENCE REQUIRED

These controls are active on cloud infrastructure (Railway Managed MySQL and Cloud Edge) and require documentary exports, console configuration validation, and periodic verification records.

| Infrastructure Item | What Must Be Verified | Who Should Verify | Evidence / Screenshot Required | Evidence Storage Location | Re-check Cadence |
|:---|:---|:---|:---|:---|:---|
| **Railway Container Hosting** | Ephemeral container execution, non-root user, private environment secret injection. | `<IT_OWNER>` | Railway project settings screenshot showing private environment variables and container specs. | `compliance/evidence/14-infrastructure/` | Semi-Annual |
| **Managed MySQL 8.0 Hosting** | Railway MySQL 8.0 instance active, private networking enabled, zero public IP binding. | `<IT_OWNER>` | Railway MySQL service dashboard screenshot showing private network endpoint. | `compliance/evidence/14-infrastructure/` | Quarterly |
| **Edge TLS / SSL Termination** | Automated TLS 1.2+ certificate, valid HTTPS redirection, valid domain certificate. | `<IT_OWNER>` | SSL Labs Server Test report (Target: A+ grade) and certificate validity export. | `compliance/evidence/14-infrastructure/` | Annual / On Renewal |
| **Database Encryption at Rest** | Underlying cloud block volume encryption (AES-256) active on MySQL storage volume. | `<IT_OWNER>` | Railway / underlying cloud infrastructure storage encryption documentation/attestation. | `compliance/evidence/07-encryption/` | Annual |
| **Automated Snapshot Backups** | Daily automated snapshot backups configured, rolling retention window (7–30 days). | `<IT_OWNER>` | Railway Managed Database backup schedule & history screenshot. | `compliance/evidence/13-backup-dr/` | Monthly |
| **Point-in-Time Recovery (PITR)** | Transactional binary logging active, ability to restore to specific timestamp. | `<IT_OWNER>` | Backup restore option screenshot in Railway dashboard. | `compliance/evidence/13-backup-dr/` | Semi-Annual |
| **Private Networking / Firewall** | MySQL instance unreachable directly from the public internet (Fastify proxy only). | `<IT_OWNER>` | Network firewall rules and external port scan result showing port 3306 closed publicly. | `compliance/evidence/14-infrastructure/` | Semi-Annual |
| **Production Environment Guard** | `NODE_ENV=production` set in Railway environment to enforce HSTS and generic 500 error responses. | `<IT_OWNER>` | Backend environment variable configuration export (with secrets redacted). | `compliance/evidence/14-infrastructure/` | On Every Deployment |

---

## 🔴 RED — MANUAL / ORGANIZATIONAL / LEGAL REQUIREMENTS

These controls are human, legal, administrative, and physical procedures that operate outside software source code and must be completed by designated organizational personnel.

| Governance Item | Regulatory Ref | Description & Required Action | Responsible Owner | Target Completion Artifact |
|:---|:---|:---|:---|:---|
| **HIPAA Security Officer Appointment** | 45 CFR § 164.308(a)(2) | Formally appoint the designated HIPAA Security Officer in writing with signed board/executive authorization. | `<EXECUTIVE_LEADERSHIP>` | Signed appointment letter in `compliance/evidence/01-governance/` |
| **HIPAA Privacy Officer Appointment** | 45 CFR § 164.530(a)(1) | Formally appoint the designated HIPAA Privacy Officer responsible for privacy policies and patient rights. | `<EXECUTIVE_LEADERSHIP>` | Signed appointment letter in `compliance/evidence/01-governance/` |
| **Annual Risk Assessment Sign-Off** | 45 CFR § 164.308(a)(1)(ii)(A) | Review and formally approve `HIPAA_RISK_ANALYSIS.md` with executive leadership and clinical management. | `<SECURITY_OFFICER>` | Signed risk assessment sign-off sheet in `compliance/evidence/02-risk-management/` |
| **Risk Treatment Plan Review** | 45 CFR § 164.308(a)(1)(ii)(B) | Review the risk mitigation progress documented in `HIPAA_RISK_TREATMENT_REGISTER.md`. | `<SECURITY_OFFICER>` | Quarterly risk meeting minutes in `compliance/evidence/02-risk-management/` |
| **Workforce HIPAA Security Training** | 45 CFR § 164.308(a)(5) | Deliver annual mandatory HIPAA security awareness and phishing training to all active staff. | `<COMPLIANCE_OWNER>` | Attendance roster & certificates in `compliance/evidence/16-training/` |
| **Employee Training Acknowledgments** | 45 CFR § 164.308(a)(5) | Obtain signed policy acknowledgment forms from all workforce members regarding acceptable use and security. | `<HR_OWNER>` | Signed acknowledgment forms in `compliance/evidence/16-training/` |
| **Workforce Sanctions Policy Adoption** | 45 CFR § 164.308(a)(1)(ii)(C) | Incorporate `WORKFORCE_SANCTIONS_POLICY.md` into employee handbook and HR disciplinary procedures. | `<HR_OWNER>` | HR handbook copy in `compliance/evidence/03-workforce/` |
| **Incident Response Team Roster** | 45 CFR § 164.308(a)(6) | Formally establish on-call Incident Response Team with primary/secondary contact details. | `<SECURITY_OFFICER>` | Signed IR roster in `compliance/evidence/12-incident-response/` |
| **Incident Response Tabletop Exercise** | 45 CFR § 164.308(a)(6) | Conduct an annual simulated breach scenario exercise and document lessons learned. | `<SECURITY_OFFICER>` | Tabletop post-mortem report in `compliance/evidence/12-incident-response/` |
| **Business Associate Agreement: Railway** | 45 CFR § 164.502(e) | Execute a formal, countersigned Business Associate Agreement with Railway Corp. for hosting & MySQL. | `<LEGAL_COUNSEL>` | Executed BAA PDF in `compliance/evidence/11-integrations-baas/` |
| **Business Associate Agreement: CallRail** | 45 CFR § 164.502(e) | Execute a formal Healthcare BAA with CallRail, Inc. for telephony and call recordings. | `<LEGAL_COUNSEL>` | Executed BAA PDF in `compliance/evidence/11-integrations-baas/` |
| **Semi-Annual Access Review** | 45 CFR § 164.308(a)(4) | Review all active CRM accounts, disable obsolete logins, adjust roles, and sign access certification. | `<IT_OWNER>` / `<SECURITY_OFFICER>` | Signed access review report in `compliance/evidence/17-periodic-reviews/` |
| **Monthly Audit Log Review** | 45 CFR § 164.308(a)(1)(ii)(D) | Review `ActivityLog` entries for anomalies, failed logins, and unauthorized access attempts. | `<SECURITY_OFFICER>` | Monthly signed audit log review sheet in `compliance/evidence/06-audit-logging/` |
| **Annual DR Restore Exercise** | 45 CFR § 164.308(a)(7)(ii)(B) | Perform a live dry-run restoration of a snapshot backup to an isolated staging DB and verify data integrity. | `<IT_OWNER>` | DR test report & recovery log in `compliance/evidence/13-backup-dr/` |
| **Physical Facility Security Audit** | 45 CFR § 164.310(a) | Audit physical locks, visitor sign-in logs, and badge access at MSBI clinic locations. | `<FACILITIES_LEAD>` | Physical security checklist in `compliance/evidence/15-physical-security/` |
| **Workstation Privacy & Screen Locks** | 45 CFR § 164.310(c) | Install privacy filters on clinic front desk monitors; enforce 5-min automated OS screen lock. | `<IT_OWNER>` | Clinic workstation audit sheet in `compliance/evidence/15-physical-security/` |
| **Hardware Disposal Documentation** | 45 CFR § 164.310(d)(2)(i) | Retain certificates of data destruction for retired clinic laptops and hard drives (NIST SP 800-88). | `<IT_OWNER>` | Certificates of destruction in `compliance/evidence/15-physical-security/` |
| **Offline Cryptographic Key Escrow** | 45 CFR § 164.312(a)(2)(iv) | Back up `INTEGRATION_ENCRYPTION_KEY` and `JWT_SECRET` in an offline, encrypted enterprise password vault. | `<SECURITY_OFFICER>` | Key custody sign-off sheet in `compliance/evidence/07-encryption/` |
| **Compliance Document Archival** | 45 CFR § 164.316(b)(2)(i) | Establish 6-year archival storage policy for compliance records, audit logs, and training receipts. | `<COMPLIANCE_OWNER>` | Document retention log in `compliance/evidence/01-governance/` |
