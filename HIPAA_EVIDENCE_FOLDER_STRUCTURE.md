# HIPAA EVIDENCE REPOSITORY & FOLDER STRUCTURE
**System:** Spine Brain / Midwest Spine & Brain Institute (MSBI) Clinical Intelligence CRM  
**Date:** 2026-08-25  
**Root Path:** `compliance/evidence/`  

---

## 1. Directory Tree Architecture

The standardized evidence repository organizes technical test results, cloud infrastructure exports, signed policies, training records, and executed legal contracts into 17 indexed directories matching HIPAA Security, Privacy, and Breach Notification Rule specifications.

```
compliance/
  evidence/
    ├── 01-governance/          # Security Officer appointments, charter, executive sign-offs
    ├── 02-risk-management/     # Risk analyses, treatment plans, risk committee minutes
    ├── 03-workforce/           # Workforce onboarding, clearances, exit checklists, sanctions
    ├── 04-access-control/      # RBAC matrices, IDOR test results, access authorization logs
    ├── 05-authentication/     # Password security, Bcrypt evidence, session TTL test logs
    ├── 06-audit-logging/       # ActivityLog schema, Pino redaction config, monthly review sheets
    ├── 07-encryption/          # AES-256-GCM implementation, key guard logs, offline key custody
    ├── 08-api-security/        # Security headers, HSTS, CORS, rate limiting test results
    ├── 09-mfa/                 # RFC 6238 TOTP implementation, 64 MFA test assertions, UI guides
    ├── 10-files-exports/       # In-memory streaming, CSV formula injection defense results
    ├── 11-integrations-baas/   # Executed BAAs (Railway, CallRail), vendor risk assessments
    ├── 12-incident-response/   # Incident response plan, on-call roster, tabletop exercise reports
    ├── 13-backup-dr/           # Cloud snapshot configs, DR runbook, /recovery-status API logs
    ├── 14-infrastructure/      # Railway container configs, TLS certs, MySQL private network proof
    ├── 15-physical-security/   # Clinic physical audit logs, privacy filters, disposal certificates
    ├── 16-training/            # Annual HIPAA training syllabus, attendance rosters, certificates
    └── 17-periodic-reviews/    # Semi-annual access review sign-offs, annual security evaluations
```

---

## 2. Directory Contents & Artifact Specifications

### `01-governance/` (Administrative Governance & Legal Structure)
- Formal HIPAA Security Officer Appointment Letter (Signed).
- Formal HIPAA Privacy Officer Appointment Letter (Signed).
- Compliance Document Retention Policy (`COMPLIANCE_DOCUMENT_RETENTION_POLICY.md`).
- Master Security Regression Summary Output (497/497 passed).

### `02-risk-management/` (Risk Assessment & Mitigation)
- Annual Enterprise HIPAA Security Risk Assessment (`HIPAA_RISK_ANALYSIS.md`).
- Active Risk Mitigation & Remediation Register (`HIPAA_RISK_TREATMENT_REGISTER.md`).
- Quarterly Compliance Risk Committee Meeting Minutes.

### `03-workforce/` (Workforce Security & Sanctions)
- Workforce Lifecycle & Access Policy (`WORKFORCE_LIFECYCLE_POLICY.md`).
- Workforce Sanctions Policy & Employee Manual Addendum (`WORKFORCE_SANCTIONS_POLICY.md`).
- Sample Employee Onboarding Access Request Forms & Confidentiality Agreements.
- Sample Employee Deprovisioning & Exit Sign-Off Checklists.

### `04-access-control/` (RBAC, Authorization & Minimum Necessary)
- Workforce Role-to-Permission Matrix (`WORKFORCE_ACCESS_MATRIX.md`).
- Role-Based Access Control Middleware Source & Test Output (`test_rbac_security.ts`).
- Resource Authorization & IDOR Protection Test Output (`test_resource_authorization.ts`).

### `05-authentication/` (Person Authentication & Session Management)
- Password Policy Specification (`PASSWORD_POLICY.md`).
- Authentication Security Test Output (`test_auth_security.ts`).
- Session Security & Refresh Token Rotation Test Output (`test_session_security.ts`).

