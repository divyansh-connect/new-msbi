# Password Management & Credential Policy

| Policy Metadata | Specification |
| :--- | :--- |
| **Policy ID** | POL-PWD-004 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Owner** | Security Officer (TO BE ASSIGNED) |
| **Approved By** | Compliance Committee (TO BE ASSIGNED) |
| **Review Date** | Annual (Next: 2027-08-24) |
| **Status** | ACTIVE / LEGAL & COMPLIANCE REVIEW REQUIRED |
| **Classification** | Internal Governance |

---

## 1. Purpose & Scope
This policy mandates technical and behavioral standards for user passwords, cryptographic hashing, and credential lifecycle management.

## 2. Password Specifications
1. **Minimum Length**: All user passwords must be at least **12 characters** in length.
2. **Complexity Requirements**: Passwords must contain a combination of uppercase letters, lowercase letters, numbers, and special symbols.
3. **Cryptographic Storage (NIST SP 800-63B)**: Passwords must be hashed using `bcrypt` with a minimum work factor / salt rounds of 10. Plaintext passwords or reversible encryption are strictly prohibited.
4. **Brute-Force & Rate Limiting**: Authentication endpoints enforce IP-based and user-based rate limiting (5 failed attempts trigger exponential backoff / 429 Too Many Requests).
5. **Credential Sharing Prohibition**: Sharing credentials across personnel is a critical violation subject to immediate workforce sanctions.
6. **Password Change Session Invalidation**: Changing or resetting a password immediately revokes all existing active server sessions and refresh tokens across all devices.

## 3. Change History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-08-24 | Security Officer | Standardized Password & Credential Policy. |
