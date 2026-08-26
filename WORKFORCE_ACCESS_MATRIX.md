# Workforce Role Access Matrix & Minimum Necessary Mapping

| Document Metadata | Value |
| :--- | :--- |
| **Matrix ID** | WAM-2026-01 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Governance Standard** | 45 CFR § 164.308(a)(4) & § 164.502(b) (Minimum Necessary Standard) |
| **Status** | ACTIVE / VERIFIED AGAINST CODEBASE RBAC |

---

## 1. System Role & Permission Mapping

The Spine-Brain system enforces four authoritative roles in the real MySQL database. The table below details the granular access rights granted to each role:

| Role Name | Is System Role | Assigned Permissions Array | ePHI Access Level | Patient Data Access (`FormSubmission`, `Lead`) | Call Logs & Audio URLs (`CallLog`) | Export Rights (`Report`) | Administrative Access (`Users`, `Roles`, `Settings`) | Integration Config Access (`IntegrationCredential`) | Audit Log Access (`ActivityLog`) | Supervisory Approval Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | **Yes** (`true`) | `["*"]` (Full system access) | **Full Administrative** | View, Search, Filter | View, Listen | Full (Executive, Marketing, Budget) | **Full Access** (Create users, modify roles, org settings) | **Full Access** (Manage API keys, OAuth sync) | **Full Access** (Search, filter, paginate all logs) | Executive Signoff |
| **Clinical Lead** | **No** (`false`) | `["dashboard", "clinical", "analytics", "reputation", "reports"]` | **Full Clinical** | View patient clinical inquiries & messages | View & Listen to patient calls | Executive & Marketing Reports | **None** (Blocked with 403 Forbidden) | **Read-Only Status** (Cannot view secrets or rotate keys) | **None** (Blocked with 403 Forbidden) | Clinical Director |
| **Manager** | **No** (`false`) | `["dashboard", "campaigns", "budget", "vendors", "analytics", "reputation", "reports"]` | **Aggregate / Marketing Only** | **None** (Form submissions & patient messages blocked) | Aggregate call volume only (no caller identity or audio URL) | Marketing & Budget Reports (ePHI excluded) | **None** (Blocked with 403 Forbidden) | **Read-Only Status** | **None** (Blocked with 403 Forbidden) | Department Head |
| **Specialist** | **No** (`false`) | `["dashboard", "campaigns", "analytics", "reputation", "leads", "calls"]` | **Operational Inquiries** | View inquiry forms & prospective leads | View call logs & audio URLs | **None** (Report generation blocked with 403) | **None** (Blocked with 403 Forbidden) | **None** (Blocked with 403 Forbidden) | **None** (Blocked with 403 Forbidden) | Marketing / Operations Lead |

---

## 2. Minimum Necessary Justification & Permission Analysis (Task 16)

| Role | Permission | Business Justification | Risk Assessment | Minimum Necessary Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `*` | Platform maintenance, user account provisioning, security incident containment, audit log monitoring. | High (Privileged access) | Limit number of active Admin accounts (< 3). Enforce mandatory MFA upon rollout. |
| **Clinical Lead** | `clinical`, `calls` | Review incoming medical inquiries, patient consultation notes, and triage call recordings for clinical accuracy. | Medium (Direct ePHI access) | Maintain active access review (`GET /api/v1/compliance/access-review`). |
| **Manager** | `vendors`, `budget`, `campaigns` | Manage vendor contracts, marketing budgets, expenses, and advertising spend without accessing patient health data. | Low (No ePHI access) | Prohibit access to `FormSubmission` and patient messages. Verified enforced by RBAC. |
| **Specialist** | `leads`, `calls`, `campaigns` | Follow up on prospective patient inquiries and marketing campaign performance. | Medium (Demographic inquiry access) | Restrict export capabilities. Verified: Report generation returns 403 Forbidden. |

---

## 3. Enforcement Mechanisms
1. **Server-Side Middleware**: Enforced authoritatively via `authorize(permission)` hook in `src/middlewares/rbac.middleware.ts`.
2. **Authoritative Database Source**: Client-side JWT role claims are strictly untrusted; roles and permissions are queried from the live MySQL database on every request.
3. **Audit Trail**: Every unauthorized attempt to access a restricted resource generates a `PERMISSION_DENIED` entry in `ActivityLog`.
