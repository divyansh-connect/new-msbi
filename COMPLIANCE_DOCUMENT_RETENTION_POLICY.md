# Compliance Documentation & Record Retention Policy

| Policy Metadata | Specification |
| :--- | :--- |
| **Policy ID** | POL-DOC-020 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Owner** | Compliance & Legal Counsel (TO BE ASSIGNED) |
| **Approved By** | Executive Leadership (TO BE ASSIGNED) |
| **Review Date** | Annual (Next: 2027-08-24) |
| **Status** | ACTIVE / LEGAL & COMPLIANCE REVIEW REQUIRED |
| **Classification** | Internal Governance |

---

## 1. Statutory Retention Obligation (45 CFR § 164.316(b)(2)(i))
Under the HIPAA Security Rule, all documentation required by the regulations—including policies, procedures, risk analyses, assessments, training logs, incident records, and compliance evidence—must be retained for **a minimum of six (6) years** from the date of its creation or the date when it was last in effect (whichever is later).

---

## 2. Mandatory Retained Document Categories

| Documentation Category | Minimum Retention Period | Storage Location & Format | Integrity & Protection Control |
| :--- | :--- | :--- | :--- |
| **Compliance Policies & Version History** (`compliance/policies/`) | **6 Years** from retirement/supersession | Git Version Control & Secure Document Archive | Read-only repository access; changelog tracking |
| **Security Risk Analyses & Treatment Registers** (`HIPAA_RISK_ANALYSIS.md`) | **6 Years** | Secure Document Archive | Versioned markdown / PDF snapshots |
| **Periodic Security Evaluations & Audit Reports** | **6 Years** | Secure Document Archive | Signed executive approval records |
| **Workforce Training Records & Acknowledgments** (`SECURITY_TRAINING_RECORD.md`) | **6 Years** from training date | Secure Document Archive | Signed completion logs |
| **Security Incident Reports & Forensics** (`SECURITY_STEP_12_INCIDENT_RESPONSE.md`) | **6 Years** from incident closure | Encrypted Incident Archive | Restricted to SIRT & Legal Counsel |
| **Periodic Access Review Snapshots** (`GET /api/v1/compliance/access-review`) | **6 Years** | Compliance Evidence Archive | Time-stamped JSON / PDF reports |
| **Executed Business Associate Agreements (BAAs)** (`BAA_REGISTER.md`) | **6 Years** after contract termination | Legal Contract Archive | Executed countersigned copies |
| **Workforce Sanctions & Disciplinary Files** | **6 Years** | Confidential HR Personnel Files | Restricted HR & Legal access |
| **Security Evidence & Test Logs** (`SECURITY_EVIDENCE_REGISTER.md`) | **6 Years** | Automated Build / Compliance Archive | Cryptographic hash tracking |

---

## 3. Availability & Legal Disclosure
- All retained documentation must be made readily available to authorized compliance officers, privacy officers, and upon formal written request by the **U.S. Department of Health and Human Services (HHS) Office for Civil Rights (OCR)**.
- Final organizational retention and disposal policies are subject to formal `LEGAL/COMPLIANCE REVIEW REQUIRED`.
