# Security & Privacy Responsibility Register

| Document Metadata | Value |
| :--- | :--- |
| **Document ID** | SEC-RESP-2026-01 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Governance Standard** | 45 CFR § 164.308(a)(2) (Assigned Security Responsibility) |
| **Status** | ACTIVE / APPOINTMENTS PENDING EXECUTIVE CONFIRMATION |

---

## 1. Designated Security & Compliance Roles

| Governance Role | Designated Individual | Department / Scope | Primary Responsibilities & Accountability | Appointment Status |
| :--- | :--- | :--- | :--- | :--- |
| **Chief Information Security Officer (CISO) / Security Officer** | **TO BE ASSIGNED** | Information Security | Overall responsibility for development, implementation, and enforcement of the HIPAA Security Rule program, technical controls, vulnerability management, and cryptographic key governance. | **TO BE ASSIGNED** |
| **Chief Privacy Officer (CPO) / Privacy Officer** | **TO BE ASSIGNED** | Clinical Compliance & Privacy | Responsible for HIPAA Privacy Rule adherence, patient rights workflows, Notice of Privacy Practices, minimum necessary access reviews, and handling privacy complaints. | **TO BE ASSIGNED** |
| **Incident Commander** | **TO BE ASSIGNED** | Security Operations | Leads the Security Incident Response Team (SIRT), manages containment actions during security breaches, coordinates forensic investigations, and executes emergency mitigation runbooks. | **TO BE ASSIGNED** |
| **Technical Owner / Lead Software Engineer** | **TO BE ASSIGNED** | Engineering | Accountable for codebase security, RBAC enforcement, database schema integrity, input validation, defensive HTTP headers, and maintaining the automated security test suite. | **TO BE ASSIGNED** |
| **Compliance & Governance Owner** | **TO BE ASSIGNED** | Legal & Compliance | Manages regulatory policy versioning, periodic security evaluations, workforce training records, workforce sanctions enforcement, and statutory audit readiness. | **TO BE ASSIGNED** |
| **Backup & Disaster Recovery Owner** | **TO BE ASSIGNED** | Infrastructure / DevOps | Accountable for automated snapshot backups, point-in-time recovery (PITR) readiness, conducting quarterly restore simulations, and maintaining the DR runbooks. | **TO BE ASSIGNED** |
| **Third-Party & Vendor Management Owner** | **TO BE ASSIGNED** | Operations & Procurement | Manages third-party vendor risk assessments, ensures Business Associate Agreements (BAAs) are executed prior to data sharing, and maintains the `BAA_REGISTER.md`. | **TO BE ASSIGNED** |
| **Workforce Administration & HR Lead** | **TO BE ASSIGNED** | Human Resources | Responsible for employee background clearance, mandatory onboarding HIPAA training verification, and timely communication of workforce status changes (Joiner/Mover/Leaver). | **TO BE ASSIGNED** |

---

## 2. Governance Committee Structure
The **Compliance & Security Steering Committee** comprises the Security Officer, Privacy Officer, Technical Owner, and Executive Leadership. The committee meets quarterly to:
1. Review results of periodic access reviews (`GET /api/v1/compliance/access-review`).
2. Review security incident reports and near-misses.
3. Review third-party vendor risk profiles and BAA statuses.
4. Review annual HIPAA risk analyses and update treatment registers.
