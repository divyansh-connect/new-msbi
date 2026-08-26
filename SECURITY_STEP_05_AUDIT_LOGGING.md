# STEP 5: CENTRALIZED SECURITY AUDIT LOGGING ARCHITECTURE

## 1. Executive Summary & Overview

In **Step 5**, we implemented a centralized, non-repudiable **Security Audit Logging System** built on top of the existing `ActivityLog` infrastructure. This system captures all security-relevant lifecycle events—including authentication attempts, role and permission evaluations, administrative operations, PHI/patient inquiry accesses, and report data exports—while strictly redacting sensitive credentials and avoiding unnecessary PHI retention.

All audit events are persisted to the real MySQL database via Prisma ORM and are made accessible exclusively to authorized administrative personnel through protected, paginated, and filterable APIs.

---

## 2. Existing vs Enhanced Schema Comparison

### Previous State:
The existing `ActivityLog` schema had minimal fields (`id`, `userId`, `action`, `resource`, `timestamp`) and lacked:
- Support for unauthenticated or anonymous failure events (e.g., failed logins by unregistered emails).
- Request context (HTTP method, route, client IP, User-Agent).
- Structured outcome attribution (`success`, `failureReason`).
- Explicit resource categorization (`resourceType`, `resourceId`).
- User role and user email snapshots (to maintain an immutable audit trail even if user records change or are deleted).

### Enhanced State (`prisma/schema.prisma`):
```prisma
model ActivityLog {
  id            String   @id @default(uuid())
  userId        String?  // Nullable to capture unauthenticated failed attempts & deleted users
  userEmail     String?  // Snapshot of actor email at event time
  userRole      String?  // Snapshot of actor role at event time
  action        String   // Canonical event identifier (e.g. LOGIN_SUCCESS, PERMISSION_DENIED)
  resourceType  String?  // Category: "auth", "patient", "user", "role", "report", etc.
  resourceId    String?  // Specific ID of the resource affected
  resource      String?  // Human-readable summary or resource descriptor
  requestMethod String?  // HTTP method: GET, POST, PUT, DELETE
  route         String?  // Route URL path
  ipAddress     String?  // Client IP (supports X-Forwarded-For)
  userAgent     String?  @db.VarChar(500) // Client browser/device agent (truncated safely)
  success       Boolean  @default(true)
  failureReason String?  // Structured description of failure or rejection
  timestamp     DateTime @default(now())
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([timestamp])
  @@index([resourceType])
}
```

### Migration Execution:
Applied migration `20260822000000_enhance_activity_log_security_audit/migration.sql` to the live MySQL database via `prisma migrate deploy` without dropping tables, creating fake data, or altering existing records.

---

## 3. Centralized Audit Service Architecture

