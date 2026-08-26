# Workforce Lifecycle & Account Management Policy (Joiner / Mover / Leaver)

| Policy Metadata | Specification |
| :--- | :--- |
| **Policy ID** | POL-WLC-016 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Owner** | HR & Security Lead (TO BE ASSIGNED) |
| **Approved By** | Executive Leadership (TO BE ASSIGNED) |
| **Review Date** | Annual (Next: 2027-08-24) |
| **Status** | ACTIVE / HR & IT OPERATIONAL PROCEDURE |
| **Classification** | Internal Governance |

---

## 1. Purpose & Scope
This policy governs the full lifecycle of workforce user accounts—from onboarding (Joiner), internal transfers/promotions (Mover), to departure and termination (Leaver)—under **45 CFR § 164.308(a)(3)**.

---

## 2. Workforce Lifecycle Stages & Procedures

### Stage 1: Joiner (New Employee / Contractor Onboarding)
1. **Background & Clearance Verification**: HR completes identity and background verification prior to system account creation.
2. **Account Provisioning**: IT Administrator creates account via `POST /api/v1/users` with a unique corporate email address.
3. **Role & Department Assignment**: Account is assigned the minimum necessary role (`Specialist`, `Manager`, `Clinical Lead`, or `Admin`) with explicit department mapping.
4. **Mandatory Training Requirement**: User must complete HIPAA Security and Privacy training within 14 days (`POL-TRN-012`).

### Stage 2: Mover (Role Change / Department Transfer / Promotion)
1. **Access Modification**: Upon department transfer or role change, supervisor submits an access adjustment request.
2. **Privilege Recalibration**: IT updates the user role in the database.
3. **Previous Privilege Deprovisioning**: Outdated permissions are removed immediately upon role reassignment.
4. **Active Session Refresh**: Existing sessions are invalidated or refreshed to ensure new database permissions take effect.

### Stage 3: Leaver (Standard Termination / Resignation)
1. **HR Notification SLA**: HR must notify IT at least 24 hours prior to planned separation, or immediately upon unexpected departure.
2. **Account Deactivation**: IT deactivates the user account (`isActive: false`).
3. **Immediate Session Termination**: IT invokes `POST /api/v1/auth/sessions/revoke-all` to invalidate all active refresh tokens and server sessions across all devices.
4. **Resource Reassignment**: Open patient inquiries or assigned marketing campaigns are reassigned to an active team member.
5. **Preservation of Audit Trail**: The user account is NEVER deleted from MySQL. Historical `ActivityLog` records remain permanently linked to the user's ID for forensic and HIPAA compliance integrity (`onDelete: Restrict`).

### Stage 4: Emergency Suspension (Compromised Account / Security Incident)
1. **Incident Trigger**: Upon detection of suspicious activity, brute-force alarms, or credential leakage:
   - Account is immediately set to `isActive: false`.
   - All sessions are revoked.
   - Password hash is updated to an unguessable randomized string.
2. **Forensic Audit**: Security Officer queries `/api/v1/users/activity-logs?userId=<compromised_id>` to analyze all actions taken during the anomaly window.
3. **Re-enabling**: Account is re-enabled only after user identity re-verification, malware scan of user devices, and password reset.

---

## 3. Manual HR Action & No Direct HR Automation
- The application does not maintain automated HR connectors.
- All Joiner/Mover/Leaver transitions are initiated via manual HR ticketing workflows and executed by authorized administrators via the secure User Management interface (`/users-roles`).

---

## 4. Change History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-08-24 | HR & Security | Standardized Joiner / Mover / Leaver Policy. |
