# HIPAA EVIDENCE COLLECTION & AUDIT READINESS GUIDE
**System:** Spine Brain / Midwest Spine & Brain Institute (MSBI) Clinical Intelligence CRM  
**Date:** 2026-08-25  
**Audience:** HIPAA Security Officer, Privacy Officer, IT Administrators, Legal Counsel, and External HIPAA Compliance Auditors  

---

> [!CAUTION]
> ### STRICT EVIDENCE SANITIZATION RULE
> **NEVER include raw plaintext passwords, JWT secrets, database connection passwords, encryption keys (`INTEGRATION_ENCRYPTION_KEY`), third-party API keys, access tokens, live patient identifiers, medical record numbers, or MFA recovery codes in evidence documents or screenshots.**  
> All configuration evidence must redact credentials with `[REDACTED]` or mask sensitive fields. Sample data must utilize synthetic test records only.

---

## 1. Overview & Evidence Standard

To satisfy HIPAA Security Rule (§ 164.308, § 164.310, § 164.312) audit requirements, an organization must present verifiable technical, operational, and documentary proof of compliance. This guide details the specific artifacts, screenshots, exports, and reports required for each security domain.

---

## 2. Domain-by-Domain Evidence Collection Requirements

### A. Application & Schema Evidence
| Evidence Artifact | Purpose | How to Generate / Collect | Destination Folder |
|:---|:---|:---|:---|
| **Prisma Database Schema** | Proves referential integrity, entity isolation, and indexed security models. | Export `prisma/schema.prisma`. | `01-governance/` |
| **Prisma Validation Output** | Confirms schema syntax and model integrity. | Run `npx prisma validate` and save terminal log. | `01-governance/` |
| **TypeScript Build Log** | Confirms code compilation and zero type errors. | Run `npx tsc --noEmit` and capture console log. | `01-governance/` |
| **Master Security Regression Log** | Proves 497/497 automated technical assertions pass. | Run `npx ts-node run_all_security_tests.ts` and capture full output. | `01-governance/` |

### B. Authentication & Session Evidence
| Evidence Artifact | Purpose | How to Generate / Collect | Destination Folder |
|:---|:---|:---|:---|
| **Password Hashing Evidence** | Proves Bcrypt with cost factor 10+ is enforced. | Export `src/services/auth.service.ts` + `test_auth_security.ts` test log. | `05-authentication/` |
| **Generic Auth Error Proof** | Proves application prevents user enumeration. | Capture `test_auth_security.ts` assertion output. | `05-authentication/` |
| **JWT & Session TTL Config** | Proves 15-min token expiration and 7-day DB session tracking. | Capture `src/middlewares/auth.middleware.ts` + `test_session_security.ts` log. | `05-authentication/` |
| **Session Rotation & Revocation** | Proves refresh token rotation and token reuse detection. | Capture `test_session_security.ts` test results (48 assertions). | `05-authentication/` |

### C. Multi-Factor Authentication (MFA) Evidence
| Evidence Artifact | Purpose | How to Generate / Collect | Destination Folder |
|:---|:---|:---|:---|
| **RFC 6238 TOTP Implementation** | Proves standard TOTP with 160-bit Base32 encrypted secrets. | Export `src/services/mfa.service.ts` (sanitized). | `09-mfa/` |
| **MFA Test Suite Results** | Proves enrollment, verification, single-use challenges, and recovery codes. | Capture `test_mfa_security.ts` test log (64 assertions). | `09-mfa/` |
| **MFA Challenge Replay Protection** | Proves 5-min TTL and single-use atomic update guards. | Capture Step 14 / Step 16 test results. | `09-mfa/` |
| **MFA User Enrollment Report** | Lists workforce users with active MFA status. | Query `/api/v1/users` (Admin) and export user list showing `mfa.enabled: true`. | `09-mfa/` |

