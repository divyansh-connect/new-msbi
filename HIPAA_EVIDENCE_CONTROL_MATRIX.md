# HIPAA EVIDENCE CONTROL MATRIX
**System:** Spine Brain / Midwest Spine & Brain Institute (MSBI) Clinical Intelligence CRM  
**Date:** 2026-08-25  
**Technical Baseline:** 497 / 497 Automated Security Assertions PASSED (Steps 2–16)  
**Governance Scope:** 45 CFR Part 160 & Part 164 (Subparts A, C, D, E)  

---

> [!IMPORTANT]
> **COMPLIANCE CLASSIFICATION NOTICE**:  
> Automated technical security testing (497/497 assertions passed) verifies code-level controls. Software verification alone does not constitute organizational HIPAA compliance. Every safeguard below is categorized by its technical implementation, documentary evidence, automated test suite, and remaining organizational/manual actions.

---

## 1. Matrix Structure & Legend

- **Allowed Status**: `COMPLETE`, `PARTIALLY COMPLETE`, `IMPLEMENTED — EVIDENCE REQUIRED`, `INFRASTRUCTURE VERIFICATION REQUIRED`, `NOT YET VERIFIED`, `MANUAL / ORGANIZATIONAL`, `NOT APPLICABLE — JUSTIFICATION REQUIRED`
- **Classification Categories**: `IMPLEMENTED IN CODE`, `VERIFIED BY AUTOMATED TEST`, `INFRASTRUCTURE / CONFIGURATION`, `MANUAL / ORGANIZATIONAL`, `NOT YET VERIFIED`

---

## 2. Comprehensive HIPAA Control Matrix

### A. Administrative Safeguards (45 CFR § 164.308)

