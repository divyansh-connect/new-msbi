# Data Backup Policy

| Policy Metadata | Specification |
| :--- | :--- |
| **Policy ID** | POL-BKP-009 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Owner** | Backup & DR Owner (TO BE ASSIGNED) |
| **Approved By** | Technical Leadership (TO BE ASSIGNED) |
| **Review Date** | Annual (Next: 2027-08-24) |
| **Status** | ACTIVE / INFRASTRUCTURE VERIFICATION REQUIRED |
| **Classification** | Internal Governance |

---

## 1. Purpose & Scope
This policy governs the creation, frequency, encryption, storage, and validation of database backups for all persistent relational data and ePHI.

## 2. Policy Mandates
1. **Automated Daily Snapshots**: Persistent MySQL databases must execute daily automated snapshot backups.
2. **Point-In-Time Recovery (PITR)**: Production database instances must maintain binary transaction logs (binlogs) for point-in-time recovery.
3. **Backup Encryption**: All backup snapshots and physical files must be encrypted at rest using AES-256 (via KMS or provider-managed keys).
4. **Geographic Redundancy**: Backups should be replicated across distinct availability zones or cloud regions.
5. **Periodic Restore Testing (45 CFR § 164.308(a)(7)(ii)(E))**: Backup integrity and restore capability must be tested at least quarterly in a non-production staging environment. Restore tests must be documented and signed off.

## 3. Change History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-08-24 | Technical Lead | Standardized Data Backup Policy. |