### D. Role-Based Access Control (RBAC) & Authorization Evidence
| Evidence Artifact | Purpose | How to Generate / Collect | Destination Folder |
|:---|:---|:---|:---|
| **RBAC Matrix Implementation** | Proves database-backed permission enforcement. | Export `src/middlewares/rbac.middleware.ts` + `WORKFORCE_ACCESS_MATRIX.md`. | `04-access-control/` |
| **RBAC Test Suite Results** | Confirms all permissions and super-role bypasses pass. | Capture `test_rbac_security.ts` log (26 assertions). | `04-access-control/` |
| **Resource Authorization / IDOR** | Proves tenant isolation and ownership validation for leads/calls/forms. | Capture `test_resource_authorization.ts` log (16 assertions). | `04-access-control/` |
| **Semi-Annual Access Review Sign-Off** | Proves management conducts periodic access reviews. | Completed & signed `HIPAA_MANUAL_COMPLIANCE_CHECKLIST.md` (MC-12). | `17-periodic-reviews/` |

### E. Audit Logging & PHI Redaction Evidence
| Evidence Artifact | Purpose | How to Generate / Collect | Destination Folder |
|:---|:---|:---|:---|
| **Audit Service Architecture** | Proves immutable `ActivityLog` recording all security events. | Export `src/services/audit.service.ts`. | `06-audit-logging/` |
| **Pino PHI Redaction Config** | Proves passwords, tokens, API keys, SSNs, and credit cards are redacted. | Export `src/utils/logger.ts`. | `06-audit-logging/` |
| **Audit Logging Test Suite** | Confirms audit log creation and query filtering pass. | Capture `test_audit_logging.ts` log (13 assertions). | `06-audit-logging/` |
| **Sample Sanitized Audit Trail** | Demonstrates real audit records with sanitized fields. | Query `GET /api/v1/compliance/audit-logs?limit=10` and export JSON. | `06-audit-logging/` |
| **Monthly Audit Review Log** | Proves Security Officer reviews audit logs monthly. | Completed monthly review sheet signed by Security Officer. | `06-audit-logging/` |

### F. Cryptography & Key Management Evidence
| Evidence Artifact | Purpose | How to Generate / Collect | Destination Folder |
|:---|:---|:---|:---|
| **AES-256-GCM Implementation** | Proves authenticated field encryption (`v1:iv:tag:ciphertext`). | Export `src/utils/crypto.ts`. | `07-encryption/` |
| **Key-Length Guard Proof** | Proves system fails closed if encryption key != 32 bytes. | Capture `test_secrets_security.ts` assertion log. | `07-encryption/` |
| **Environment Variable Isolation** | Proves secrets are excluded from Git repositories. | Export `.gitignore`, `.dockerignore`, and `.env.example`. | `07-encryption/` |
| **Offline Key Custody Sign-Off** | Proves `INTEGRATION_ENCRYPTION_KEY` is backed up in secure vault. | Signed key custody certification sheet (zero plaintext keys). | `07-encryption/` |

### G. API & Transport Security Evidence
| Evidence Artifact | Purpose | How to Generate / Collect | Destination Folder |
|:---|:---|:---|:---|
| **Security Response Headers** | Proves CSP, HSTS, X-Frame-Options: DENY, nosniff are applied. | Export `src/middlewares/security-headers.middleware.ts`. | `08-api-security/` |
| **SSL Labs Server Test Report** | Proves TLS 1.2+ encryption in transit (Target: A+ grade). | Run SSL Labs test on production domain and save PDF report. | `08-api-security/` |
| **Rate Limiting & Payload Limits** | Proves DDoS/brute-force defense and 1MB request limits. | Capture `test_api_security.ts` test results. | `08-api-security/` |
| **CORS Configuration Evidence** | Proves strict origin whitelisting in production. | Export CORS configuration block from `src/app.ts`. | `08-api-security/` |

### H. Files, Documents & Data Export Evidence
| Evidence Artifact | Purpose | How to Generate / Collect | Destination Folder |
|:---|:---|:---|:---|
| **In-Memory Streaming Export** | Proves exports stream to browser without server disk persistence. | Export `src/utils/exportUtils.ts`. | `10-files-exports/` |
| **CSV Injection Defense** | Proves formula injection characters (`=`, `+`, `-`, `@`) are sanitized. | Capture `test_file_security.ts` test log (41 assertions). | `10-files-exports/` |
| **Export Access RBAC Guard** | Proves only authorized roles can trigger reports/exports. | Capture Step 10 authorization test results. | `10-files-exports/` |