| Control | HIPAA Reference | Status | Classification | Technical Evidence | Documentation Evidence | Test Evidence | Manual Evidence Required | Owner | Remaining Action |
|:---|:---|:---:|:---|:---|:---|:---|:---|:---|:---|
| **Security Management: Risk Analysis** | § 164.308(a)(1)(ii)(A) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | N/A (Organizational process) | `HIPAA_RISK_ANALYSIS.md` | N/A | Signed annual risk assessment report | `<SECURITY_OFFICER>` | Conduct annual formal risk review with executive leadership |
| **Security Management: Risk Management** | § 164.308(a)(1)(ii)(B) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | Technical remediations in Steps 2–16 | `HIPAA_RISK_TREATMENT_REGISTER.md` | 497 automated tests | Formal sign-off on risk acceptance/mitigation | `<SECURITY_OFFICER>` | Review risk treatment plan quarterly |
| **Security Management: Sanction Policy** | § 164.308(a)(1)(ii)(C) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | Role revocation & account disabling | `compliance/policies/WORKFORCE_SANCTIONS_POLICY.md` | Step 2/3 tests | HR employee handbook incorporation | `<HR_OWNER>` | Distribute sanction policy to workforce with signature acknowledgments |
| **Security Management: Information System Activity Review** | § 164.308(a)(1)(ii)(D) | IMPLEMENTED — EVIDENCE REQUIRED | `IMPLEMENTED IN CODE` + `MANUAL` | `ActivityLog` table, query API `/api/v1/compliance/audit-logs` | `compliance/policies/AUDIT_LOG_POLICY.md` | `test_audit_logging.ts` (13/13) | Monthly signed audit log review sheet | `<SECURITY_OFFICER>` | Establish monthly audit review cadence and retain signed records |
| **Assigned Security Responsibility** | § 164.308(a)(2) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | Admin role structure in DB | `SECURITY_RESPONSIBILITY_REGISTER.md` | Step 3 RBAC tests | Formal appointment letter signed by CEO/Board | `<EXECUTIVE_LEADERSHIP>` | Appoint named HIPAA Security Officer in writing |
| **Workforce Security: Authorization & Supervision** | § 164.308(a)(3)(ii)(A) | COMPLETE | `IMPLEMENTED IN CODE` + `MANUAL` | DB-backed RBAC, `requirePermission` hook | `WORKFORCE_ACCESS_MATRIX.md`, `WORKFORCE_LIFECYCLE_POLICY.md` | `test_rbac_security.ts` (26/26) | Manager authorization request forms | `<HR_OWNER>` | Enforce access approval workflow prior to provisioning |
| **Workforce Security: Clearance Procedure** | § 164.308(a)(3)(ii)(B) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | N/A | `WORKFORCE_LIFECYCLE_POLICY.md` | N/A | Background check completion certificates | `<HR_OWNER>` | Retain background check verification in personnel files |
| **Workforce Security: Termination Procedures** | § 164.308(a)(3)(ii)(C) | COMPLETE | `IMPLEMENTED IN CODE` + `MANUAL` | Real-time `isActive: false` toggle, session revoke | `WORKFORCE_LIFECYCLE_POLICY.md` | `test_auth_security.ts`, `test_session_security.ts` | Completed employee exit checklists | `<HR_OWNER>` / `<IT_OWNER>` | Immediate deactivation on employee departure |
| **Information Access Management: Access Authorization** | § 164.308(a)(4)(ii)(B) | COMPLETE | `IMPLEMENTED IN CODE` | Role permissions matrix, IDOR resource auth | `compliance/policies/ACCESS_CONTROL_POLICY.md` | `test_resource_authorization.ts` (16/16) | Semi-annual access review sign-offs | `<IT_OWNER>` | Conduct semi-annual user access privilege re-certification |
| **Information Access Management: Access Modification** | § 164.308(a)(4)(ii)(C) | COMPLETE | `IMPLEMENTED IN CODE` | Dynamic role update routes `/api/v1/roles` | `WORKFORCE_ACCESS_MATRIX.md` | `test_rbac_security.ts` (26/26) | Role change ticket logs | `<IT_OWNER>` | Log and audit all role changes |
| **Security Awareness & Training** | § 164.308(a)(5)(i) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | Password complexity, MFA prompts in UI | `SECURITY_AWARENESS_TRAINING_POLICY.md` | Step 14 tests | Training completion logs & certificates | `<COMPLIANCE_OWNER>` | Conduct annual HIPAA training for all active staff |
| **Security Reminders & Phishing** | § 164.308(a)(5)(ii)(A) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | MFA enrollment reminder | `SECURITY_AWARENESS_TRAINING_POLICY.md` | N/A | Periodic security bulletin distribution logs | `<SECURITY_OFFICER>` | Send quarterly security reminders to staff |
| **Protection from Malicious Software** | § 164.308(a)(5)(ii)(B) | INFRASTRUCTURE VERIFICATION REQUIRED | `INFRASTRUCTURE` + `MANUAL` | Ephemeral containers, input validation | `SECURITY_STEP_12_INFRASTRUCTURE.md` | Step 8 tests | Antivirus/EDR configuration screenshots | `<IT_OWNER>` | Verify endpoint protection on clinic workstations |
| **Log-in Monitoring** | § 164.308(a)(5)(ii)(C) | COMPLETE | `IMPLEMENTED IN CODE` | `LOGIN_FAILED`, `LOGIN_SUCCESS`, IP logging in `ActivityLog` | `SECURITY_STEP_05_AUDIT_LOGGING.md` | `test_audit_logging.ts` (13/13) | Failed login alert review logs | `<SECURITY_OFFICER>` | Monitor brute-force and failed login patterns |
| **Password Management** | § 164.308(a)(5)(ii)(D) | COMPLETE | `IMPLEMENTED IN CODE` | Bcrypt hashing (cost 10+), complexity validation | `compliance/policies/PASSWORD_POLICY.md` | `test_auth_security.ts` (41/41) | Documented password change policy | `<SECURITY_OFFICER>` | Enforce 90-day password rotation schedule |
| **Security Incident Procedures: Response & Reporting** | § 164.308(a)(6)(i)-(ii) | PARTIALLY COMPLETE | `IMPLEMENTED IN CODE` + `MANUAL` | Audit logging, replay detection, suspicious alerts | `SECURITY_STEP_12_INCIDENT_RESPONSE.md` | Step 5/12/16 tests | Annual incident tabletop exercise report | `<SECURITY_OFFICER>` | Establish incident response roster & run simulation |
| **Contingency Plan: Data Backup Plan** | § 164.308(a)(7)(ii)(A) | COMPLETE | `IMPLEMENTED IN CODE` + `INFRASTRUCTURE` | Automated daily DB snapshots, point-in-time logs | `compliance/policies/BACKUP_POLICY.md` | `test_backup_recovery_security.ts` (38/38) | Cloud backup configuration exports | `<IT_OWNER>` | Verify snapshot retention in Railway console |
| **Contingency Plan: Disaster Recovery Plan** | § 164.308(a)(7)(ii)(B) | PARTIALLY COMPLETE | `IMPLEMENTED IN CODE` + `MANUAL` | `/api/v1/compliance/recovery-status` diagnostics | `SECURITY_STEP_12_DR_RUNBOOK.md` | `test_backup_recovery_security.ts` | Annual dry-run restore documentation | `<IT_OWNER>` | Perform live restore dry-run to staging DB |
| **Contingency Plan: Emergency Mode Operation** | § 164.308(a)(7)(ii)(C) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | Read-only mode capability, DB isolation | `compliance/policies/DISASTER_RECOVERY_POLICY.md` | N/A | Emergency clinic operational workflow | `<OPERATIONS_LEAD>` | Document manual clinical paper charting fallback |
| **Contingency Plan: Testing & Revision** | § 164.308(a)(7)(ii)(D) | COMPLETE | `VERIFIED BY AUTOMATED TEST` | Automated recovery diagnostic suite | `SECURITY_STEP_15_BACKUP_DR.md` | `test_backup_recovery_security.ts` (38/38) | Documented annual contingency test results | `<SECURITY_OFFICER>` | Update DR plan annually |
| **Contingency Plan: Applications & Data Criticality** | § 164.308(a)(7)(ii)(E) | COMPLETE | `MANUAL / ORGANIZATIONAL` | 16 Prisma models mapped, PHI isolated | `SECURITY_STEP_12_INFRASTRUCTURE.md` | N/A | Signed data criticality analysis | `<SECURITY_OFFICER>` | Maintain data classification inventory |
| **Periodic Evaluation** | § 164.308(a)(8) | COMPLETE | `VERIFIED BY AUTOMATED TEST` + `MANUAL` | 497 automated assertions regression suite | `SECURITY_EVALUATION_POLICY.md` | `run_all_security_tests.ts` (497/497) | Annual comprehensive audit report | `<SECURITY_OFFICER>` | Execute annual technical & non-technical evaluation |
| **Business Associate Contracts** | § 164.308(b)(1) | NOT YET VERIFIED | `MANUAL / ORGANIZATIONAL` | Encryption of all third-party credentials in DB | `BAA_REGISTER.md`, `VENDOR_RISK_REGISTER.md` | `test_third_party_security.ts` (37/37) | Executed, countersigned BAA contracts | `<LEGAL_COUNSEL>` | Execute BAAs with Railway Corp. and CallRail |

