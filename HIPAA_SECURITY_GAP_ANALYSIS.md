# HIPAA & Security Architecture Gap Analysis

**Application:** Midwest Spine & Brain Institute (MSBI) — Marketing Operations & Clinical Intelligence CRM  
**Date:** August 22, 2026  
**Audience:** Executive Leadership, Compliance Officers, Technical Architecture Team  
**Scope:** Complete End-to-End Audit of Frontend (React/Vite/TS), Backend (Node.js/Fastify/Prisma), Database (MySQL), Integrations, and Infrastructure.

---

## 1. Executive Summary

This document presents a comprehensive Security and HIPAA Compliance Gap Analysis for the existing MSBI Marketing Operations CRM and Clinical Intelligence platform. The audit covers the complete software stack: the React 18 single-page application, the Node.js Fastify API backend, the Prisma ORM MySQL database schema, third-party vendor integrations, authentication and authorization pipelines, audit logging systems, file/media storage, and hosting configurations.

### Summary of Key Findings

1. **Unprotected Backend API Endpoints (Critical):** While JWT creation and verification are implemented in `auth.service.ts` and `auth.controller.ts`, verification is **only** invoked on `GET /api/v1/auth/me`. All other domain routes (`/api/v1/users`, `/api/v1/leads`, `/api/v1/calls`, `/api/v1/form-submissions`, `/api/v1/reputation`, `/api/v1/vendors`, `/api/v1/budget`, `/api/v1/roles`, `/api/v1/integrations`, `/api/v1/campaigns`, `/api/v1/analytics`, `/api/v1/reports`, `/api/v1/settings`) completely lack authentication hooks or middleware. Any anonymous HTTP client can query, modify, or delete sensitive patient leads, call recordings, and role definitions.
2. **Missing Backend Authorization & Privilege Escalation (Critical):** RBAC permissions are enforced exclusively on the frontend (navigation visibility). The backend does not enforce permissions per endpoint. Furthermore, deleting any custom role automatically promotes all assigned users to `Admin` (`prisma.user.updateMany({ data: { roleName: 'Admin' } })`).
3. **Lack of Audit Logging for ePHI and Security Events (Critical):** Although an `ActivityLog` model exists in the database schema, **zero** records are generated during runtime. No user access to patient leads, form submissions, call logs, export operations, logins, logouts, or security failures is audited.
4. **ePHI Ingestion, Display, and Export Without Field Encryption or Masking (Critical):** Direct electronic Protected Health Information (ePHI)—including patient names, email addresses, phone numbers, clinical condition inquiries, inbound call recordings, and form submission messages—is stored in plaintext in MySQL and displayed in the frontend without role-based data masking or field-level encryption.
5. **Third-Party Telephony, Messaging & Analytics Without Verified BAAs (High):** Active integrations stream patient contact data, call recordings, and email alerts through external SaaS vendors (CallRail, HubSpot, Mailchimp, Twilio, SendGrid, Meta Ads, Google Workspace/GCP). None have verified Business Associate Agreements (BAAs) on record.
6. **Insecure Storage of Client Tokens & Overly Permissive CORS (High):** Frontend stores JWTs in unencrypted browser `localStorage` vulnerable to XSS; CORS allows wildcard origins (`*`); rate-limiting is disabled globally.

---

## 2. Existing Architecture

```
                                  +------------------------------------------------------+
                                  |                 Frontend (React/Vite)                |
                                  | - Context: AuthContext, RBACContext, ToastContext    |
                                  | - Token Storage: localStorage ('token')              |
                                  | - Export: jsPDF (PDF) & Data URI (CSV/Excel)         |
                                  +---------------------------+--------------------------+
                                                              | HTTP / REST (Fetch API)
                                                              v
+--------------------------------------------------------------------------------------------------------------------+
|                                           Backend (Node.js / Fastify / TypeScript)                                |
|                                                                                                                    |
|  +---------------------------+  +-------------------------------+  +--------------------------------------------+  |
|  |     Authentication        |  |        Unprotected APIs       |  |             Third-Party Sync               |  |
|  | - /api/v1/auth/login      |  | - /api/v1/leads               |  | - CallRail (Calls & Audio Recordings)      |  |
|  | - /api/v1/auth/me         |  | - /api/v1/calls               |  | - HubSpot (Contacts / Leads)               |  |
|  |                           |  | - /api/v1/form-submissions    |  | - Mailchimp (Audiences / Campaigns)        |  |
|  | (JWT 1-day expiration,    |  | - /api/v1/users & /roles      |  | - Google Ads, GA4, GSC, GBP                |  |
|  |  No refresh token)        |  | - /api/v1/vendors & /budget   |  | - Meta Ads Graph API                       |  |
|  +---------------------------+  +-------------------------------+  +--------------------------------------------+  |
|                                                                                                                    |
|  +--------------------------------------------------------------------------------------------------------------+  |
|  |                                              Security Middleware                                             |  |
|  | - CORS: origin '*' (Wildcard)                                                                                |  |
|  | - Rate-Limit: Disabled globally (only active on single WP webhook)                                           |  |
|  | - Error Handling: Custom Fastify handler (exposes error details on 4xx/5xx)                                 |  |
|  | - Activity Logging: NO write operations anywhere in codebase                                                |  |
|  +--------------------------------------------------------------------------------------------------------------+  |
+-----------------------------------------------------+--------------------------------------------------------------+
                                                      | Prisma ORM 6.0
                                                      v
                                  +------------------------------------------------------+
                                  |                     MySQL Database                   |
                                  | - Tables: user, role, department, activitylog,       |
                                  |   lead, formsubmission, calllog, review, vendor,     |
                                  |   contract, invoice, budget, expense, campaign,      |
                                  |   integrationcredential (encrypted with AES-256-GCM)  |
                                  +------------------------------------------------------+
```

---

## 3. Frontend Security

