# Audit Logging & Monitoring Policy

| Policy Metadata | Specification |
| :--- | :--- |
| **Policy ID** | POL-AUD-006 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Owner** | Security Officer (TO BE ASSIGNED) |
| **Approved By** | Compliance Committee (TO BE ASSIGNED) |
| **Review Date** | Annual (Next: 2027-08-24) |
| **Status** | ACTIVE / LEGAL & COMPLIANCE REVIEW REQUIRED |
| **Classification** | Internal Governance |

---

## 1. Purpose & Scope
This policy mandates technical standards and operational procedures for audit log generation, retention, integrity protection, and review under the **HIPAA Security Rule (45 CFR § 164.312(b))**.

## 2. Loggable Events
The application automatically captures tamper-resistant records in the `ActivityLog` relational table for:
1. User authentication: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`.
2. Session management: `SESSION_CREATED`, `SESSION_REVOKED`, `ALL_SESSIONS_REVOKED`, `TOKEN_ROTATED`, `TOKEN_REUSE_DETECTED`.
3. Account lifecycle: `PASSWORD_CHANGED`, `USER_DISABLED`, `USER_ENABLED`, `ROLE_CHANGED`.
4. Authorization & security exceptions: `PERMISSION_DENIED`.
5. Sensitive data access: `PATIENT_VIEW`, `DOCUMENT_VIEW`, `DATA_EXPORT`.
6. Compliance governance: `COMPLIANCE_STATUS_VIEWED`, `ACCESS_REVIEW_AUDITED`.

## 3. Log Data Elements & Sanitization
- **Required Metadata**: Timestamp (UTC), User ID, User Email, User Role, Action, Resource Type, Resource ID, HTTP Request Method, Route Path, Caller IP Address, User-Agent, Outcome (Success/Failure), and Sanitized Failure Reason.
- **Redaction Mandate**: Logs must NEVER record plaintext passwords, session tokens, JWTs, symmetric encryption keys, or full patient clinical notes.

## 4. Immutability & Access Protection
- Audit records are append-only. Zero API routes exist to `DELETE`, `PUT`, or `PATCH` audit records.
- Access to audit query APIs is restricted to authorized administrators with `users-roles` permissions.

## 5. Change History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-08-24 | Security Officer | Standardized Audit Logging Policy. |