---

### B. Physical Safeguards (45 CFR § 164.310)

| Control | HIPAA Reference | Status | Classification | Technical Evidence | Documentation Evidence | Test Evidence | Manual Evidence Required | Owner | Remaining Action |
|:---|:---|:---:|:---|:---|:---|:---|:---|:---|:---|
| **Facility Access: Contingency Operations** | § 164.310(a)(2)(i) | NOT YET VERIFIED | `INFRASTRUCTURE` + `MANUAL` | Cloud-hosted multi-region resilience | `compliance/policies/DISASTER_RECOVERY_POLICY.md` | N/A | Cloud provider SOC 2 report | `<IT_OWNER>` | Obtain Railway/AWS SOC 2 Type II compliance report |
| **Facility Access: Facility Security Plan** | § 164.310(a)(2)(ii) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | N/A | Clinic physical access policy | N/A | Clinic physical layout & security review | `<FACILITIES_LEAD>` | Audit badge readers and physical locks at MSBI clinics |
| **Facility Access: Access Control & Validation** | § 164.310(a)(2)(iii) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | N/A | Visitor log procedures | N/A | Completed visitor logs and badge assignments | `<FACILITIES_LEAD>` | Maintain visitor sign-in logs at clinical facilities |
| **Facility Access: Maintenance Records** | § 164.310(a)(2)(iv) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | N/A | Facility maintenance logs | N/A | Physical maintenance log sheets | `<FACILITIES_LEAD>` | Retain physical security maintenance records |
| **Workstation Use** | § 164.310(b) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | Frontend session timeout | `compliance/policies/HIPAA_SECURITY_POLICY.md` | Step 6 tests | Signed acceptable use agreements | `<IT_OWNER>` | Enforce workstation acceptable use policies |
| **Workstation Security** | § 164.310(c) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | Frontend auto-logout, queryClient purge | `compliance/policies/HIPAA_SECURITY_POLICY.md` | Step 9 tests | Privacy filter verification, 5-min screen lock policy | `<IT_OWNER>` | Verify privacy screens on clinic front desks |
| **Device & Media: Disposal** | § 164.310(d)(2)(i) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | N/A (Zero local disk caching) | `compliance/policies/DATA_RETENTION_POLICY.md` | N/A | Certificate of physical destruction (NIST SP 800-88) | `<IT_OWNER>` | Retain certificates of destruction for retired clinic PCs |
| **Device & Media: Media Re-use** | § 164.310(d)(2)(ii) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | N/A | `compliance/policies/DATA_RETENTION_POLICY.md` | N/A | Sanitization logs before hardware re-assignment | `<IT_OWNER>` | Cryptographic wipe prior to device reallocation |
| **Device & Media: Accountability / Inventory** | § 164.310(d)(2)(iii) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | N/A | Hardware asset register | N/A | Up-to-date IT asset inventory | `<IT_OWNER>` | Reconcile hardware inventory quarterly |
| **Device & Media: Data Backup & Storage** | § 164.310(d)(2)(iv) | COMPLETE | `INFRASTRUCTURE / CONFIGURATION` | Encrypted cloud block storage snapshots | `compliance/policies/BACKUP_POLICY.md` | `test_backup_recovery_security.ts` | Cloud storage encryption verification | `<IT_OWNER>` | Verify AES-256 backup storage configuration |