### I. Cloud Infrastructure & Database Evidence
| Evidence Artifact | Purpose | How to Generate / Collect | Destination Folder |
|:---|:---|:---|:---|
| **Railway Hosting Settings** | Proves containerized execution and private networking. | Screenshot of Railway Project dashboard (redact tokens). | `14-infrastructure/` |
| **Railway Managed MySQL Config** | Proves MySQL 8.0, SSL connection, private network binding. | Screenshot of Railway MySQL service settings. | `14-infrastructure/` |
| **Storage Encryption at Rest** | Proves underlying storage volume encryption. | Cloud provider technical specification / compliance attestation. | `14-infrastructure/` |
| **Daily Snapshot Backup Config** | Proves automated daily backups and retention window. | Screenshot of Railway database backup history & schedule. | `13-backup-dr/` |
| **Disaster Recovery Health Endpoint** | Proves `/api/v1/compliance/recovery-status` diagnostics pass. | Query `/api/v1/compliance/recovery-status` and save JSON response. | `13-backup-dr/` |
| **Annual DR Restore Test Report** | Proves data restoration was successfully tested to staging DB. | Completed DR restoration runbook log with verification sign-off. | `13-backup-dr/` |

### J. Incident Response Evidence
| Evidence Artifact | Purpose | How to Generate / Collect | Destination Folder |
|:---|:---|:---|:---|
| **Incident Response Plan** | Proves defined procedures for breach detection, triage, and reporting. | Export `SECURITY_STEP_12_INCIDENT_RESPONSE.md`. | `12-incident-response/` |
| **Active IR Team Contact Roster** | Identifies primary/secondary on-call incident responders. | Completed contact sheet with roles, names, and 24/7 phone numbers. | `12-incident-response/` |
| **Annual Tabletop Exercise Report** | Proves team tested breach notification workflows (§ 164.404). | Post-exercise summary report signed by Security Officer. | `12-incident-response/` |

### K. Workforce & Governance Evidence
| Evidence Artifact | Purpose | How to Generate / Collect | Destination Folder |
|:---|:---|:---|:---|
| **Security Officer Appointment Letter** | Proves formal assignment of security responsibility (§ 164.308(a)(2)). | Letter signed by Board / CEO naming HIPAA Security Officer. | `01-governance/` |
| **Workforce Training Records** | Proves 100% staff completion of annual HIPAA security training. | Signed attendance rosters, LMS completion export, certificates. | `16-training/` |
| **Policy Acknowledgment Forms** | Proves employees reviewed and agreed to security policies. | Signed employee acknowledgment forms for all active users. | `16-training/` |
| **Employee Exit Checklists** | Proves prompt deactivation upon employee termination. | Completed HR exit checklists matched with CRM deactivation timestamps. | `03-workforce/` |

### L. Business Associate Agreements (BAAs)
| Evidence Artifact | Purpose | How to Generate / Collect | Destination Folder |
|:---|:---|:---|:---|
| **Railway Corp. BAA** | Proves cloud hosting vendor is under executed BAA contract. | Executed, countersigned Business Associate Agreement PDF. | `11-integrations-baas/` |
| **CallRail, Inc. BAA** | Proves telephony/recording vendor is under executed BAA contract. | Executed, countersigned Healthcare BAA PDF. | `11-integrations-baas/` |
| **Vendor Risk Register** | Documents annual security review of all third parties. | Export `VENDOR_RISK_REGISTER.md`. | `11-integrations-baas/` |

---

## 3. Evidence Collection Quality Checklist

Before submitting an evidence pack to external auditors, verify:
- [ ] Every technical control is accompanied by corresponding automated test log output.
- [ ] Every screenshot has sensitive API keys, passwords, and tokens blacked out / blurred.
- [ ] No live patient records (real names, SSNs, phone numbers) exist in sample outputs.
- [ ] All policy documents have approved version numbers and effective dates.
- [ ] All manual sign-off sheets contain real signatures, dates, and reviewer names.
- [ ] Evidence files follow the standard naming convention (see `HIPAA_EVIDENCE_NAMING_STANDARD.md`).
