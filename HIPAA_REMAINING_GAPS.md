# HIPAA Compliance Remaining Gaps & Action Plan

| Document Metadata | Value |
| :--- | :--- |
| **Document ID** | HIPAA-GAPS-2026-01 |
| **Version** | 1.0.0 |
| **Last Updated** | 2026-08-24 |
| **Scope** | Complete Spine-Brain Intelligence System |
| **Review Frequency** | Quarterly |

---

## Category A: Code Changes Required
1. **Multi-Factor Authentication (MFA) Implementation**:
   - *Action*: Implement backend TOTP endpoints (`/api/v1/auth/mfa/*`) and frontend QR code enrollment UI per `MFA_READINESS_PLAN.md`.
   - *Status*: Architectural plan complete; code implementation pending product scheduling.
2. **Dedicated Record Set Export Format Enhancement**:
   - *Action*: Implement single-click unified patient inquiry history PDF export to streamline Privacy Rule DRS access requests.
   - *Status*: Individual exports functional; batch PDF bundling pending.

---

## Category B: Production Infrastructure Required
1. **Cloud KMS / HSM Key Management**:
   - *Action*: Migrate from environment-based `INTEGRATION_ENCRYPTION_KEY` to cloud-managed KMS (AWS KMS or GCP Cloud KMS) with automated annual rotation.
   - *Status*: Code supports AES-256-GCM; cloud KMS binding requires production infrastructure configuration.
2. **Offsite Audit Log WORM Replication**:
   - *Action*: Configure asynchronous replication of `ActivityLog` records to an immutable, write-once-read-many (WORM) cloud bucket (AWS S3 Object Lock).
   - *Status*: In-database audit trail immutable; offsite streaming pending cloud setup.
3. **Automated Restore Drill Automation**:
   - *Action*: Configure staging CI/CD pipeline to automatically execute scheduled monthly database restore tests against production backup snapshots.
   - *Status*: Manual DR runbooks verified (`SECURITY_STEP_12_DR_RUNBOOK.md`).

---

## Category C: Organizational Policy Required
1. **Executive Signoff on Standardized Policies**:
   - *Action*: Formal review and executive signoff on all 15 policies codified in `/compliance/policies/`.
   - *Status*: Policies drafted with version metadata; executive signoff required.
2. **Formal Access Review Schedule**:
   - *Action*: Establish calendar cadence for quarterly privileged access reviews using `GET /api/v1/compliance/access-review`.
   - *Status*: Endpoint implemented and tested; operational calendar required.

---

## Category D: Workforce & Training Required
1. **Mandatory Workforce HIPAA Training Execution**:
   - *Action*: Conduct formal HIPAA awareness training sessions for all active personnel and record signatures in `SECURITY_TRAINING_RECORD.md`.
   - *Status*: Policy active; workforce completion pending.
2. **Security Responsibility Appointments**:
   - *Action*: Formally assign named individuals to roles in `SECURITY_RESPONSIBILITY_REGISTER.md` (Security Officer, Privacy Officer, Incident Commander).
   - *Status*: Role definitions complete; personnel appointments pending.

---

## Category E: Vendor & Business Associate (BAA) Required
1. **Railway Enterprise BAA Execution**:
   - *Action*: Contact Railway Enterprise support to sign a formal HIPAA Business Associate Agreement for production hosting.
   - *Status*: Tracked in `BAA_REGISTER.md` as `MANUAL REVIEW REQUIRED`.
2. **CallRail Healthcare BAA Verification**:
   - *Action*: Verify CallRail subscription is on the Healthcare Compliance tier and obtain countersigned BAA.
   - *Status*: Tracked in `BAA_REGISTER.md` as `MANUAL REVIEW REQUIRED`.
3. **WordPress Form Cache Purge Verification**:
   - *Action*: Audit WordPress intake forms to ensure form submission records are not permanently stored in WordPress MySQL tables after webhook dispatch.
   - *Status*: Webhook security code-verified; WordPress server audit required.

---

## Category F: Legal & Compliance Review Required
1. **Entity Status Determination (Covered Entity vs Business Associate)**:
   - *Action*: Healthcare legal counsel must review the organizational relationship between MSBI, the software entity, and any affiliated clinics.
   - *Status*: Documented as `LEGAL/COMPLIANCE REVIEW REQUIRED`.
2. **Notice of Privacy Practices (NPP) Approval**:
   - *Action*: Legal counsel must review and approve `HIPAA_NPP_TEMPLATE.md` prior to patient distribution.
   - *Status*: Template provided; legal review required.
3. **Marketing Consent Language Audit**:
   - *Action*: Legal review of website intake form consent checkboxes to ensure compliance with 45 CFR § 164.508 marketing rules.
   - *Status*: Technical timestamp logging active; legal verbiage review required.

---

## Category G: Physical Security Required
1. **Clinic Workstation MDM Configuration**:
   - *Action*: Deploy Mobile Device Management (MDM) or Group Policy to enforce 15-minute screen auto-lock and BitLocker/FileVault disk encryption on all clinic computers.
   - *Status*: Application enforces 15-min JWT expiry; OS-level auto-lock required.
2. **Physical Facility & Clean Desk Audits**:
   - *Action*: Implement periodic physical clinic walkthroughs to ensure paper records and unattended screens are secured.
   - *Status*: Codified in `compliance/policies/HIPAA_SECURITY_POLICY.md`.

---

## Category H: Business Decision Required
1. **Emergency Access ("Break-Glass") Clinical Need Determination**:
   - *Action*: Clinical director must evaluate whether non-clinical or emergency personnel ever require temporary elevated ePHI access during clinical crises.
   - *Status*: Architecture outlined in `WORKFORCE_ACCESS_MATRIX.md`; clinical determination required.
2. **Call Recording Retention Window**:
   - *Action*: Clinical leadership and legal counsel must establish exact statutory retention periods for patient call audio recordings (e.g. 1 year vs 6 years).
   - *Status*: Codified in `compliance/policies/DATA_RETENTION_POLICY.md` as `LEGAL REVIEW REQUIRED`.