---

### C. Technical Safeguards (45 CFR § 164.312)

| Control | HIPAA Reference | Status | Classification | Technical Evidence | Documentation Evidence | Test Evidence | Manual Evidence Required | Owner | Remaining Action |
|:---|:---|:---:|:---|:---|:---|:---|:---|:---|:---|
| **Access Control: Unique User ID** | § 164.312(a)(2)(i) | COMPLETE | `IMPLEMENTED IN CODE` | `User.id` UUID primary key, `auth.service.ts` | `compliance/policies/ACCESS_CONTROL_POLICY.md` | `test_auth_security.ts` (41/41) | None (Technical control complete) | `<IT_OWNER>` | None |
| **Access Control: Emergency Access** | § 164.312(a)(2)(ii) | COMPLETE | `IMPLEMENTED IN CODE` | Admin super-role override, full audit tracking | `SECURITY_STEP_03_RBAC.md` | `test_rbac_security.ts` (26/26) | Documented emergency escalation procedure | `<SECURITY_OFFICER>` | Document emergency break-glass procedure |
| **Access Control: Automatic Logoff** | § 164.312(a)(2)(iii) | COMPLETE | `IMPLEMENTED IN CODE` | 15-min JWT access token TTL, 7-day session expiry | `SECURITY_STEP_06_SESSION_SECURITY.md` | `test_session_security.ts` (48/48) | None (Technical control complete) | `<IT_OWNER>` | None |
| **Access Control: Encryption & Decryption** | § 164.312(a)(2)(iv) | COMPLETE | `IMPLEMENTED IN CODE` | AES-256-GCM `v1:iv:tag:ciphertext`, key guard | `SECURITY_STEP_07_SECRETS.md` | `test_secrets_security.ts` (30/30) | Offline key custody documentation | `<SECURITY_OFFICER>` | Escrow `INTEGRATION_ENCRYPTION_KEY` offline |
| **Audit Controls** | § 164.312(b) | COMPLETE | `IMPLEMENTED IN CODE` | `ActivityLog` table, `audit.service.ts`, redaction | `SECURITY_STEP_05_AUDIT_LOGGING.md` | `test_audit_logging.ts` (13/13) | Monthly review sign-off sheets | `<SECURITY_OFFICER>` | Execute monthly review of activity logs |
| **Integrity: Mechanism to Authenticate ePHI** | § 164.312(c)(1)-(2) | COMPLETE | `IMPLEMENTED IN CODE` | AES-256-GCM auth tags, SHA-256 hashes, FK checks | `SECURITY_STEP_07_SECRETS.md` | `test_secrets_security.ts`, `test_mfa_security.ts` | None (Technical control complete) | `<IT_OWNER>` | None |
| **Person Authentication: Passwords** | § 164.312(d) | COMPLETE | `IMPLEMENTED IN CODE` | Bcrypt (10 rounds), generic error messages | `SECURITY_STEP_02_AUTHENTICATION.md` | `test_auth_security.ts` (41/41) | Password policy enforcement documentation | `<SECURITY_OFFICER>` | Enforce workforce password rotation |
| **Person Authentication: MFA** | § 164.312(d) | COMPLETE | `IMPLEMENTED IN CODE` | RFC 6238 TOTP, encrypted secrets, recovery codes | `SECURITY_STEP_14_MFA.md` | `test_mfa_security.ts` (64/64) | Mandatory enrollment policy for all staff | `<SECURITY_OFFICER>` | Enforce MFA for all clinical users |
| **Transmission Security: Integrity** | § 164.312(e)(1)/(2)(i) | COMPLETE | `IMPLEMENTED IN CODE` | Fastify payload limits, Zod schema validation | `SECURITY_STEP_08_API_SECURITY.md` | `test_api_security.ts` (33/33) | None (Technical control complete) | `<IT_OWNER>` | None |
| **Transmission Security: Encryption in Transit** | § 164.312(e)(2)(ii) | COMPLETE | `IMPLEMENTED IN CODE` + `INFRASTRUCTURE` | TLS 1.2+, HSTS (`max-age=31536000`), CSP headers | `SECURITY_STEP_16_FINAL_TECHNICAL_HARDENING.md` | `test_step16_final_security.ts` (45/45) | SSL Labs A+ rating screenshot | `<IT_OWNER>` | Maintain automated SSL certificate renewals |