### Finding FE-01: JWT Token Insecurely Stored in Browser `localStorage`
- **Current Implementation:** [Spine-brain-frontend/src/context/AuthContext.tsx](file:///i:/spine-brain-project/Spine-brain-frontend/src/context/AuthContext.tsx#L22-L58), [Spine-brain-frontend/src/api/client.ts](file:///i:/spine-brain-project/Spine-brain-frontend/src/api/client.ts#L7)
- **Problem:** JWT tokens are stored in `localStorage` (`localStorage.setItem('token', res.data.token)`). `localStorage` is fully accessible to any client-side JavaScript script or third-party dependency running in the DOM.
- **Security Impact:** If any Cross-Site Scripting (XSS) vulnerability exists or a malicious npm package is bundled, the JWT can be exfiltrated, giving attackers authenticated access to the API until token expiration.
- **Recommended Solution:** Transition authentication tokens to `HttpOnly`, `Secure`, `SameSite=Strict` cookies set directly by the Fastify backend, preventing script access.
- **Priority:** High

### Finding FE-02: Route Guards Do Not Validate Role Permissions
- **Current Implementation:** [Spine-brain-frontend/src/App.tsx](file:///i:/spine-brain-project/Spine-brain-frontend/src/App.tsx#L20-L96)
- **Problem:** `ProtectedRoute` only checks `isAuthenticated`. It does not check whether the user's role has permission to access specific route paths (`/users-roles`, `/integrations`, `/budget`, `/clinical-intelligence`, etc.).
- **Security Impact:** A user assigned the lowest-privilege role (e.g., "Specialist" or "Clinical Lead") can bypass UI menu hiding simply by entering the URL in the browser bar and accessing administrative screens.
- **Recommended Solution:** Implement a permission-aware route wrapper (`PermissionRoute`) that checks `hasPermission(user.role, requiredPermission)` before rendering the component and redirects to an unauthorized page if permission is denied.
- **Priority:** High

### Finding FE-03: Client-Side Demo Role Switching & Mock Authentication Fallbacks
- **Current Implementation:** [Spine-brain-frontend/src/pages/Login.tsx](file:///i:/spine-brain-project/Spine-brain-frontend/src/pages/Login.tsx#L19-L26), [Spine-brain-frontend/src/context/AuthContext.tsx](file:///i:/spine-brain-project/Spine-brain-frontend/src/context/AuthContext.tsx#L53)
- **Problem:** The Login screen provides a role selector dropdown that automatically sets hardcoded passwords (`password123`). In `AuthContext.tsx`, if no password is provided, a fallback dummy password is used.
- **Security Impact:** Exposes testing credentials on the login screen and bypasses standard credential authentication.
- **Recommended Solution:** Remove all role selector dropdowns and hardcoded credential autofills from the production login UI. Enforce explicit password entry and standard multi-factor authentication.
- **Priority:** High

### Finding FE-04: Mock Client-Side Password Reset Flow
- **Current Implementation:** [Spine-brain-frontend/src/pages/Login.tsx](file:///i:/spine-brain-project/Spine-brain-frontend/src/pages/Login.tsx#L28-L50), [Spine-brain-frontend/src/pages/Login.tsx](file:///i:/spine-brain-project/Spine-brain-frontend/src/pages/Login.tsx#L183-L265)
- **Problem:** The "Forgot Password" modal is an entirely simulated client-side state machine (`EMAIL -> OTP -> NEW_PASSWORD -> SUCCESS`) that never communicates with the backend, generates no OTP, and changes no password.
- **Security Impact:** Users cannot securely reset passwords; gives a false sense of security while leaving accounts vulnerable or inaccessible if passwords are lost.
- **Recommended Solution:** Implement a backend password reset flow utilizing cryptographically secure, time-limited, single-use reset tokens sent via verified email channels.
- **Priority:** Medium

### Finding FE-05: Client-Side PDF/CSV Data Exports Without Audit Logging or Watermarking
- **Current Implementation:** [Spine-brain-frontend/src/utils/exportUtils.ts](file:///i:/spine-brain-project/Spine-brain-frontend/src/utils/exportUtils.ts#L1-L162), [Spine-brain-frontend/src/pages/Reports.tsx](file:///i:/spine-brain-project/Spine-brain-frontend/src/pages/Reports.tsx#L112-L180)
- **Problem:** Full patient rosters (names, emails, phone numbers, condition notes, review feedback) are exported to `.pdf` and `.csv` files locally in the browser via `jsPDF` and data URIs without server-side tracking, authorization verification, or audit log entry creation.
- **Security Impact:** Inability to account for ePHI disclosures (a direct violation of HIPAA §164.528 Accounting of Disclosures) and risk of unauthorized bulk data exfiltration.
- **Recommended Solution:** Move export generation to authenticated server-side endpoints that log user ID, timestamp, IP address, filter parameters, and exact record counts, and apply dynamic watermarks with the accessing user's identity.
- **Priority:** High

### Finding FE-06: Static Mock Data Rendered for Security Audit Logs
- **Current Implementation:** [Spine-brain-frontend/src/pages/UsersAndRoles.tsx](file:///i:/spine-brain-project/Spine-brain-frontend/src/pages/UsersAndRoles.tsx#L210-L224)
- **Problem:** The "System Activity & Security Audit Trail" screen (`/users-roles/activity-logs`) renders a hardcoded static array of 3 fake events with fake IPs (`192.168.1.42`) instead of querying the backend API.
- **Security Impact:** Administrators believe the system is auditing events when in reality no live audit logging or monitoring is operational.
- **Recommended Solution:** Connect the UI to a real backend audit log endpoint with pagination, date filtering, severity indicators, and export tracking.
- **Priority:** High

---

## 4. Backend Security

### Finding BE-01: Zero Authentication Middleware on All Domain API Routes
- **Current Implementation:** [Spine-Brain-backend/src/app.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/app.ts#L52-L70), [Spine-Brain-backend/src/routes/users.routes.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/routes/users.routes.ts#L13-L40), [Spine-Brain-backend/src/routes/leads.routes.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/routes/leads.routes.ts#L6-L20), [Spine-Brain-backend/src/routes/calls.routes.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/routes/calls.routes.ts#L6-L20), [Spine-Brain-backend/src/routes/form-submissions.routes.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/routes/form-submissions.routes.ts#L4-L9), [Spine-Brain-backend/src/routes/rbac.routes.ts](file:///i:/spine-Brain-backend/src/routes/rbac.routes.ts#L9-L14), [Spine-Brain-backend/src/routes/integrations.routes.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/routes/integrations.routes.ts#L31-L89), [Spine-Brain-backend/src/routes/vendors.routes.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/routes/vendors.routes.ts), [Spine-Brain-backend/src/routes/budget.routes.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/routes/budget.routes.ts), [Spine-Brain-backend/src/routes/campaigns.routes.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/routes/campaigns.routes.ts), [Spine-Brain-backend/src/routes/settings.routes.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/routes/settings.routes.ts)
- **Problem:** In `app.ts`, routes are registered with raw prefixes. None of these route plugins or route handlers register a Fastify `preHandler` (e.g., `authenticate` / `verifyJWT`). The token verification function `jwt.verify` is called **only** in `auth.controller.ts:getCurrentUserHandler`.
- **Security Impact:** **CRITICAL VULNERABILITY.** The entire backend API is publicly accessible over the internet without authentication. Any attacker can execute `GET /api/v1/leads`, `GET /api/v1/calls`, `GET /api/v1/form-submissions`, `GET /api/v1/users`, `POST /api/v1/users`, `POST /api/v1/roles`, `DELETE /api/v1/roles/:name`, or `GET /api/v1/integrations/status` without providing a Bearer token.
- **Recommended Solution:** Implement an enterprise Fastify authentication plugin (`@fastify/jwt` or custom preHandler hook) and apply it globally across all `/api/v1/*` routes, explicitly whitelisting only public endpoints (`/api/v1/auth/login`, `/api/v1/health`, and signed webhook endpoints).
- **Priority:** Critical

### Finding BE-02: Wildcard Cross-Origin Resource Sharing (CORS)
- **Current Implementation:** [Spine-Brain-backend/src/app.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/app.ts#L38-L41)
- **Problem:** CORS is registered with `origin: '*'`.
- **Security Impact:** Allows arbitrary malicious web applications hosted on any domain to make cross-origin requests to the MSBI API on behalf of unsuspecting users or exfiltrate response data.
- **Recommended Solution:** Restrict CORS origin strictly to whitelisted frontend domains configured via environment variables (`process.env.FRONTEND_URL`), with `credentials: true`.
- **Priority:** High

### Finding BE-03: Rate Limiting Disabled Globally
- **Current Implementation:** [Spine-Brain-backend/src/app.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/app.ts#L43-L45)
- **Problem:** `@fastify/rate-limit` is registered with `global: false` and is only applied to the WordPress form webhook endpoint. The authentication endpoint (`/api/v1/auth/login`) has no rate limiting.
- **Security Impact:** Vulnerable to brute-force credential stuffing, password guessing attacks, and Denial of Service (DoS).
- **Recommended Solution:** Enable global rate limiting (e.g., 100 req/min per IP) and strict rate limiting on authentication routes (e.g., 5 failed attempts per 15 minutes per IP/account).
- **Priority:** High

### Finding BE-04: Public Exposure of Integration Configuration Objects
- **Current Implementation:** [Spine-Brain-backend/src/services/integrations.service.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/services/integrations.service.ts#L23-L78), [Spine-Brain-backend/src/routes/integrations.routes.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/routes/integrations.routes.ts#L34)
- **Problem:** `getStatus()` queries `config` from `integrationcredential` and returns it directly in the API response: `config: dbRecord?.config || null`. This unauthenticated endpoint exposes account IDs, customer IDs, site URLs, and configuration metadata.
- **Security Impact:** Leaks sensitive external infrastructure parameters to unauthorized clients.
- **Recommended Solution:** Sanitize the integration status response to return only safe boolean flags and non-sensitive timestamps. Require `Admin` role permission to view or edit integration configurations.
- **Priority:** High

---

## 5. Authentication

### Finding AU-01: Default Insecure JWT Secret
- **Current Implementation:** [Spine-Brain-backend/src/controllers/auth.controller.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/auth.controller.ts#L6), [Spine-Brain-backend/src/services/auth.service.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/services/auth.service.ts#L6)
- **Problem:** `const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';`
- **Security Impact:** If `JWT_SECRET` is omitted from environment variables in any environment, the application falls back to a trivial hardcoded string that can be forged offline by attackers to forge valid admin tokens.
- **Recommended Solution:** Remove fallback strings. Implement fail-fast validation on startup requiring `JWT_SECRET` to be a cryptographically random string of at least 256 bits (32 bytes).
- **Priority:** Critical

### Finding AU-02: Absence of Refresh Tokens, Token Revocation, and Session Management
- **Current Implementation:** [Spine-Brain-backend/src/services/auth.service.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/services/auth.service.ts#L21-L25)
- **Problem:** JWT tokens are issued with a static `expiresIn: '1d'`. There is no refresh token mechanism, no session record in the database, no token revocation list, and no way to invalidate a compromised token prior to expiration.
- **Security Impact:** If a token is compromised, an attacker retains uninterrupted access for 24 hours even if the user changes passwords or is deactivated by an administrator.
- **Recommended Solution:** Implement short-lived access tokens (15 minutes) paired with secure, rotating refresh tokens stored in the database with revocation tracking and device fingerprinting.
- **Priority:** High

### Finding AU-03: No Account Lockout or Failed Login Counter
- **Current Implementation:** [Spine-Brain-backend/src/services/auth.service.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/services/auth.service.ts#L9-L19)
- **Problem:** `AuthService.login` verifies credentials via `bcrypt.compare` but does not record failed login counts or enforce temporary account lockouts after repeated failures.
- **Security Impact:** Accounts are vulnerable to automated dictionary and brute-force attacks.
- **Recommended Solution:** Add `failedLoginAttempts: Int @default(0)` and `lockedUntil: DateTime?` fields to the `User` model, locking the account for 30 minutes after 5 consecutive failed attempts.
- **Priority:** High

### Finding AU-04: Insecure In-Memory OAuth State Storage
- **Current Implementation:** [Spine-Brain-backend/src/routes/google-oauth.routes.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/routes/google-oauth.routes.ts#L8-L65)
- **Problem:** OAuth state tokens are stored in a JavaScript `Map` (`stateStore = new Map()`) in process memory.
- **Security Impact:** In a multi-instance or serverless deployment, OAuth callbacks routed to a different instance fail due to missing state. If the process restarts, ongoing OAuth sessions are invalidated. Additionally, in `google-oauth.routes.ts:14`, mock user fallback `'system-user'` is used when unauthenticated.
- **Recommended Solution:** Store encrypted state tokens in Redis or the database with expiration and cryptographically associate the state token with the authenticated admin user initiating the connection.
- **Priority:** Medium

---

## 6. Authorization / RBAC

### Finding RBAC-01: Critical Privilege Escalation Vulnerability on Role Deletion
- **Current Implementation:** [Spine-Brain-backend/src/controllers/rbac.controller.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/rbac.controller.ts#L84-L88)
- **Problem:** In `deleteRoleHandler`:
  ```typescript
  // Assign users of this role to Admin as fallback to prevent orphans
  await prisma.user.updateMany({
    where: { roleName: name },
    data: { roleName: 'Admin' }
  });
  ```
- **Security Impact:** **CRITICAL FLAW.** Deleting any non-system role automatically elevates every user assigned to that role to `Admin` status with full system permissions. Combined with unprotected API endpoints (BE-01), an attacker can elevate any account to full Admin privileges.
- **Recommended Solution:** Prevent deletion of roles that have active assigned users (`Restrict`), or reassign users to a minimum-privilege fallback role (`User` / `ReadOnly`), never `Admin`.
- **Priority:** Critical

### Finding RBAC-02: RBAC Implemented Only as UI Menu Flags
- **Current Implementation:** [Spine-Brain-backend/prisma/schema.prisma](file:///i:/spine-brain-project/Spine-Brain-backend/prisma/schema.prisma#L41-L50), [Spine-brain-frontend/src/context/RBACContext.tsx](file:///i:/spine-brain-project/Spine-brain-frontend/src/context/RBACContext.tsx#L5-L12)
- **Problem:** The `Role.permissions` field stores a generic JSON map corresponding to frontend navigation menu IDs (`dashboard`, `marketing-analytics`, `campaigns`, `budget`, `reputation`, `vendors`, `reports`, `integrations`, `users-roles`, `settings`, `clinical-intelligence`). Backend API routes do not parse or enforce these permissions.
- **Security Impact:** Authorization is purely aesthetic. Any user authenticated with any role can execute backend operations across all modules.
- **Recommended Solution:** Define explicit permission scopes (e.g., `leads:read`, `leads:export`, `users:manage`, `budget:write`, `integrations:manage`) and enforce them via Fastify route pre-handlers.
- **Priority:** Critical

---

## 7. Resource-Level Authorization & IDOR

### Finding IDOR-01: Insecure Direct Object References on Patient Forms and Vendors
- **Current Implementation:** [Spine-Brain-backend/src/controllers/form-submissions.controller.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/form-submissions.controller.ts#L64-L82), [Spine-Brain-backend/src/controllers/vendors.controller.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/vendors.controller.ts#L16-L98)
- **Problem:** Endpoints like `GET /api/v1/form-submissions/:id`, `GET /api/v1/vendors/:id`, and `PUT /api/v1/users/:id/notifications` retrieve or mutate records directly by UUID without verifying organizational boundaries, department assignments, or user permissions.
- **Security Impact:** Any user can query or modify resources by guessing or enumerating IDs.
- **Recommended Solution:** Enforce tenant/organization checks and permission validations in service layer queries before returning or mutating data.
- **Priority:** High

---

## 8. PHI / ePHI Data Flow Analysis

### PHI Ingestion, Processing & Egress Map

```
[Inbound Patient Channels]
       |
       +---> WordPress Webhook (midwestspine.net) ---> [POST /api/v1/webhooks/wordpress/forms] ---> Plaintext MySQL (lead, formsubmission)
       |
       +---> CallRail Telephony Sync --------------> [POST /api/v1/integrations/callrail/sync] ---> Plaintext MySQL (calllog + audioUrl)
       |
       +---> HubSpot Contacts Sync -----------------> [POST /api/v1/integrations/hubspot/sync] ----> Plaintext MySQL (lead)
       |
       +---> Google Business Reviews Sync ----------> [POST /api/v1/reputation/sync] --------------> Plaintext MySQL (review)
                                                                 |
                                                                 v
                                                      [MSBI CRM Storage]
                                                                 |
                                                                 +---> Plaintext MySQL Database Storage
                                                                 |
                                                                 +---> Frontend Display (React UI: Reports, Leads, Calls, Reviews)
                                                                 |
                                                                 +---> Unencrypted Browser Exports (PDF / CSV / Excel)
                                                                 |
                                                                 +---> External Alert Dispatches (SendGrid Email / Twilio SMS)
                                                                 |
                                                                 +---> Console & Server Log Files (Pino Pretty & console.log)
```

### ePHI Data Inventory

| Field / Entity | Location | Contains ePHI? | Current Security Control | Required HIPAA Control |
| :--- | :--- | :--- | :--- | :--- |
| `Lead.name`, `email`, `phone` | `lead` table | **YES** | Plaintext in MySQL | AES-256 field encryption / Masking |
| `Lead.condition` | `lead` table | **YES (Clinical)** | Plaintext in MySQL | AES-256 field encryption / Masking |
| `FormSubmission.message` | `formsubmission` table | **YES (Clinical)** | Plaintext in MySQL | AES-256 field encryption / Masking |
| `CallLog.caller`, `phone` | `calllog` table | **YES** | Plaintext in MySQL | AES-256 field encryption / Masking |
| `CallLog.audioUrl` | `calllog` table | **YES (Voice/Clinical)** | Plaintext URL to CallRail | Signed, expiring proxy URL |
| `Review.authorName`, `comment` | `review` table | **YES (Patient feedback)**| Plaintext in MySQL | Role-restricted access |
| `ReviewRequest.patientName`, `contactInfo` | `reviewrequest` table | **YES** | Plaintext in MySQL | Field encryption |
| Notification Body Texts | `notification.service.ts` | **YES** | Sent via HTTP / Logged to stdout | BAA verification / Masking |

---

## 9. Database Security

### Finding DB-01: No Field-Level Encryption for At-Rest ePHI
- **Current Implementation:** [Spine-Brain-backend/prisma/schema.prisma](file:///i:/spine-brain-project/Spine-Brain-backend/prisma/schema.prisma#L407-L477)
- **Problem:** Patient identifying details (`name`, `email`, `phone`, `condition`, `message`, `caller`, `audioUrl`) are stored as raw `VARCHAR` and `TEXT` columns in MySQL.
- **Security Impact:** In the event of an unauthorized database backup dump, SQL injection, or server filesystem access, all patient clinical inquiries and identities are exposed in plaintext.
- **Recommended Solution:** Implement application-level or Prisma middleware-level envelope encryption (AES-256-GCM) for direct identifiers and clinical notes.
- **Priority:** High

### Finding DB-02: Misleading Database Connection Log
- **Current Implementation:** [Spine-Brain-backend/src/server.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/server.ts#L16)
- **Problem:** `server.ts` outputs `logger.info('Connected to PostgreSQL Database via Prisma')` while `schema.prisma` explicitly uses `provider = "mysql"`.
- **Security Impact:** Operational confusion regarding active database technology and driver capabilities.
- **Recommended Solution:** Correct log message to reflect the active database engine.
- **Priority:** Low

---

## 10. Audit Logging

### Finding AL-01: Zero Active Audit Logging for ePHI and Security Actions
- **Current Implementation:** [Spine-Brain-backend/src/services/users.service.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/services/users.service.ts#L50-L54), [Spine-Brain-backend/prisma/schema.prisma](file:///i:/spine-brain-project/Spine-Brain-backend/prisma/schema.prisma#L62-L71)
- **Problem:** Although `model ActivityLog` exists, there is not a single `prisma.activityLog.create` call anywhere in the entire backend codebase.
- **Security Impact:** Complete absence of audit trails for ePHI access, data modifications, authentication attempts, permission modifications, and data exports. Direct violation of HIPAA §164.312(b) Audit Controls.
- **Recommended Solution:** Implement an immutable audit logging service with dedicated audit schema capturing: `userId`, `action`, `resource`, `resourceId`, `ipAddress`, `userAgent`, `status` (SUCCESS/FAILURE), `timestamp`, and `metadata`.
- **Priority:** Critical

### Finding AL-02: ActivityLog Schema Lacks Essential HIPAA Compliance Metadata
- **Current Implementation:** [Spine-Brain-backend/prisma/schema.prisma](file:///i:/spine-brain-project/Spine-Brain-backend/prisma/schema.prisma#L62-L71)
- **Problem:** `ActivityLog` schema only contains: `id`, `userId`, `action`, `resource`, `timestamp`. It lacks:
  - Client IP Address
  - User Agent / Device info
  - HTTP Method and URL Route
  - Event Outcome / Status Code
  - Specific Record ID affected
  - Previous / New state diffs
- **Security Impact:** Audit logs, even if populated, would be insufficient for forensic investigation.
- **Recommended Solution:** Update the `ActivityLog` schema to include all required compliance audit attributes.
- **Priority:** High

---

## 11. File & Attachment Security

### Finding FS-01: Direct Public Links to Telephony Audio Recordings
- **Current Implementation:** [Spine-Brain-backend/src/services/callrail.service.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/services/callrail.service.ts#L87-L97), [Spine-brain-frontend/src/pages/MarketingAnalytics.tsx](file:///i:/spine-brain-project/Spine-brain-frontend/src/pages/MarketingAnalytics.tsx#L443-L454)
- **Problem:** CallRail audio URLs (`recording_player_url` / `recording`) are saved in the database and rendered as direct `<a href={call.audioUrl}>` links in the frontend.
- **Security Impact:** Patient voice recordings (which may contain medical history, symptoms, personal identifiers) are accessed directly through third-party URLs without backend session validation, access tracking, or expiration controls.
- **Recommended Solution:** Create a backend audio streaming proxy endpoint (`GET /api/v1/calls/:id/audio`) that verifies user permissions, logs an audit record, and securely streams the audio file or generates an expiring pre-signed URL.
- **Priority:** High

### Finding FS-02: Unvalidated Vendor Contract & Invoice Document URLs
- **Current Implementation:** [Spine-Brain-backend/src/validators/vendors.schema.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/validators/vendors.schema.ts#L19-L26), [Spine-brain-frontend/src/pages/VendorManagement.tsx](file:///i:/spine-brain-project/Spine-brain-frontend/src/pages/VendorManagement.tsx#L433-L514)
- **Problem:** `documentUrl` fields accept arbitrary URL strings without file scanning, access control, or storage in a protected BAA-compliant cloud bucket.
- **Security Impact:** Risk of broken links, malware delivery via external URLs, or unauthorized exposure of financial contracts.
- **Recommended Solution:** Restrict document attachments to an authenticated, encrypted private S3/GCS bucket with virus scanning and pre-signed expiring download URLs.
- **Priority:** Medium

---

## 12. API Security

### Finding API-01: Inconsistent Webhook Secret Verification Mechanisms
- **Current Implementation:** [Spine-Brain-backend/src/controllers/webhooks.controller.ts](file:///i:/spine-Brain-backend/src/controllers/webhooks.controller.ts#L11-L28), [Spine-Brain-backend/src/controllers/webhooks.controller.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/webhooks.controller.ts#L137-L142)
- **Problem:** The WordPress form webhook correctly uses `crypto.timingSafeEqual`, but the Google Reviews webhook (`googleReviewsWebhookHandler`) uses a simple string comparison (`incomingSecret !== secret`) and accepts secrets passed via query parameters (`(request.query as any).secret`), which leak into server access logs and browser history.
- **Security Impact:** Timing attack vulnerability on review webhook verification; secret leakage in URL query parameters.
- **Recommended Solution:** Standardize all webhook endpoints to header-based HMAC signature verification (`X-Signature-SHA256`) or timing-safe header checks.
- **Priority:** Medium

---

## 13. Logging Security

### Finding LOG-01: ePHI and Sensitive Information Logged to Server Standard Output
- **Current Implementation:** [Spine-Brain-backend/src/services/notification.service.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/services/notification.service.ts#L49-L115), [Spine-Brain-backend/src/controllers/webhooks.controller.ts](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/webhooks.controller.ts#L153)
- **Problem:** `notification.service.ts` logs full email bodies, patient reviewer names, review comments, phone numbers, and notification payloads to `console.log` (`[EMAIL ALERT MOCK]`, `[SMS ALERT MOCK]`).
- **Security Impact:** In production environments, container logs, hosting dashboards (e.g., Railway/AWS CloudWatch), and syslog collectors store unencrypted ePHI, expanding the HIPAA compliance boundary to log storage systems.
- **Recommended Solution:** Sanitize all log statements to redact patient names, emails, phone numbers, and message bodies. Use structured Pino logging with log-level redaction rules (`pino({ redact: ['email', 'phone', 'comment', 'authorization'] })`).
- **Priority:** High

---

## 14. Secrets Management

### Secrets Inventory

| Secret Identifier / Variable | Purpose | Storage Mechanism | Assessment |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | MySQL Connection String | Environment Variable | Critical database secret. Must be kept out of code repositories. |
| `JWT_SECRET` | Signing User Authentication Tokens | Environment Variable | Must be randomized (>=256-bit) with no fallback string. |
| `INTEGRATION_ENCRYPTION_KEY` | AES-256-GCM Key for OAuth Tokens | Environment Variable | 32-byte key; startup validation already implemented. |
| `GOOGLE_CLIENT_ID` / `_SECRET` | Google Cloud OAuth App | Environment Variable | Standard OAuth credentials. |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads API Access | Environment Variable | High-privilege API token. |
| `WORDPRESS_FORM_WEBHOOK_SECRET`| Inbound Webhook Signing | Environment Variable | Used for timing-safe verification. |
| `GOOGLE_REVIEWS_WEBHOOK_SECRET`| GCP PubSub Webhook | Environment Variable | Currently has fallback string in code. |
| `SENDGRID_API_KEY` | Transactional Email Dispatch | Environment Variable | API secret for SendGrid. |
| `TWILIO_ACCOUNT_SID` / `_AUTH_TOKEN`| SMS Notification Dispatch | Environment Variable | API credentials for Twilio. |
| `CALLRAIL_API_TOKEN` | CallRail REST Telephony API | Environment Variable / DB | Grants access to patient calls and audio. |

---

## 15. Third-Party Integrations & Vendor Review

| Vendor / Provider | Service / Purpose | Data Transmitted / Stored | Potential ePHI? | BAA Status | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CallRail** | Telephony Call Tracking & Recording | Inbound phone numbers, caller names, call duration, audio recordings | **YES (High)** | **UNKNOWN** | **CRITICAL** |
| **HubSpot** | Lead / CRM Contact Sync | Contact names, email addresses, phone numbers, lifecycle status | **YES (High)** | **UNKNOWN** | **CRITICAL** |
| **Mailchimp** | Patient Newsletter / Email Marketing | Patient email addresses, open/click engagement tracking | **YES (Medium)**| **UNKNOWN** | **HIGH** |
| **WordPress (midwestspine.net)** | Inbound Patient Form Submissions | Patient names, email, phone, clinical condition inquiry message | **YES (High)** | **UNKNOWN** | **CRITICAL** |
| **Twilio** | SMS Alerts to Clinic Staff | Review alerts, reviewer name, rating, clinical feedback | **YES (Medium)**| **UNKNOWN** | **HIGH** |
| **SendGrid** | Email Alerts to Clinic Staff | Review alerts, reviewer name, rating, clinical feedback | **YES (Medium)**| **UNKNOWN** | **HIGH** |
| **Google Cloud Platform (GCP)** | OAuth2, PubSub Webhooks | OAuth tokens, Review alert payloads | **YES (Low)** | **UNKNOWN** | **MEDIUM** |
| **Google Analytics 4 (GA4)** | Website Traffic Analytics | Aggregate visitor metrics, landing pages | **NO (Low)** | **UNKNOWN** | **LOW** |
| **Google Ads** | Campaign Performance & Spend | Ad clicks, spend, campaign names | **NO (Low)** | **UNKNOWN** | **LOW** |
| **Meta Ads (Facebook)** | Campaign Performance & Spend | Ad spend, impressions, campaign names | **NO (Low)** | **UNKNOWN** | **LOW** |
| **Google Search Console** | Organic Search Performance | Search queries, clicks, impressions | **NO (Low)** | **UNKNOWN** | **LOW** |

> [!WARNING]
> Under HIPAA §164.502(e) and §164.504(e), any vendor handling, processing, or transmitting ePHI on behalf of a Covered Entity **must** have an executed Business Associate Agreement (BAA). Transmitting patient inquiries to CallRail, HubSpot, Mailchimp, Twilio, or SendGrid without a signed BAA constitutes a regulatory violation.

---

## 16. Analytics & Tracking

- **Google Analytics 4 (GA4):** Configured via `@google-analytics/data` and server-side OAuth2. Collects aggregate session and pageview metrics. No client-side Google Tag Manager (GTM) or Meta Pixel script is injected in the React single-page app HTML head.
- **Attribution Modeling:** Attributions in `AttributionData` and `AnalyticsService` use URL parameters (`utm_source`, `utm_medium`, `gclid`, `fbclid`) server-side.
- **HIPAA Guidance on Web Tracking:** Ensure that no marketing analytics tags (e.g., Meta Pixel, Google Tag) are loaded on pages where authenticated patient forms or clinical information are handled without strict IP/identifier filtering.

---

## 17. Backup & Recovery

- **Current State:** The codebase contains no backup scripts, snapshot automations, or disaster recovery configurations. Database operations run directly against a live MySQL instance.
- **HIPAA Requirement (§164.308(a)(7)(ii)(A) Data Backup Plan):** Establish automated, encrypted daily MySQL database backups with point-in-time recovery (PITR) retained for a minimum of 30 days in an isolated, multi-region storage container with tested restoration procedures.

---

## 18. Infrastructure

- **Web Server:** Node.js Fastify listening on `0.0.0.0:${PORT}`.
- **TLS/HTTPS:** Must be terminated at the reverse proxy / ingress load balancer with TLS 1.3/1.2 only.
- **Environment Isolation:** Application code must separate production, staging, and development environments.
- **Database Engine:** MySQL with TLS-encrypted connections (`ssl={"rejectUnauthorized":true}`).

---

## 19. Existing Security Controls (What is Done Well)

1. **AES-256-GCM Credential Encryption:** `crypto.ts` correctly implements AES-256-GCM with 96-bit random IVs, authentication tags, and startup key validation for storing third-party OAuth access and refresh tokens.
2. **Timing-Safe Webhook Comparison:** `webhooks.controller.ts` uses `crypto.timingSafeEqual` for WordPress form webhook secret verification.
3. **Password Hashing:** `bcryptjs` is utilized for hashing user passwords rather than storing plaintext credentials.
4. **Zod Input Validation:** Fastify routes leverage `fastify-type-provider-zod` for strong request body and parameter validation.
5. **No Client-Side Third-Party Tracking Pixels:** The frontend application does not embed intrusive marketing tracking scripts (Meta Pixel, TikTok Pixel) in the DOM.

---

## 20. Missing Security Controls (What Must Be Added)

1. **Global Fastify Authentication Plugin:** Mandatory Bearer token verification across all API routes.
2. **Server-Side RBAC Enforcement:** Endpoint-level permission verification before route handler execution.
3. **HIPAA-Compliant Audit Logging Engine:** Automatic recording of all authentication, ePHI access, mutation, and export events to an immutable database log.
4. **Field-Level Encryption for ePHI:** Transparent AES-256 encryption on sensitive `Lead`, `FormSubmission`, `CallLog`, and `Review` fields.
5. **Session Management & Refresh Token Pipeline:** 15-minute access tokens with revocable refresh tokens in `HttpOnly` secure cookies.
6. **Secure Telephony Audio Streaming Proxy:** Authenticated backend route for playing patient call recordings.
7. **Rate Limiting & Account Lockout:** Protection against brute-force attacks on login and public endpoints.
8. **Server-Side Watermarked Data Exports:** Audited export pipeline replacing unmonitored browser downloads.

---

## 21. Critical Risks

1. **Unprotected API Endpoints:** All domain endpoints (`/api/v1/leads`, `/api/v1/calls`, `/api/v1/form-submissions`, `/api/v1/users`, `/api/v1/roles`) can be queried, modified, or deleted without authentication.
2. **Privilege Escalation on Role Deletion:** Deleting any role automatically elevates all its users to `Admin`.
3. **Complete Lack of Runtime Audit Logging:** Zero audit records generated for access or mutation of patient data.

---

## 22. High Risks

1. **Plaintext ePHI Storage:** Patient identities, clinical inquiry messages, and call metadata stored unencrypted at rest.
2. **Unverified Third-Party BAAs:** ePHI routed through CallRail, HubSpot, Mailchimp, Twilio, and SendGrid without verified compliance agreements.
3. **Direct Unauthenticated Telephony Audio Links:** Audio recordings containing patient voices and health details exposed via direct URLs.
4. **JWT Storage in localStorage:** Vulnerable to token exfiltration via client-side script injection.
5. **Permissive CORS Wildcard (`*`):** Allows unauthorized cross-origin requests from any website.
6. **Hardcoded Fallback JWT Secret:** Default fallback string `'supersecretkey123'` poses severe token forgery risk if env variable is unset.
7. **Client-Side Data Exports Without Accounting:** PDF/CSV downloads created locally without server tracking.

---

## 23. Medium Risks

1. **Public Integration Config Exposure:** `/api/v1/integrations/status` leaks configuration parameters.
2. **In-Memory OAuth State Store:** `Map` storage fails across clustered instances and process restarts.
3. **Simulated Password Reset Flow:** Client-side mock gives false security expectations.
4. **Unredacted Console Logging:** ePHI logged to standard output in notification service.
5. **Timing Attacks on Review Webhooks:** Simple string comparison on Google Review webhook endpoint.

---

## 24. Low Risks

1. **Incorrect DB Connection Log:** `server.ts` logs PostgreSQL when connecting to MySQL.
2. **Client-Side Master API Key Generator:** `Settings.tsx` uses `Math.random()` for dummy UI regeneration.

---

## 25. Proposed Database Changes (Schema Additions)

> [!NOTE]
> These schema updates will be applied in future implementation phases with your explicit approval. No schema modifications were performed during this analysis step.

```prisma
// Proposed additions to schema.prisma

// 1. Enhanced Audit Log Model
model AuditLog {
  id          String   @id @default(uuid())
  userId      String?
  action      String   // e.g., 'READ_LEAD', 'EXPORT_REPORT', 'LOGIN_SUCCESS', 'ROLE_UPDATE'
  resource    String   // e.g., 'Lead', 'FormSubmission', 'User', 'Role'
  resourceId  String?
  ipAddress   String
  userAgent   String?  @db.Text
  method      String   // 'GET', 'POST', 'PUT', 'DELETE'
  path        String
  status      String   // 'SUCCESS', 'FAILURE', 'DENIED'
  statusCode  Int
  metadata    Json?    // Contextual parameters, record counts
  timestamp   DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId, timestamp])
  @@index([action, timestamp])
  @@index([resource, resourceId])
  @@map("auditlog")
}

// 2. Refresh Token / Session Model
model UserSession {
  id           String   @id @default(uuid())
  userId       String
  refreshToken String   @unique @db.VarChar(500)
  ipAddress    String?
  userAgent    String?
  isRevoked    Boolean  @default(false)
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("usersession")
}

// 3. User Security Enhancements
// Add to User model:
//   failedLoginAttempts Int       @default(0)
//   lockedUntil         DateTime?
//   passwordChangedAt   DateTime  @default(now())
//   sessions            UserSession[]
//   auditLogs           AuditLog[]
```

---

## 26. Proposed Backend Changes

1. **Fastify Authentication Hook:** Create `src/middlewares/auth.middleware.ts` with `requireAuth` pre-handler verifying JWT signatures, token expiration, and user active status. Register on all `/api/v1/*` routes.
2. **Fastify RBAC Authorization Hook:** Create `requirePermission(permissionKey: string)` middleware verifying user role permissions before controller execution.
3. **Fix Role Deletion Logic:** In `rbac.controller.ts`, reject deletion of roles with assigned users or reassign to a safe default role (`User`), removing automatic `Admin` elevation.
4. **Audit Logging Interceptor:** Create `src/services/audit.service.ts` and attach Fastify `onResponse` / `onError` hooks to automatically log all API actions.
5. **CallRail Audio Proxy:** Implement `GET /api/v1/calls/:id/audio` with session validation and audit logging.
6. **Pino Log Redaction:** Configure Pino logger to redact `email`, `phone`, `password`, `authorization`, `comment`, and `message` across all logs.
7. **Strict CORS Whitelist:** Configure `@fastify/cors` with explicit domain origins.
8. **Rate Limiting:** Apply global rate limiting and strict authentication endpoint limits.

---

## 27. Proposed Frontend Changes

1. **HttpOnly Cookie Authentication / Secure Client:** Update `client.ts` to support cookie-based credentials or secure header handling.
2. **Permission-Aware Route Protection:** Implement `PermissionRoute` in `App.tsx` checking `hasPermission` before route rendering.
3. **Remove Demo Role Selector:** Replace demo login buttons with production login form.
4. **Connect Audit Trail UI to Live API:** Update `UsersAndRoles.tsx` (`activity-logs` subview) to fetch and display real records from `/api/v1/users/activity-logs` with pagination and filters.
5. **Server-Driven Reports Export:** Replace client-side `jsPDF` / CSV generation with backend export endpoints that create audit records.

---

## 28. Infrastructure Changes

1. **TLS 1.3 / 1.2 Termination:** Enforce HTTPS termination at load balancer / edge proxy.
2. **Encrypted MySQL Connection:** Enforce SSL/TLS for all database connections (`ssl={"rejectUnauthorized":true}`).
3. **Automated Daily Backups:** Configure automated daily snapshots with 30-day retention and point-in-time recovery.
4. **Secrets Manager:** Transition production environment variables to a dedicated secrets management solution (e.g., AWS Secrets Manager, GCP Secret Manager, or Railway Encrypted Variables).

---

## 29. Vendor / BAA Compliance Review

Before transmitting any patient data to third parties, the organization must execute formal Business Associate Agreements (BAAs) and verify compliance posture:

- [ ] **CallRail:** Execute BAA; restrict recording access to HIPAA-compliant storage.
- [ ] **HubSpot:** Verify healthcare enterprise tier and execute BAA before syncing leads.
- [ ] **Mailchimp (Intuit):** Execute BAA or ensure no clinical condition data is stored in audience lists.
- [ ] **Twilio:** Execute Twilio HIPAA BAA before dispatching SMS alerts containing patient names.
- [ ] **SendGrid (Twilio):** Execute SendGrid HIPAA BAA before dispatching email notifications.
- [ ] **Google Workspace / Google Cloud:** Execute Google Cloud HIPAA BAA for OAuth, PubSub, and Cloud Storage.

---

## 30. Implementation Plan & Recommended Remediation Order

```
+---------------------------------------------------------------------------------------------------+
|                                  PHASED REMEDIATION ROADMAP                                       |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [PHASE 1: CRITICAL ACCESS CONTROL & AUTHENTICATION]                                              |
|  1. Deploy Fastify JWT authentication hook globally on all backend routes.                        |
|  2. Fix role deletion privilege escalation in rbac.controller.ts (remove Admin reassignment).    |
|  3. Enforce server-side RBAC permission verification across all endpoints.                        |
|  4. Remove fallback JWT secret and enforce 256-bit secret validation on startup.                  |
|  5. Restrict CORS to explicit whitelisted origins (remove origin: '*').                          |
|                                                                                                   |
|  [PHASE 2: AUDIT LOGGING & ACCOUNT SECURITY]                                                      |
|  6. Expand database schema with AuditLog and UserSession models.                                  |
|  7. Implement audit service logging all logins, ePHI reads, mutations, and exports.               |
|  8. Connect frontend Activity Logs screen to live backend audit endpoint.                         |
|  9. Implement rate limiting and account lockout after repeated failed logins.                     |
|                                                                                                   |
|  [PHASE 3: ePHI DATA PROTECTION & MEDIA HANDLING]                                                 |
|  10. Implement secure telephony audio streaming proxy (GET /api/v1/calls/:id/audio).              |
|  11. Implement server-side audited export generation for Reports (PDF/Excel).                    |
|  12. Redact ePHI from Pino logs and remove plaintext console.log statements.                     |
|  13. Sanitize public /api/v1/integrations/status response.                                        |
|                                                                                                   |
|  [PHASE 4: FRONTEND HARDENING & VENDOR COMPLIANCE]                                                |
|  14. Enforce PermissionRoute guards on frontend navigation routes in App.tsx.                    |
|  15. Remove demo credentials and login autofills.                                                 |
|  16. Execute BAAs with CallRail, HubSpot, Mailchimp, Twilio, SendGrid, and Google Cloud.          |
|  17. Configure automated encrypted daily MySQL backups and disaster recovery runbooks.           |
+---------------------------------------------------------------------------------------------------+
```

---

*Report generated and finalized. Standing by for user instruction before beginning implementation.*
