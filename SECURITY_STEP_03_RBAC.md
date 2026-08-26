# Step 03: Backend RBAC & Permission Enforcement Report

> **Notice:** This document records the technical implementation and verification performed in Step 3 (Backend RBAC and Permission Enforcement). This report does **NOT** claim HIPAA compliance or certification; it documents concrete access control mechanisms, testing outcomes, and remaining system limitations.

---

## 1. Overview & Objectives

In Step 3, backend authorization was made **authoritative and independent** of frontend UI checks. While frontend navigation conditionally renders sidebar links and views, all sensitive backend API endpoints now enforce server-side Role-Based Access Control (RBAC) and permission checks before executing business logic.

### Primary Objectives Accomplished:
1. **Centralized RBAC Middleware:** Implemented [`authorize(permissionKey)`](file:///i:/spine-brain-project/Spine-Brain-backend/src/middlewares/rbac.middleware.ts) and [`requireRole(allowedRoles)`](file:///i:/spine-brain-project/Spine-Brain-backend/src/middlewares/rbac.middleware.ts) as reusable Fastify hooks.
2. **Strict Server-Side Authorization:** Every sensitive route verifies `Authentication + Active User + Authoritative Role + Permission Matrix`.
3. **Privilege Escalation Fixed:** Corrected the critical role-deletion bug in [`rbac.controller.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/rbac.controller.ts) where deleting a custom role elevated assigned users to `Admin`. The server now rejects deleting roles with active user assignments.
4. **Anti-Tampering Enforcement:** Any attempt to manipulate client tokens (e.g. forging `role: "Admin"` in the JWT payload) is ignored; the server loads authoritative role and permission definitions directly from MySQL via Prisma.
5. **Full Test Automation:** Verified 26 RBAC test cases and 41 authentication test cases (67 total assertions, 0 failures) against real MySQL database roles.

---

## 2. Existing Roles & Permissions Architecture

The application defines 10 core permission modules across 4 existing system roles in the live database:

### Permission Modules Matrix

| Permission Key | Description | Corresponding Routes |
|---|---|---|
| `dashboard` | View high-level executive summaries & cross-platform metric cards | `/api/v1/dashboard/*` |
| `analytics` | View website analytics, patient leads, call tracking logs, ROI, attribution, time series | `/api/v1/analytics/*`, `/api/v1/leads`, `/api/v1/calls`, `/api/v1/form-submissions/*` |
| `campaigns` | Manage marketing campaigns, tasks, calendar, goals | `/api/v1/campaigns/*` |
| `budget` | Manage and adjust monthly/annual budgets, planned vs actuals, expense tracking | `/api/v1/budget/*` |
| `reputation` | Manage Google Reviews, GBP location sync, ratings, review requests | `/api/v1/reputation/*` (except public webhook) |
| `vendors` | Manage vendor directory, contracts, renewals, invoices, vendor spending | `/api/v1/vendors/*` |
| `reports` | Generate on-demand custom reports, export center downloads | `/api/v1/reports/*` |
| `integrations` | Configure third-party integrations (Google Ads, Meta, GA4, GSC, WordPress, HubSpot) | `/api/v1/integrations/*`, `/api/v1/google/oauth/start` |
| `users-roles` | User account administration, department management, RBAC permission matrix | `/api/v1/users/*`, `/api/v1/roles/*` |
| `settings` | Organization configuration, clinic locations, providers, notification preferences | `/api/v1/settings/*` |

---

### Authoritative Role Permissions in Real Database

| Role Name | Is System | dashboard | analytics | campaigns | budget | reputation | vendors | reports | integrations | users-roles | settings |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Admin** | `true` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manager** | `true` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Specialist** | `true` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Clinical Lead** | `true` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## 3. Middleware Architecture

```mermaid
flowchart TD
    Req[Incoming HTTP Request] --> Auth[authenticate PreHandler Hook]
    Auth -->|No Token / Invalid / Expired| Err401[401 Unauthorized]
    Auth -->|Account Inactive| Err403Inactive[403 Forbidden: Account is Deactivated]
    Auth -->|Valid DB User| AttachUser[Attach Authoritative User to request.user]
    
    AttachUser --> RBAC[authorize(permissionKey) Hook]
    
    RBAC --> CheckAdmin{Is Role Admin?}
    CheckAdmin -->|Yes| Allow[Allow -> Route Controller Handler]
    CheckAdmin -->|No| CheckMatrix{permissionKey === true in DB permissions?}
    
    CheckMatrix -->|Yes| Allow
    CheckMatrix -->|No| Err403Perm[403 Forbidden: Insufficient Permissions]
```

### Key Implementation in [`rbac.middleware.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/middlewares/rbac.middleware.ts):

```typescript
export function authorize(requiredPermission: PermissionKey | PermissionKey[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // 1. Ensure user is authenticated first
    if (!request.user) {
      await authenticate(request, reply);
      if (reply.sent) return;
    }

    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, message: 'Unauthorized: Authentication required' });
    }

    if (!user.isActive) {
      return reply.status(403).send({ success: false, message: 'Forbidden: User account is deactivated' });
    }

    // 2. Evaluate required permission(s)
    const permissionsToCheck = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const hasAccess = permissionsToCheck.some((perm) => checkPermission(user, perm));

    if (!hasAccess) {
      return reply.status(403).send({
        success: false,
        message: 'Forbidden: Insufficient permissions to access this resource',
        code: 'FORBIDDEN_INSUFFICIENT_PERMISSIONS',
        requiredPermission: Array.isArray(requiredPermission) ? requiredPermission.join(' | ') : requiredPermission,
        userRole: user.roleName
      });
    }
  };
}
```

---

## 4. Protected vs. Intentionally Public Endpoints

### Protected Endpoints Registry

| Route Prefix / Path | HTTP Method(s) | Required Permission | Allowed Existing Roles |
|---|---|---|---|
| `/api/v1/auth/me` | `GET` | Authenticated session | Any active user |
| `/api/v1/dashboard/*` | `GET` | `dashboard` | Admin, Manager, Specialist, Clinical Lead |
| `/api/v1/analytics/*` | `GET` | `analytics` | Admin, Manager, Specialist, Clinical Lead |
| `/api/v1/leads` | `GET` | `analytics` | Admin, Manager, Specialist, Clinical Lead |
| `/api/v1/calls` | `GET` | `analytics` | Admin, Manager, Specialist, Clinical Lead |
| `/api/v1/form-submissions/*` | `GET` | `analytics` | Admin, Manager, Specialist, Clinical Lead |
| `/api/v1/reports/*` | `GET`, `POST` | `reports` | Admin, Manager, Specialist, Clinical Lead |
| `/api/v1/reputation/*` | `GET`, `POST` | `reputation` | Admin, Manager, Specialist, Clinical Lead |
| `/api/v1/campaigns/*` | `GET`, `POST`, `PUT` | `campaigns` | Admin, Manager, Specialist |
| `/api/v1/vendors/*` | `GET`, `POST`, `PUT` | `vendors` | Admin, Manager |
| `/api/v1/budget/*` | `GET`, `POST`, `PUT` | `budget` | Admin |
| `/api/v1/settings/*` | `GET`, `PUT` | `settings` | Admin |
| `/api/v1/integrations/*` | `GET`, `POST` | `integrations` | Admin |
| `/api/v1/google/oauth/start` | `GET` | `integrations` | Admin |
| `/api/v1/google/analytics` | `GET` | `analytics` / `integrations` | Admin, Manager, Specialist, Clinical Lead |
| `/api/v1/users/*` | `GET`, `POST`, `PUT` | `users-roles` | Admin |
| `/api/v1/roles/*` | `GET`, `POST`, `PUT`, `DELETE` | `users-roles` | Admin |

### Intentionally Public Endpoints Registry

| Endpoint | Method | Security Control |
|---|---|---|
| `/api/health` | `GET` | Public health check. |
| `/api/v1/auth/login` | `POST` | Zod validation + bcrypt password verification + non-enumerating error responses. |
| `/api/v1/integrations/google/oauth/callback` | `GET` | Short-lived, single-use state token verification (`stateStore`). |
| `/api/v1/webhooks/wordpress/forms` | `POST` | Rate limiting + `WORDPRESS_FORM_WEBHOOK_SECRET` header validation. |
| `/api/v1/webhooks/google-reviews` | `POST` | GCP PubSub webhook verification. |
| `/api/v1/leads/webhook` | `POST` | Inbound lead ingestion schema validation. |
| `/api/v1/calls/webhook` | `POST` | Inbound call tracking log schema validation. |
| `/api/v1/reputation/reviews` | `POST` | Patient review submission verified via `x-webhook-secret`. |

---

## 5. Privilege Escalation Prevention

1. **Role Deletion Security Fix:**
   - In [`rbac.controller.ts:deleteRoleHandler`](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/rbac.controller.ts#L68-L96), deleting a role previously executed `prisma.user.updateMany({ where: { roleName: name }, data: { roleName: 'Admin' } })`.
   - **Remediation:** Removed the automatic `Admin` promotion. If any active users are assigned to a role, the deletion request is blocked with `400 Bad Request ("Cannot delete role '...' because it is assigned to X active user(s). Reassign them first.")`.
   - System roles (`isSystem: true`) are unconditionally protected with `403 Forbidden ("Cannot delete system roles")`.

2. **Client Token Tampering Defense:**
   - Client-side token modification (such as altering the JWT payload to include `role: "Admin"`) is completely ineffective.
   - The middleware queries MySQL on every request to obtain the true `roleName` and current permission set from the database.

---

## 6. Automated Testing & Verification

Automated test suites were executed against the live MySQL database:

### 1. RBAC Test Suite ([`test_rbac_security.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/test_rbac_security.ts)):
- **Clinical Lead Enforcement (Group 1):**
  - Allowed: Dashboard (`200`), Reports (`200`), Reputation (`200`).
  - Blocked (403): Users (`403`), Budget (`403`), Vendors (`403`), Campaigns (`403`), Settings (`403`), Integrations (`403`).
- **Manager Enforcement (Group 2):**
  - Allowed: Vendors (`200`), Campaigns (`200`).
  - Blocked (403): Budget (`403`), Users (`403`), Settings (`403`).
- **Specialist Enforcement (Group 3):**
  - Allowed: Campaigns (`200`).
  - Blocked (403): Vendors (`403`).
- **Admin Full Access (Group 4):**
  - Verified `200 OK` across Users, RBAC Roles, Budget, Settings, Integrations, and Vendors.
- **Anti-Privilege Escalation & Tampering (Group 5):**
  - Tampered client token claiming "Admin" rejected with `403`.
  - Tampered client token blocked from budget endpoints (`403`).
  - System role deletion rejected (`403`).
  - Deleting role with active user assignment rejected (`400`/`403`).

### 2. Authentication Test Suite ([`test_auth_security.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/test_auth_security.ts)):
- Verified missing tokens, malformed headers, expired tokens, invalid signatures, non-existent users, database user context, protected routes, and public endpoints.

### Summary Results:
```text
====================================================
  RBAC SECURITY TEST RESULTS: 26 PASSED, 0 FAILED
====================================================
  AUTHENTICATION TEST RESULTS: 41 PASSED, 0 FAILED
====================================================
  TOTAL TEST ASSERTIONS: 67 PASSED, 0 FAILED
====================================================
```
- **TypeScript Compilation (`npx tsc --noEmit`):** Passed with 0 errors.
- **Prisma Schema Validation (`npx prisma validate`):** Valid.
- **Database Integrity:** Zero dummy roles or dummy users created; existing schema and live data preserved.

---

## 7. Remaining RBAC Limitations (For Subsequent Steps)

1. **Resource-Level / Object-Level Authorization (Row-Level Security):**
   - Step 3 enforces functional and module-level authorization (e.g. checking whether a role has permission to access `/leads` or `/campaigns`).
   - Tenant-level, department-level, or clinic-level row filtering (e.g., ensuring a provider can only view patient records assigned to their specific clinic ID) will be implemented in Step 4.
2. **Audit Logging for Authorization Failures:**
   - Authorization failures currently return `403 Forbidden`. Writing structured HIPAA security audit entries into `ActivityLog` upon permission violations is scheduled for the audit logging step.
