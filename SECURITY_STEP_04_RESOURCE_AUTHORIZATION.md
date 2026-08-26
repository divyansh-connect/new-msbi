# Step 04: Resource-Level Authorization & IDOR Protection Report

> **Notice:** This document records the technical implementation and verification performed in Step 4 (Resource-Level Authorization and Insecure Direct Object Reference / IDOR Prevention). This report does **NOT** claim HIPAA compliance or certification; it documents concrete access control mechanisms, testing outcomes, and remaining system limitations.

---

## 1. Overview & Objectives

Step 4 implements **Resource-Level Authorization** to prevent Insecure Direct Object References (IDOR) and horizontal privilege escalation. While Step 3 established module-level RBAC (e.g. verifying that a user has the `users-roles`, `analytics`, or `campaigns` permission), Step 4 enforces object-level access boundaries so that users cannot inspect, modify, or manipulate resources belonging to other users, clinics, or owners simply by tampering with URL parameters or JSON payloads.

### Primary Objectives Accomplished:
1. **Identified Sensitive Resources:** Audited all database entities handling protected health information (PHI), CRM lead records, call logs, form submissions, review replies, user notification settings, and campaigns.
2. **Centralized Resource Authorization Logic:** Created [`ResourceAuth`](file:///i:/spine-brain-project/Spine-Brain-backend/src/utils/resource-auth.ts) providing reusable ownership and resource-access verification rules.
3. **IDOR Defenses on User Resources:** Protected user-specific endpoints such as `PUT /api/v1/users/:id/notifications` so that non-admin users can **only** access/update their own profile/alerts, returning `403 Forbidden` if they attempt to modify another user's preferences.
4. **Boundary & Existence Verification:** Enforced existence checks and proper HTTP `404 Not Found` responses when querying or mutating non-existent or manipulated resource IDs across campaigns, form submissions, vendors, and invoices.
5. **Ownership & Role Verification on Mutations:** Ensured campaign updates and task assignments verify the caller's role (`Admin`, `Manager`) or resource ownership (`ownerId === currentUser.id`) before persisting changes.
6. **Automated Verification:** Verified 16 Resource-Level / IDOR tests, 26 RBAC tests, and 41 Authentication tests (**83 total test assertions, 0 failures**) against the live database without creating fake or seed patient data.

---

## 2. Sensitive Resources & Access Model

The following table details the sensitive data models present in the application, their access boundaries, and the enforcement rules applied:

| Resource Model | Sensitive Fields / Data | Owner / Tenant Boundary | Access & Mutation Rules | Endpoint(s) |
|---|---|---|---|---|
| **`User` (Preferences)** | Phone number, SMS alerts, email alerts, location alerts | `User.id` | Users may view and edit **only their own** preferences (`request.user.id === targetId`). `Admin` role can manage any user. | `PUT /api/v1/users/:id/notifications` |
| **`User` (Administration)** | Names, emails, role assignments, department | System-wide (`Role.permissions['users-roles']`) | Only users with `users-roles: true` (Admin) can list, create, or modify user accounts. | `GET /api/v1/users`, `POST /api/v1/users`, `GET /api/v1/roles` |
| **`FormSubmission`** | Patient name, email, phone, message, symptoms, landing page, UTM tracking | Associated `Lead.id` / System | Requires `analytics: true`. Direct query by ID returns `404` for invalid/non-existent IDs without leaking metadata. | `GET /api/v1/form-submissions`, `GET /api/v1/form-submissions/:id` |
| **`Lead`** | Patient name, phone, email, medical condition, status | Single organization CRM | Requires `analytics: true`. Protected against unauthenticated and unauthorized role access. | `GET /api/v1/leads` |
| **`CallLog`** | Caller phone number, duration, call status, audio recording URL | Single organization CRM | Requires `analytics: true`. Direct call recordings and caller identifiers protected. | `GET /api/v1/calls` |
| **`Review`** | Patient name, email, phone, ratings, survey responses, comments | `Clinic.id` / `Provider.id` | Requires `reputation: true`. Review replies verify caller permission and GBP location binding. | `GET /api/v1/reputation/reviews`, `POST /api/v1/reputation/reviews/:id/reply` |
| **`Campaign`** | Budget, spend, revenue, goals, platform credentials | `Campaign.ownerId` (`User.id`) | Requires `campaigns: true`. `Admin` and `Manager` can manage all campaigns; other roles can only modify campaigns they own. | `GET /api/v1/campaigns/:id`, `PUT /api/v1/campaigns/:id`, `POST /api/v1/campaigns/:id/tasks` |
| **`Vendor` & `Invoice`** | Contracts, invoice amounts, due dates, payment status | `Vendor.id` | Requires `vendors: true`. Invoice status update verifies invoice existence and vendor scoping before mutation. | `GET /api/v1/vendors/:id`, `PUT /api/v1/vendors/invoices/:id/status` |

---

## 3. Implemented Resource Authorization Logic

### 1. Centralized Helper: [`ResourceAuth`](file:///i:/spine-brain-project/Spine-Brain-backend/src/utils/resource-auth.ts)

```typescript
export class ResourceAuth {
  /**
   * Verifies if a user can access or modify another user's personal resource.
   * Rule: Admins can manage any user. Non-admins may ONLY manage their own user record.
   */
  static canAccessUser(currentUser: AuthenticatedUser, targetUserId: string): boolean {
    if (!currentUser || !currentUser.isActive) return false;
    if (currentUser.roleName === 'Admin') return true;
    return currentUser.id === targetUserId;
  }

  /**
   * Verifies if a user can modify a specific marketing campaign.
   * Rule: Admins and Managers can modify all campaigns. Other roles can only modify campaigns they own.
   */
  static canModifyCampaign(currentUser: AuthenticatedUser, campaignOwnerId: string): boolean {
    if (!currentUser || !currentUser.isActive) return false;
    if (currentUser.roleName === 'Admin' || currentUser.roleName === 'Manager') return true;
    return currentUser.id === campaignOwnerId;
  }
}
```

### 2. User Notification IDOR Guard in [`users.controller.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/users.controller.ts)

```typescript
export const updateNotificationPreferencesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params;
  const currentUser = request.user;

  if (!currentUser) {
    return reply.status(401).send({ success: false, message: 'Unauthorized' });
  }

  // IDOR Prevention: Block user from modifying another user's notifications
  if (!ResourceAuth.canAccessUser(currentUser, id)) {
    return reply.status(403).send({
      success: false,
      message: 'Forbidden: You do not have permission to modify another user\'s notification preferences',
      code: 'FORBIDDEN_RESOURCE_ACCESS'
    });
  }

  const user = await usersService.updateNotificationPreferences(id, request.body);
  if (!user) {
    return reply.status(404).send({ success: false, message: 'User not found' });
  }
  const { passwordHash, ...safeUser } = user as any;
  return reply.send({ success: true, data: safeUser });
};
```

---

## 4. IDOR & Resource Authorization Test Cases

An automated test suite was developed and executed in [`test_resource_authorization.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/test_resource_authorization.ts):

```text
================================================================
  STARTING STEP 4: RESOURCE-LEVEL AUTHORIZATION & IDOR TESTS
================================================================

--- TEST GROUP 1: User Preferences IDOR Prevention ---
  ✅ PASS: IDOR Attack Blocked: User A cannot modify User B notification settings (returns 403 Forbidden)
  ✅ PASS: IDOR Attack Blocked: Non-admin cannot modify Admin notification settings (returns 403 Forbidden)
  ✅ PASS: User can legitimately update their OWN notification settings (returns 200 OK)
  ✅ PASS: Admin can administratively update user notification settings (returns 200 OK)

--- TEST GROUP 2: Manipulated & Non-Existent Resource IDs ---
  ✅ PASS: Querying non-existent Form Submission returns 404 Not Found
  ✅ PASS: Querying non-existent Campaign returns 404 Not Found
  ✅ PASS: Querying non-existent Vendor returns 404 Not Found
  ✅ PASS: Updating non-existent Invoice returns 404 Not Found
  ✅ PASS: Querying contracts of non-existent Vendor returns 404 Not Found

--- TEST GROUP 3: Campaign Resource Authorization ---
  ✅ PASS: Admin can update any Campaign (returns 200 OK)
  ✅ PASS: Manager can update Campaign (returns 200 OK)
  ✅ PASS: Unauthorized role cannot update Campaign (returns 403 Forbidden)

--- TEST GROUP 4: Form Submission & Patient Data Access ---
  ✅ PASS: Authorized user can fetch Form Submission by ID (returns 200 OK)
  ✅ PASS: Unauthenticated access to Form Submission returns 401 Unauthorized
  ✅ PASS: Authorized user can access Vendor by ID (returns 200 OK)
  ✅ PASS: User without vendors permission cannot access Vendor by ID (returns 403)

================================================================
  RESOURCE AUTH TEST RESULTS: 16 PASSED, 0 FAILED
================================================================
```

---

## 5. Summary of Full Automated Security Test Suite

All three security test suites pass completely against the live MySQL database:

| Test Suite | File | Tests Run | Result |
|---|---|:---:|:---:|
| **Authentication Security** | [`test_auth_security.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/test_auth_security.ts) | 41 | **41 PASSED, 0 FAILED** |
| **RBAC Enforcement** | [`test_rbac_security.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/test_rbac_security.ts) | 26 | **26 PASSED, 0 FAILED** |
| **Resource-Level & IDOR** | [`test_resource_authorization.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/test_resource_authorization.ts) | 16 | **16 PASSED, 0 FAILED** |
| **Total Security Assertions** | — | **83** | **83 PASSED, 0 FAILED** |

- **TypeScript Compilation (`npx tsc --noEmit`):** 0 errors.
- **Database Integrity:** Real data preserved, zero dummy records or fake patients created.

---

## 6. Remaining Unresolved Business Rules (For Future Work)

1. **Multi-Clinic Location Scoping for Clinical Staff:**
   - Currently, all clinics belong to a single healthcare practice organization (`Organization.id`).
   - If future business requirements introduce clinic-specific assignments (e.g. Doctor A assigned to "Downtown Spine Clinic" and Doctor B to "Westside Brain Clinic"), a many-to-many user-clinic association table (`UserClinic`) will be needed to restrict doctors to their specific clinic location's reviews and leads.
2. **Patient Portal Direct Access:**
   - In the current architecture, patients interact via public form submissions (`FormSubmission`) and reviews (`Review`), but do not have authenticated user accounts in the `User` table. If patient accounts are introduced, row-level patient scoping (`patientId === currentUser.patientId`) will be required.