The audit system is centralized in [`src/services/audit.service.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/services/audit.service.ts):

### Core Components:
1. **Canonical Event Enum (`SecurityEvents`)**:
   - `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`
   - `PERMISSION_DENIED`, `ACCOUNT_DISABLED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`
   - `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`, `USER_STATUS_CHANGED`
   - `ROLE_CREATED`, `ROLE_UPDATED`, `ROLE_DELETED`, `ROLE_CHANGED`, `PERMISSION_CHANGED`
   - `PATIENT_VIEW`, `PATIENT_LIST`, `DATA_EXPORT`, `AUDIT_LOG_VIEW`

2. **`AuditService.log(entry)`**:
   - Asynchronous, non-blocking execution.
   - Database errors inside the audit logger are caught and logged via Pino to ensure business endpoints never crash if an audit write fails.
   - Strips and prevents storage of passwords, tokens, API keys, or raw PHI bodies.

3. **`AuditService.extractRequestMeta(request)`**:
   - Centralized extraction of client IP (resolving proxy headers `x-forwarded-for` and Fastify `request.ip`), HTTP method, route, and User-Agent (truncated to 500 characters).

4. **`AuditService.getLogs(params)`**:
   - High-performance query interface supporting pagination (`page`, `limit`), date filtering (`startDate`, `endDate`), action filtering, role/user filtering, and search over action/email/resource/failure reasons.

---

## 4. Security Events Implemented & Code Locations

| Security Event | Trigger Condition | Controller / Middleware |
| :--- | :--- | :--- |
| `LOGIN_SUCCESS` | User enters valid credentials | [`auth.controller.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/auth.controller.ts) |
| `LOGIN_FAILED` | Invalid password or non-existent user | [`auth.controller.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/auth.controller.ts) |
| `PERMISSION_DENIED` | Missing RBAC permission or cross-user IDOR access attempt | [`rbac.middleware.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/middlewares/rbac.middleware.ts) & [`users.controller.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/users.controller.ts) |
| `ACCOUNT_DISABLED` | Disabled user attempts authenticated API access | [`rbac.middleware.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/middlewares/rbac.middleware.ts) |
| `USER_CREATED` | Administrator registers a new user | [`users.controller.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/users.controller.ts) |
| `USER_UPDATED` | User or Admin updates notification preferences / profile | [`users.controller.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/users.controller.ts) |
| `ROLE_CHANGED` | User role is reassigned | [`rbac.controller.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/rbac.controller.ts) |
| `PERMISSION_CHANGED` | Role permissions matrix is modified | [`rbac.controller.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/rbac.controller.ts) |
| `PATIENT_VIEW` | Authorized user retrieves individual patient inquiry form submission | [`form-submissions.controller.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/form-submissions.controller.ts) |
| `DATA_EXPORT` | Analytics / Business report is generated | [`reports.controller.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/reports.controller.ts) |
| `AUDIT_LOG_VIEW` | Administrator views security activity audit records | [`users.controller.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/controllers/users.controller.ts) |

---

## 5. Audit Log Protection & Admin-Only Query API

### Access Control:
- The endpoint `GET /api/v1/users/activity-logs` is protected by `authenticate` and `authorize('users-roles')`.
- Regular staff, specialists, and unauthorized roles receive `403 Forbidden` and their unauthorized inspection attempts are themselves audited as `PERMISSION_DENIED`.

### Log Tamper Protection:
- **No Mutation Endpoints**: No `DELETE`, `PUT`, or `PATCH` routes exist for `ActivityLog`.
- **Foreign Key Resilience**: The `userId` relation uses `onDelete: SetNull` so that deleting or archiving a user record does not delete audit log history.

---

## 6. PHI and Secret Minimization

1. **Credential Sanitization**: Passwords, hashes, and authorization headers are never passed to or stored by `AuditService`.
2. **Failure Logging**: On `LOGIN_FAILED`, the attempted email is recorded to detect brute-force attacks, but the submitted password is discarded.
3. **PHI Access Auditing**: `PATIENT_VIEW` logs record *that* a record was viewed, by *whom*, and the *resource ID*, without copying full medical payloads or patient clinical notes into the audit trail.

---

## 7. Verification & Automated Test Results

Across all 4 security test suites and build validations, **96 out of 96 assertions passed** against the real MySQL database:

| Test Suite | Purpose | Assertions | Status |
| :--- | :--- | :---: | :---: |
| [`test_audit_logging.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/test_audit_logging.ts) | Login events, RBAC rejections, PHI access, Redaction, Query API | **13 / 13** | **PASSED** |
| [`test_auth_security.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/test_auth_security.ts) | JWT verification, token expiration, secret enforcement | **41 / 41** | **PASSED** |
| [`test_rbac_security.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/test_rbac_security.ts) | Authoritative DB roles, permissions matrix, anti-tampering | **26 / 26** | **PASSED** |
| [`test_resource_authorization.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/test_resource_authorization.ts) | Horizontal privilege escalation & IDOR prevention | **16 / 16** | **PASSED** |
| `npx tsc --noEmit` | TypeScript typecheck across backend | **0 errors** | **PASSED** |
| `npx prisma validate` | Prisma schema integrity & relation check | **Valid** | **PASSED** |
| **Total Assertions** | | **96 / 96** | **100% PASSED** |

---

## 8. Remaining Limitations & Recommendations

1. **Database-Level Immutability**: While application APIs do not expose audit log deletion or alteration, production database user accounts should be configured with `REVOKE UPDATE, DELETE ON railway.activitylog` to enforce append-only guarantees at the RDBMS level.
2. **SIEM / Remote Forwarding**: For enterprise environments, consider forwarding Pino security logs asynchronously to an external SIEM (e.g., AWS CloudWatch, Datadog, or Elasticsearch) for off-site disaster recovery and retention.