---

### D. Breach Notification & Privacy Rule Provisions (45 CFR Part 164 Subparts D & E)

| Control | HIPAA Reference | Status | Classification | Technical Evidence | Documentation Evidence | Test Evidence | Manual Evidence Required | Owner | Remaining Action |
|:---|:---|:---:|:---|:---|:---|:---|:---|:---|:---|
| **Incident Detection & Alerting** | § 164.402 / § 164.404 | COMPLETE | `IMPLEMENTED IN CODE` | `TOKEN_REUSE_DETECTED`, `LOGIN_FAILED`, replay checks | `SECURITY_STEP_12_INCIDENT_RESPONSE.md` | Step 5/6/14/16 tests | Incident escalation roster | `<SECURITY_OFFICER>` | Designate on-call incident team |
| **Breach Risk Assessment** | § 164.402(2) | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | Audit trail query API for forensic impact scope | `SECURITY_STEP_12_INCIDENT_RESPONSE.md` | `test_audit_logging.ts` | 4-factor risk assessment template | `<PRIVACY_OFFICER>` | Execute 4-factor breach risk assessment on incidents |
| **Individual Notification** | § 164.404 | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | Lead & patient record contact info in DB | `SECURITY_STEP_12_INCIDENT_RESPONSE.md` | N/A | Written patient notification letter templates | `<PRIVACY_OFFICER>` | Prepare 60-day breach notification templates |
| **HHS OCR & Media Notification** | § 164.406 / § 164.408 | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | N/A | `SECURITY_STEP_12_INCIDENT_RESPONSE.md` | N/A | HHS OCR breach portal account & workflow | `<LEGAL_COUNSEL>` | Establish OCR reporting protocol (>500 vs <500) |
| **Notice of Privacy Practices (NPP)** | § 164.520 | PARTIALLY COMPLETE | `MANUAL / ORGANIZATIONAL` | Public clinic website display | `HIPAA_NPP_TEMPLATE.md` | N/A | Signed patient NPP acknowledgments | `<CLINICAL_DIRECTOR>` | Post NPP on public site and obtain patient sign-offs |
| **Minimum Necessary Disclosure** | § 164.502(b) | COMPLETE | `IMPLEMENTED IN CODE` | Least-privilege API responses, role-scoped queries | `SECURITY_STEP_04_RESOURCE_AUTHORIZATION.md` | `test_resource_authorization.ts` (16/16) | Minimum necessary disclosure guidelines | `<PRIVACY_OFFICER>` | Audit third-party outbound exports |
