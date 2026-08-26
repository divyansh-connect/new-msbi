# Multi-Factor Authentication (MFA) Implementation & Readiness Plan

| Document Metadata | Value |
| :--- | :--- |
| **Plan ID** | MFA-PLAN-2026-01 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Current Implementation Status** | **NOT IMPLEMENTED / MFA IMPLEMENTATION REQUIRED** |
| **Target Standards** | NIST SP 800-63B (AAL2) & HIPAA Security Rule (45 CFR § 164.312(d)) |

---

## 1. Executive Summary & Objective
While primary authentication is secured with `bcrypt` password hashing (rounds: 10), rate limiting, and server-side session management, deploying Multi-Factor Authentication (MFA) is critical to protect privileged administrative and clinical accounts against credential stuffing and spear-phishing attacks.

---

## 2. Target Roles & Scope

| Target Role | Access Scope & Risk Level | MFA Requirement | Target Enforcement Deadline |
| :--- | :--- | :--- | :--- |
| **Admin** | Full system administration, user management, audit log access | **MANDATORY** | Phase 1 (Week 1–2) |
| **Clinical Lead** | Clinical inquiry triage, patient medical messages, call audio | **MANDATORY** | Phase 1 (Week 1–2) |
| **Manager** | Vendor management, marketing budgets, aggregate reports | **MANDATORY** | Phase 2 (Week 3–4) |
| **Specialist** | Demographic lead tracking, campaign monitoring | **MANDATORY** | Phase 2 (Week 3–4) |

---

## 3. Recommended Technical Architecture

### A. Primary Factor:
- Standard username (email) and high-entropy password (> 12 chars).

### B. Secondary Factor Options:
1. **Time-Based One-Time Password (TOTP - RFC 6238)**:
   - Compatible with Google Authenticator, Microsoft Authenticator, Authy, 1Password.
   - Secret key: 160-bit cryptographically secure random base32 string, stored encrypted using AES-256-GCM in MySQL.
2. **FIDO2 / WebAuthn Hardware Security Keys**:
   - Touch/biometric-bound security keys (YubiKey, Windows Hello, Touch ID).
   - Eliminates phishing via origin-bound public key cryptography.

### C. Enrollment & Recovery Process:
1. **Initial Enrollment**: User logs in with password -> Presented with QR code & manual key -> User submits first 6-digit TOTP token to confirm sync -> Secret activated.
2. **Backup Recovery Codes**: System generates eight (8) single-use 10-character recovery backup codes. Codes are hashed using `bcrypt` before storage.
3. **Emergency Account Recovery**: If device is lost and backup codes exhausted, user must contact the Security Officer for identity verification and administrative MFA reset.

---

## 4. Phased Deployment Roadmap

```
Phase 1: Architecture & Backend API (2 Weeks)
  - Schema extension (totpSecret, mfaEnabled, backupCodes)
  - Endpoints: /api/v1/auth/mfa/setup, /api/v1/auth/mfa/verify, /api/v1/auth/mfa/disable
  - Session state update (twoFactorPending -> fullyAuthenticated)

Phase 2: Frontend Enrollment UI (1 Week)
  - QR Code display modal and token input form
  - Backup codes printable download card

Phase 3: Privileged Pilot & Mandatory Enforcement (2 Weeks)
  - Enforce for Admin and Clinical Lead accounts
  - Grace period for general workforce

Phase 4: Full Production Cutover (1 Week)
  - Require MFA for 100% of active accounts
  - Disable legacy single-factor bypass
```
