# Formal HIPAA Security Risk Analysis & Threat Assessment

| Document Metadata | Value |
| :--- | :--- |
| **Assessment ID** | RISK-ANALYSIS-2026-01 |
| **Standard** | NIST SP 800-30 Rev 1 & HIPAA Security Rule (45 CFR § 164.308(a)(1)(ii)(A)) |
| **System** | Spine-Brain Practice & Marketing Intelligence Platform |
| **Assessment Date** | 2026-08-24 |
| **Assessor** | Security & Compliance Engineering Team |
| **Overall Posture** | **LOW RESIDUAL TECHNICAL RISK / GOVERNANCE CONTROLS ACTIVE** |

---

## 1. Information Asset Inventory

| Asset ID | Asset Name / Category | Classification | Location / Technology | Description & Contained ePHI |
| :--- | :--- | :--- | :--- | :--- |
| **AST-01** | `FormSubmission` Database Records | **ePHI** | Managed MySQL (`railway`) | Patient inquiry name, email, phone, medical message, landing page, UTM tracking. |
| **AST-02** | `CallLog` Database Records | **ePHI** | Managed MySQL (`railway`) | Caller name, phone number, call duration, and audio recording URLs. |
| **AST-03** | `Lead` Database Records | **ePHI** | Managed MySQL (`railway`) | Patient demographic name, email, phone, clinical condition category. |
| **AST-04** | Fastify REST API Service | Internal Service | Node.js 18+ / Railway Container | Ingress API handling auth, clinical data queries, reports, and integrations. |
| **AST-05** | React Single-Page Application (SPA) | Frontend Client | Vite / React 18 SPA | User interface for dashboard, lead analytics, and practice management. |
| **AST-06** | `ActivityLog` Relational Table | Compliance Record | Managed MySQL (`railway`) | Immutable audit trail recording user identity, action, IP, route, and timestamps. |
| **AST-07** | `User` & `UserSession` Records | Confidential | Managed MySQL (`railway`) | User accounts, bcrypt password hashes, active sessions, and hashed refresh tokens. |
| **AST-08** | Third-Party API Credentials | Secret | Managed MySQL (`railway`) | External OAuth tokens and API keys encrypted with AES-256-GCM. |
| **AST-09** | Report & Export Generation Engine | Processing Engine | Fastify Backend Service | Excel / PDF report generator with CSV formula injection neutralization. |
| **AST-10** | Third-Party Integration Endpoints | External Ingress/Egress | Google, Meta, HubSpot, WordPress, CallRail | Inbound webhooks and outbound aggregate metric data synchronizers. |

---

## 2. Threat, Vulnerability & Risk Evaluation Matrix

### Likelihood Scale: Low (1), Medium (2), High (3)
### Impact Scale: Low (1), Medium (2), High (3), Critical (4)
### Risk Level: Likelihood × Impact -> Low (1–3), Medium (4–6), High (7–9), Critical (10–12)

