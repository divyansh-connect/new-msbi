# Access Control & RBAC Policy

| Policy Metadata | Specification |
| :--- | :--- |
| **Policy ID** | POL-ACC-003 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Owner** | Security Officer (TO BE ASSIGNED) |
| **Approved By** | Executive Leadership (TO BE ASSIGNED) |
| **Review Date** | Annual (Next: 2027-08-24) |
| **Status** | ACTIVE / LEGAL & COMPLIANCE REVIEW REQUIRED |
| **Classification** | Internal Governance |

---

## 1. Purpose & Scope
This policy defines the access control architecture and authorization rules for all users, applications, and processes interacting with the Spine-Brain application and database.

## 2. Policy Statements
1. **Unique Identification (45 CFR § 164.312(a)(2)(i))**: Every workforce member must be assigned a unique user account. Generic, shared, or group accounts are strictly prohibited.
2. **Role-Based Access Control (RBAC)**: Access permissions are assigned strictly based on job role (`Admin`, `Clinical Lead`, `Manager`, `Specialist`).
3. **Least Privilege**: Users are granted only those permissions strictly necessary to perform their assigned functions.
4. **Server-Side Authorization**: Client-side role claims are untrusted; all access decisions are verified authoritatively against the database role and permission set.
5. **Session Inactivity & Automatic Logoff (45 CFR § 164.312(a)(2)(iii))**: Access tokens expire after 15 minutes of inactivity; user sessions expire after 7 days or upon explicit logout.
6. **Account Deactivation Lockout**: Deactivated user accounts are rejected immediately upon subsequent requests (403 Forbidden) and active sessions are revoked.

## 3. Change History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-08-24 | Security Officer | Baseline RBAC and Access Control policy. |
