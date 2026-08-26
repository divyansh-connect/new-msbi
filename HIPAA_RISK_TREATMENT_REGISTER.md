# HIPAA Risk Treatment Register

| Document Metadata | Value |
| :--- | :--- |
| **Register ID** | RTR-2026-01 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Governance Standard** | 45 CFR § 164.308(a)(1)(ii)(B) (Risk Management Standard) |
| **Review Frequency** | Quarterly |

---

## 1. Risk Treatment Log

| Risk ID | Risk Description | Severity | Current Technical / Operational Control | Treatment | Action Plan & Milestone | Assigned Owner | Target Due Date | Status | Evidence / Verification Artifact |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | Credential stuffing & brute force | Critical | Bcrypt hashing, Fastify rate-limiting, account lockout | **MITIGATE** | Deploy WebAuthn/TOTP Multi-Factor Authentication | Security Officer (TO BE ASSIGNED) | Q4 2026 | **IN PROGRESS** | `MFA_READINESS_PLAN.md`, `test_auth_security.ts` |
| **RSK-02** | Insecure Direct Object Reference (IDOR) | High | Authoritative database user-ownership validation | **MITIGATE** | Maintain automated IDOR regression testing suite | Technical Lead (TO BE ASSIGNED) | Ongoing | **IMPLEMENTED** | `test_resource_authorization.ts` (16/16) |
| **RSK-03** | Stolen JWT token replay | Medium | 15-min JWT lifespan, refresh token rotation, revocation | **MITIGATE** | Periodic session audit and immediate revocation on password change | Technical Lead (TO BE ASSIGNED) | Ongoing | **IMPLEMENTED** | `test_session_security.ts` (48/48) |
| **RSK-04** | Database credential theft | Medium | AES-256-GCM field encryption (`INTEGRATION_ENCRYPTION_KEY`) | **MITIGATE** | Annual KMS symmetric key rotation schedule | Security Officer (TO BE ASSIGNED) | Annual | **IMPLEMENTED** | `test_secrets_security.ts` (30/30) |
| **RSK-05** | SQL Injection via query parameters | Medium | Prisma ORM parameterization and Zod input validation | **MITIGATE** | Automated schema validation on all routes | Technical Lead (TO BE ASSIGNED) | Ongoing | **IMPLEMENTED** | `test_api_security.ts` (33/33) |
| **RSK-06** | CSV / Excel formula injection | Medium | Leading single quote (`'`) prefix on all formula trigger characters | **MITIGATE** | Enforce sanitized CSV streaming engine | Technical Lead (TO BE ASSIGNED) | Ongoing | **IMPLEMENTED** | `test_file_security.ts` (41/41) |
| **RSK-07** | Cross-Site Scripting (XSS) | Low | React automatic JSX escaping, zero `dangerouslySetInnerHTML` | **MITIGATE** | Maintain defensive CSP headers in Fastify | Frontend Lead (TO BE ASSIGNED) | Ongoing | **IMPLEMENTED** | `test_phi_frontend_security.ts` (12/12) |
| **RSK-08** | Unauthorized audit log tampering | Low | Zero `DELETE`/`PUT` routes on ActivityLog API | **MITIGATE** | Stream audit logs to remote WORM storage bucket | Security Officer (TO BE ASSIGNED) | Q1 2027 | **IMPLEMENTED** | `test_audit_logging.ts` (13/13) |
| **RSK-09** | Webhook request forgery | Medium | Secret header verification, timing-safe equality, deduping | **MITIGATE** | Restrict webhook ingress to verified origin IP ranges | Technical Lead (TO BE ASSIGNED) | Ongoing | **IMPLEMENTED** | `test_third_party_security.ts` (37/37) |
| **RSK-10** | Unencrypted transit of ePHI | Critical | Enforced TLS 1.2+ HTTPS on all edge ingress endpoints | **MITIGATE** | Verify automated certificate renewal on edge proxy | DevOps Lead (TO BE ASSIGNED) | Ongoing | **IMPLEMENTED** | `test_infrastructure_security.ts` (28/28) |
| **RSK-11** | Database disaster / storage failure | High | Automated cloud snapshot backups; 12 DR scenario runbooks | **MITIGATE** | Execute scheduled quarterly restore simulation on staging | Backup / DR Owner (TO BE ASSIGNED) | Semi-Annual | **IMPLEMENTED** | `SECURITY_STEP_12_DR_RUNBOOK.md` |
| **RSK-12** | Third-party vendor PHI breach | High | Strict data minimization (only aggregate metrics sent) | **TRANSFER / MITIGATE** | Execute formal Business Associate Agreements with all vendors | Legal Counsel (TO BE ASSIGNED) | Q4 2026 | **IN PROGRESS** | `BAA_REGISTER.md`, `VENDOR_RISK_REGISTER.md` |
| **RSK-13** | Rogue insider / Ex-employee access | High | Instant user deactivation (`isActive: false`) and session kill | **MITIGATE** | Formalize HR departure checklist SLA (< 1 hour) | HR Department (TO BE ASSIGNED) | Ongoing | **IMPLEMENTED** | `WORKFORCE_LIFECYCLE_POLICY.md` |
| **RSK-14** | Workstation left unattended | Medium | 15-minute JWT expiration; automatic frontend session clearing | **MITIGATE** | Enforce OS-level screen auto-lock (15 min) via MDM | IT Administration (TO BE ASSIGNED) | Q4 2026 | **MANUAL REVIEW REQUIRED** | `compliance/policies/HIPAA_SECURITY_POLICY.md` |

---

## 2. Treatment Strategy Definitions
- **MITIGATE**: Implement architectural or procedural controls to reduce likelihood and impact to acceptable residual levels.
- **ACCEPT**: Acknowledge residual low risks where further mitigation is technically unfeasible or cost-prohibitive.
- **TRANSFER**: Shift financial/operational risk through Business Associate Agreements, third-party contracts, and cyber liability insurance.
- **AVOID**: Cease the high-risk activity (e.g. prohibiting client-side tracking pixels or unvetted external AI processing of ePHI).
