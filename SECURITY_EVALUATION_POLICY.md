# Periodic Security Evaluation Policy

| Policy Metadata | Specification |
| :--- | :--- |
| **Policy ID** | POL-EVAL-017 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Owner** | Compliance & Security Committee (TO BE ASSIGNED) |
| **Approved By** | Executive Leadership (TO BE ASSIGNED) |
| **Review Date** | Annual (Next: 2027-08-24) |
| **Status** | ACTIVE / ANNUAL EVALUATION SCHEDULED |
| **Classification** | Internal Governance |

---

## 1. Purpose & Scope
This policy mandates periodic technical and non-technical evaluations of the Spine-Brain application's security posture pursuant to **45 CFR § 164.308(a)(8)**.

## 2. Evaluation Triggers & Frequency
A formal security evaluation must be conducted under the following circumstances:
1. **Annual Scheduled Review**: Full comprehensive assessment executed at least once every 12 months.
2. **Major Architectural Changes**: Introduction of new backend services, framework upgrades, or database schema alterations.
3. **New Third-Party Integrations**: Onboarding new cloud vendors, CRM platforms, or marketing channels.
4. **Post-Major Incident**: Following any confirmed security incident, data breach, or severe near-miss.
5. **Infrastructure Migration**: Changes in cloud hosting provider, edge proxy routing, or database hosting.
6. **Emergent Vulnerabilities**: Discovery of critical CVEs impacting core runtime dependencies.

## 3. Evaluation Scope & Methodology
| Evaluation Area | Methodology | Expected Evidence & Deliverables | Assigned Lead |
| :--- | :--- | :--- | :--- |
| **Codebase & API Security** | Automated regression test execution (Steps 2–13 test suites), static code analysis. | Zero failed assertions; updated test logs. | Technical Lead (TO BE ASSIGNED) |
| **Database & Cryptography** | Verify encryption key lengths (32-byte AES-256), bcrypt work factors, schema referential integrity. | Database audit report; key rotation logs. | Security Officer (TO BE ASSIGNED) |
| **Access & Workforce Review** | Invoke `GET /api/v1/compliance/access-review`; audit user roles and inactive accounts. | Signed Access Review report (`POL-REV-014`). | IT Administration (TO BE ASSIGNED) |
| **Third-Party & BAA Audit** | Verify BAA execution status for all active vendors (`BAA_REGISTER.md`). | Executed BAA documents; vendor risk register. | Vendor Owner (TO BE ASSIGNED) |
| **Backup & DR Validation** | Execute staging restore drill and verify RTO/RPO targets. | Documented Restore Test Signoff Sheet. | Backup / DR Owner (TO BE ASSIGNED) |

## 4. Remediation Tracking & Governance
- All deficiencies identified during evaluations must be logged in `HIPAA_RISK_TREATMENT_REGISTER.md`.
- Critical/High findings must have an assigned owner and remediation SLA (< 30 days).
