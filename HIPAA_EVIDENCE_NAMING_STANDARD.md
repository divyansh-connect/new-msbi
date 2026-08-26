# HIPAA EVIDENCE NAMING CONVENTION & STANDARD
**System:** Spine Brain / Midwest Spine & Brain Institute (MSBI) Clinical Intelligence CRM  
**Date:** 2026-08-25  
**Standard ID:** HIPAA-EVID-NAME-STD-2026-01  

---

> [!CAUTION]
> ### CRITICAL FILENAME SANITIZATION RULE
> **NEVER include passwords, encryption keys, JWT secrets, API tokens, patient names, medical record numbers, recovery codes, or live PHI in evidence file names or directory paths.**

---

## 1. Standard Syntax Specification

All compliance evidence artifacts (test outputs, screenshots, PDF contracts, sign-off logs, spreadsheets) deposited in `compliance/evidence/` must adhere to the following ISO-standard naming format:

```
YYYY-MM-DD_<HIPAA-CONTROL-ID>_<EVIDENCE-TYPE>_<SHORT-DESCRIPTION>.<ext>
```

### Component Breakdown
1. **`YYYY-MM-DD`**: ISO 8601 creation or execution date (e.g., `2026-08-25`).
2. **`<HIPAA-CONTROL-ID>`**: Normalized CFR section code:
   - `164-308-A1` — Security Management (§ 164.308(a)(1))
   - `164-308-A2` — Assigned Security Responsibility (§ 164.308(a)(2))
   - `164-308-A3` — Workforce Security (§ 164.308(a)(3))
   - `164-308-A4` — Information Access Management (§ 164.308(a)(4))
   - `164-308-A5` — Security Awareness & Training (§ 164.308(a)(5))
   - `164-308-A6` — Security Incident Procedures (§ 164.308(a)(6))
   - `164-308-A7` — Contingency Plan / Backup & DR (§ 164.308(a)(7))
   - `164-308-A8` — Periodic Evaluation (§ 164.308(a)(8))
   - `164-310-A`  — Facility Access Controls (§ 164.310(a))
   - `164-310-B`  — Workstation Use (§ 164.310(b))
   - `164-310-C`  — Workstation Security (§ 164.310(c))
   - `164-310-D`  — Device & Media Controls (§ 164.310(d))
   - `164-312-A`  — Access Control (§ 164.312(a))
   - `164-312-B`  — Audit Controls (§ 164.312(b))
   - `164-312-C`  — Integrity Controls (§ 164.312(c))
   - `164-312-D`  — Person/Entity Authentication & MFA (§ 164.312(d))
   - `164-312-E`  — Transmission Security (§ 164.312(e))
   - `164-502-E`  — Business Associate Contracts (§ 164.502(e))
   - `164-404`    — Breach Notification (§ 164.404)
3. **`<EVIDENCE-TYPE>`**: Standard uppercase descriptor:
   - `TEST_LOG` (Automated test console output)
   - `CONFIG` (Sanitized configuration export)
   - `SCREENSHOT` (Redacted management dashboard screenshot)
   - `REPORT` (Audit or evaluation report)
   - `CONTRACT` (Executed legal BAA or agreement)
   - `SIGNOFF` (Signed authorization, review, or appointment sheet)
   - `ROSTER` (Training attendance or contact roster)
4. **`<SHORT-DESCRIPTION>`**: Concise, hyphenated description (max 4 words).
5. **`.<ext>`**: File extension (`.pdf`, `.log`, `.png`, `.xlsx`, `.md`, `.json`).

---

## 2. Real-World Naming Examples

| Folder Location | Evidence Category | Compliant Filename Example |
|:---|:---|:---|
| `compliance/evidence/01-governance/` | Security Officer Appointment | `2026-08-25_164-308-A2_SIGNOFF_SECURITY_OFFICER_APPOINTMENT.pdf` |
| `compliance/evidence/02-risk-management/` | Risk Assessment | `2026-08-25_164-308-A1_REPORT_ANNUAL_RISK_ASSESSMENT.pdf` |
| `compliance/evidence/03-workforce/` | Sanctions Policy Adoption | `2026-08-25_164-308-A3_SIGNOFF_SANCTIONS_POLICY_APPROVAL.pdf` |
| `compliance/evidence/04-access-control/` | RBAC Test Suite Output | `2026-08-25_164-312-A_TEST_LOG_RBAC_AUTHORIZATION.log` |
| `compliance/evidence/05-authentication/` | Auth Test Suite Output | `2026-08-25_164-312-D_TEST_LOG_AUTH_SECURITY.log` |
| `compliance/evidence/06-audit-logging/` | Monthly Audit Review | `2026-08-25_164-312-B_SIGNOFF_MONTHLY_AUDIT_REVIEW.pdf` |
| `compliance/evidence/07-encryption/` | Offline Key Custody | `2026-08-25_164-312-A_SIGNOFF_OFFLINE_KEY_ESCROW.pdf` |
| `compliance/evidence/08-api-security/` | SSL Labs Server Report | `2026-08-25_164-312-E_REPORT_SSL_LABS_GRADE_A_PLUS.pdf` |
| `compliance/evidence/09-mfa/` | MFA Test Suite Output | `2026-08-25_164-312-D_TEST_LOG_MFA_64_ASSERTIONS.log` |
| `compliance/evidence/10-files-exports/` | Export Security Test Output | `2026-08-25_164-312-C_TEST_LOG_EXPORT_SECURITY.log` |
| `compliance/evidence/11-integrations-baas/` | Executed Railway BAA | `2026-08-25_164-502-E_CONTRACT_RAILWAY_EXECUTED_BAA.pdf` |
| `compliance/evidence/11-integrations-baas/` | Executed CallRail BAA | `2026-08-25_164-502-E_CONTRACT_CALLRAIL_EXECUTED_BAA.pdf` |
| `compliance/evidence/12-incident-response/` | Tabletop Exercise Report | `2026-08-25_164-308-A6_REPORT_ANNUAL_TABLETOP_EXERCISE.pdf` |
| `compliance/evidence/13-backup-dr/` | DR Restore Test Log | `2026-08-25_164-308-A7_REPORT_DR_RESTORE_TEST.pdf` |
| `compliance/evidence/14-infrastructure/` | Railway MySQL Private Net | `2026-08-25_164-312-E_SCREENSHOT_RAILWAY_PRIVATE_NET.png` |
| `compliance/evidence/15-physical-security/` | Clinic Workstation Audit | `2026-08-25_164-310-C_REPORT_CLINIC_WORKSTATION_AUDIT.pdf` |
| `compliance/evidence/16-training/` | Workforce HIPAA Training Log | `2026-08-25_164-308-A5_ROSTER_ANNUAL_HIPAA_TRAINING.xlsx` |
| `compliance/evidence/17-periodic-reviews/` | Semi-Annual Access Review | `2026-08-25_164-308-A4_SIGNOFF_SEMI_ANNUAL_ACCESS_REVIEW.pdf` |

---

## 3. Automated Validation

Evidence collectors can verify file compliance against this standard by confirming that all files in `compliance/evidence/` match the regex pattern:

```regex
^\d{4}-\d{2}-\d{2}_[A-Za-z0-9\-]+_[A-Z_]+_[A-Za-z0-9\-_]+\.[a-z0-9]+$
```
