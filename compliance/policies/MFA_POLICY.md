# Multi-Factor Authentication (MFA) Policy

| Policy Metadata | Specification |
| :--- | :--- |
| **Policy ID** | POL-MFA-005 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Owner** | Security Officer (TO BE ASSIGNED) |
| **Approved By** | Compliance Committee (TO BE ASSIGNED) |
| **Review Date** | Annual (Next: 2027-08-24) |
| **Status** | ACTIVE / MFA IMPLEMENTATION REQUIRED |
| **Classification** | Internal Governance |

---

## 1. Purpose & Current Status
This policy defines requirements for Multi-Factor Authentication (MFA) across the application.
**Current Technical Status**: `NOT IMPLEMENTED / MFA IMPLEMENTATION REQUIRED`. Detailed rollout phases, token standards (TOTP / WebAuthn FIDO2), and enrollment procedures are documented in `MFA_READINESS_PLAN.md`.

## 2. Policy Mandates
1. **Privileged Roles Requirement**: Upon MFA rollout, all accounts assigned `Admin` or `Clinical Lead` roles must enforce mandatory MFA before gaining access to ePHI or administrative functions.
2. **Acceptable Authentication Factors**:
   - Primary Factor: High-entropy password / passphrase (`POL-PWD-004`).
   - Secondary Factor: Time-based One-Time Password (TOTP - RFC 6238 via Google Authenticator, Authy) or Hardware Security Keys (FIDO2 / WebAuthn).
   - SMS/Email OTP: Discouraged due to SIM-swapping vulnerabilities; reserved only as secondary fallback where hardware tokens are unfeasible.
3. **Emergency Break-Glass Recovery**: Recovery backup codes must be generated during enrollment, hashed before database storage, and single-use only.

## 3. Change History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-08-24 | Security Officer | Initial MFA readiness and governance policy. |