| Risk ID | Asset ID | Threat Description | Vulnerability | Likelihood | Impact | Inherent Risk | Existing Technical Control | Recommended Additional Control | Verification Type | Owner | Residual Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | AST-01, AST-07 | Credential stuffing / Brute-force login attack | Public authentication endpoint exposed to internet | High (3) | Critical (4) | **Critical (12)** | Bcrypt hashing (rounds: 10), rate limiting (5 attempts/min), IP-based lockout. | Implement Multi-Factor Authentication (`MFA_READINESS_PLAN.md`). | **CODE-VERIFIED** | Security Officer (TO BE ASSIGNED) | **Low (3)** |
| **RSK-02** | AST-01, AST-03 | Insecure Direct Object Reference (IDOR) on patient data | Guessable UUID parameters in URL paths | Medium (2) | Critical (4) | **High (8)** | Resource-level authorization verifying user ownership and role authorization. | Continuous automated integration regression tests. | **CODE-VERIFIED** | Technical Lead (TO BE ASSIGNED) | **Low (2)** |
| **RSK-03** | AST-07 | Stolen JWT Access / Refresh Token reuse | Token interception on public networks | Medium (2) | High (3) | **Medium (6)** | 15-min JWT expiry, refresh token rotation, database-backed instant revocation. | Enforce WebAuthn / hardware-bound device tokens. | **CODE-VERIFIED** | Technical Lead (TO BE ASSIGNED) | **Low (2)** |
| **RSK-04** | AST-08 | Third-party API credential theft from database | Database compromise or SQL leakage | Low (1) | Critical (4) | **Medium (4)** | Database encryption using AES-256-GCM (`v1:iv:tag:cipher`) with 256-bit key. | Hardware Security Module (HSM) / Cloud KMS integration. | **CODE-VERIFIED** | Security Officer (TO BE ASSIGNED) | **Low (1)** |
| **RSK-05** | AST-01, AST-02 | SQL Injection (SQLi) attack | Malicious user input in search query or filters | Low (1) | Critical (4) | **Medium (4)** | Prisma ORM parameterization on all queries; strict Zod schema validation. | Static Application Security Testing (SAST) in CI/CD. | **CODE-VERIFIED** | Technical Lead (TO BE ASSIGNED) | **Low (1)** |
| **RSK-06** | AST-09 | CSV / Excel Formula Injection (DDE) via patient name | Malicious patient input starting with `=`, `+`, `-`, `@` | Medium (2) | High (3) | **Medium (6)** | Automatic single-quote sanitization prefix on all exported spreadsheet cells. | Enforce export format restriction to PDF where possible. | **CODE-VERIFIED** | Technical Lead (TO BE ASSIGNED) | **Low (2)** |
| **RSK-07** | AST-05 | Cross-Site Scripting (XSS) in frontend SPA | Rendering untrusted user input as raw HTML | Low (1) | High (3) | **Low (3)** | React JSX automatic escaping; zero `dangerouslySetInnerHTML` in codebase. | Content Security Policy (CSP) header enforcement. | **CODE-VERIFIED** | Frontend Lead (TO BE ASSIGNED) | **Low (1)** |
| **RSK-08** | AST-06 | Malicious deletion of audit logs by rogue administrator | Privilege escalation or database write abuse | Low (1) | High (3) | **Low (3)** | Zero `DELETE`/`PUT` routes on ActivityLog API; append-only schema design. | Offsite log shipping to immutable WORM cloud bucket (S3 Object Lock). | **CODE-VERIFIED** | Security Officer (TO BE ASSIGNED) | **Low (1)** |
| **RSK-09** | AST-10 | Webhook spoofing & forged lead creation | Unauthenticated webhook endpoints | High (3) | Medium (2) | **Medium (6)** | Mandatory secret verification (`x-webhook-secret`), timing-safe comparison, idempotency deduping. | IP whitelisting for WordPress and webhook providers. | **CODE-VERIFIED** | Technical Lead (TO BE ASSIGNED) | **Low (2)** |
| **RSK-10** | AST-01, AST-02 | Unencrypted transmission of ePHI | Network eavesdropping / Man-in-the-Middle | Low (1) | Critical (4) | **Medium (4)** | Enforced TLS 1.2+ HTTPS encryption on all edge ingress connections. | Enforce HSTS (HTTP Strict Transport Security) header. | **INFRASTRUCTURE-VERIFIED** | DevOps Lead (TO BE ASSIGNED) | **Low (1)** |
| **RSK-11** | AST-01 | Database loss / Ransomware event | Hardware failure or storage corruption | Low (1) | Critical (4) | **Medium (4)** | Automated cloud snapshot backups; 12 DR runbooks in `SECURITY_STEP_12_DR_RUNBOOK.md`. | Conduct scheduled quarterly restore verification tests. | **INFRASTRUCTURE-VERIFIED** | Backup / DR Owner (TO BE ASSIGNED) | **Low (2)** |
| **RSK-12** | AST-01 | Third-party vendor breach / PHI leak | Vendor processing unmanaged ePHI without BAA | Medium (2) | Critical (4) | **High (8)** | Data minimization (only aggregate metrics sent to Meta/Google/HubSpot). | Execute formal BAAs and maintain `BAA_REGISTER.md`. | **ORGANIZATIONAL** | Legal & Compliance (TO BE ASSIGNED) | **Medium (4)** |
| **RSK-13** | AST-05, AST-07 | Rogue insider / Post-termination access | Delayed HR notification of employee departure | Medium (2) | High (3) | **Medium (6)** | Instant administrative deactivation API and all-session revocation endpoint. | Enforce HR Joiner/Mover/Leaver SLA (< 1 hour for termination). | **MANUAL** | HR Department (TO BE ASSIGNED) | **Low (2)** |
| **RSK-14** | AST-05 | Workstation left unattended with open ePHI session | Inattentive workforce member in physical clinic | High (3) | Medium (2) | **Medium (6)** | 15-minute JWT expiration; automatic frontend session state clearance. | Workstation OS auto-lock policies and clean desk audits. | **ORGANIZATIONAL** | Office Manager (TO BE ASSIGNED) | **Low (2)** |

---

## 3. Overall Risk Assessment Summary

- **Total Assessed Threats**: 14
- **Critical Inherent Risks**: 1 (Mitigated to Low)
- **High Inherent Risks**: 3 (Mitigated to Low/Medium)
- **Medium Inherent Risks**: 8 (Mitigated to Low)
- **Low Inherent Risks**: 2 (Mitigated to Low)
- **Residual Risk Conclusion**: All technical vulnerabilities have code-verified mitigating controls. Residual organizational risks are tracked in `HIPAA_RISK_TREATMENT_REGISTER.md`.
