# Periodic Access Review Policy

| Policy Metadata | Specification |
| :--- | :--- |
| **Policy ID** | POL-REV-014 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Owner** | Security Officer (TO BE ASSIGNED) |
| **Approved By** | Compliance Committee (TO BE ASSIGNED) |
| **Review Date** | Annual (Next: 2027-08-24) |
| **Status** | ACTIVE / OPERATIONAL REVIEW REQUIRED |
| **Classification** | Internal Governance |

---

## 1. Purpose & Scope
This policy mandates periodic, systematic reviews of user access privileges, assigned roles, and inactive accounts across the Spine-Brain application pursuant to **45 CFR § 164.308(a)(4)**.

## 2. Review Schedule & Procedures
1. **Quarterly Privileged Access Review**: The Security Officer and Department Leads must review all accounts assigned `Admin` and `Clinical Lead` roles quarterly.
2. **Semi-Annual General Access Review**: Complete inventory review of all active users, roles, and department affiliations (`GET /api/v1/compliance/access-review`).
3. **Inactive Account Triage**: Accounts inactive for > 90 days must be disabled pending formal supervisor verification.
4. **Actionable Remediation**:
   - Any excessive privileges identified must be downgraded immediately.
   - Deactivated employees must have all remaining sessions revoked.
5. **Auditing & Record Keeping**: Completion of periodic access reviews must be logged via `ACCESS_REVIEW_AUDITED` and documented in the compliance evidence register.

## 3. Change History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-08-24 | Security Officer | Standardized Periodic Access Review Policy. |