### `06-audit-logging/` (Audit Controls & PHI Redaction)
- Audit Logging Architecture & Policy (`AUDIT_LOG_POLICY.md`).
- Pino Structured Redaction Configuration (`src/utils/logger.ts`).
- Audit Logging Test Output (`test_audit_logging.ts`).
- Monthly Signed Audit Log Review Worksheets (Retained for 6 years).

### `07-encryption/` (Cryptographic Safeguards & Key Escrow)
- AES-256-GCM Field Encryption Source (`src/utils/crypto.ts`).
- Secrets & Environment Security Test Output (`test_secrets_security.ts`).
- Signed Offline Cryptographic Key Escrow Certification (Zero plaintext keys).

### `08-api-security/` (API Protection & Transport Security)
- Security Response Headers Middleware Source (`src/middlewares/security-headers.middleware.ts`).
- API Security & Rate Limiting Test Output (`test_api_security.ts`).
- SSL Labs Server Test Report (Target: A+ grade) for production domain.

### `09-mfa/` (Multi-Factor Authentication)
- Multi-Factor Authentication Architecture Report (`SECURITY_STEP_14_MFA.md`).
- MFA Security Test Suite Output (`test_mfa_security.ts` — 64 assertions passed).
- MFA User Enrollment & Verification Workflow Documentation.

### `10-files-exports/` (Files, Documents & Export Protection)
- Data Export Policy (`DATA_EXPORT_POLICY.md`).
- In-Memory Client Streaming Source (`src/utils/exportUtils.ts`).
- File & Export Security Test Output (`test_file_security.ts` — 41 assertions passed).

### `11-integrations-baas/` (Business Associate Agreements & Vendors)
- Business Associate Agreement Register (`BAA_REGISTER.md`).
- Executed, Countersigned BAA with Railway Corp. (PDF).
- Executed, Countersigned Healthcare BAA with CallRail, Inc. (PDF).
- Vendor Risk Register & Security Assessments (`VENDOR_RISK_REGISTER.md`).

### `12-incident-response/` (Incident Management & Breach Notification)
- Security Incident Response Plan (`SECURITY_STEP_12_INCIDENT_RESPONSE.md`).
- Incident Response Team Active On-Call Contact Roster.
- Annual Incident Response Tabletop Simulation Report & Action Items.

### `13-backup-dr/` (Contingency Planning, Backup & Disaster Recovery)
- Disaster Recovery & Contingency Runbook (`SECURITY_STEP_12_DR_RUNBOOK.md`).
- Backup & DR Security Test Output (`test_backup_recovery_security.ts` — 38 assertions passed).
- Railway Managed MySQL Backup Configuration & Snapshot Schedule Screenshots.
- Annual Dry-Run Database Restoration Report & Record Integrity Matches.

### `14-infrastructure/` (Hosting, Database & Network Architecture)
- Infrastructure Security Specification (`SECURITY_STEP_12_INFRASTRUCTURE.md`).
- Railway Container Environment Settings & Non-Root Execution Evidence.
- MySQL 8.0 Private Network Configuration & Port Scan Results (Port 3306 Closed Publicly).

### `15-physical-security/` (Facility & Workstation Physical Safeguards)
- MSBI Clinic Physical Security Inspection Checklists (Door locks, visitor sign-in).
- Clinic Workstation Audit Logs (Privacy screens, 5-minute automated OS lock).
- Certificates of Data Sanitization / Destruction for Retired Hardware (NIST SP 800-88).

### `16-training/` (Workforce Awareness & Education)
- Security Awareness Training Policy & Syllabus (`SECURITY_AWARENESS_TRAINING_POLICY.md`).
- Annual Mandatory HIPAA Training Attendance Logs & Completion Certificates.
- Signed Employee Acceptable Use & Security Policy Acknowledgment Receipts.

### `17-periodic-reviews/` (Audits, Evaluations & Certifications)
- Semi-Annual User Access Review Reports & Manager Sign-Offs.
- Annual Comprehensive HIPAA Technical & Non-Technical Evaluation Report.
- Quarterly Compliance Review Meeting Minutes.
