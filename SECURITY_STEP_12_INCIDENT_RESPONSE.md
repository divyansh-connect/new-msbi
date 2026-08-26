# SECURITY STEP 12: INCIDENT RESPONSE PLAN & RUNBOOK
**Spine Brain Project — Cybersecurity Incident Response Procedures**
**Date:** 2026-08-24
**Scope:** Systematic procedures for detecting, classifying, containing, eradicating, and recovering from cybersecurity incidents, credential compromises, and data exposure events.

---

## Executive Summary & Guiding Principles

This Incident Response Plan establishes standard operating procedures for responding to security incidents involving the Spine Brain CRM and associated infrastructure.

> [!IMPORTANT]
> **Legal & Breach Notification Rule:** Under the HIPAA Breach Notification Rule (45 CFR §§ 164.400–414), any acquisition, access, use, or disclosure of Protected Health Information (PHI) in a manner not permitted under the Privacy Rule is presumed to be a breach unless a formal risk assessment demonstrates a low probability of compromise.
> **All legal determinations, risk assessments, and breach notification obligations are strictly marked: `LEGAL/COMPLIANCE REVIEW REQUIRED`. Technical staff must NOT make legal breach-notification determinations autonomously.**

---

## 1. Incident Classification & Severity Levels

| Severity Level | Definition & Examples | Initial Response SLA | Escalation Target |
|:---:|---|:---:|---|
| **SEV-1 (CRITICAL)** | Active unauthorized access to database, confirmed exfiltration of PHI/PII, ransomware on production database, root credential compromise, widespread database destruction. | **< 15 Minutes** | Incident Commander, Lead Infrastructure Engineer, Chief Information Security Officer (CISO), Legal Counsel, Compliance Officer. |
| **SEV-2 (HIGH)** | Compromise of an individual administrative account, active brute-force or credential stuffing attack, unauthorized privilege escalation attempt, integration secret exposure in logs or repository. | **< 1 Hour** | Incident Commander, Lead Backend Engineer, Security Operations Team. |
| **SEV-3 (MEDIUM)** | Repeated failed authentication attempts exceeding rate limits, isolated IDOR attempt blocked by authorization middleware, non-critical third-party API error spike. | **< 4 Hours** | Lead Backend Engineer, System Administrator. |
| **SEV-4 (LOW)** | Scanned vulnerability report on non-production dependency, minor misconfiguration in test environment, routine security alert with no evidence of exploitation. | **< 24 Hours** | Security / Development Team during business hours. |

---

## 2. Six-Phase Incident Response Lifecycle

```
 ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
 │  1. DETECTION   │ ──►  │ 2. CONTAINMENT  │ ──►  │ 3. ERADICATION  │
 └─────────────────┘      └─────────────────┘      └─────────────────┘
          │                                                 │
          ▼                                                 ▼
 ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
 │ 6. POST-INCIDENT│ ◄──  │   5. RECOVERY   │ ◄──  │4. FORENSIC AUDIT│
 └─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## 3. Phase 1: Detection & Initial Triage

1. **Detection Sources:**
   - Real-time error alerts from Fastify Pino logging.
   - Rate limit violations or anomalous spikes on `/api/v1/auth/login`.
   - Unexpected `403 Forbidden` spikes in ActivityLog (`WHERE success = false`).
   - Third-party security disclosure or developer credential exposure report.
2. **Immediate Triage Actions:**
   - Log the exact detection timestamp (UTC).
   - Assign an Incident Commander (IC) and open an Incident Tracking Ticket.
   - Establish a dedicated, secure communication channel (out-of-band communication, e.g., private encrypted channel).

---

## 4. Phase 2: Containment Procedures

### A. Compromised User Account Containment
1. **Revoke Active Sessions Immediately:**
   ```sql
   -- Revoke all active sessions for the compromised user account
   UPDATE `railway`.`user_session`
   SET `revokedAt` = NOW()
   WHERE `userId` = '<COMPROMISED_USER_ID>' AND `revokedAt` IS NULL;
   ```
2. **Deactivate User Account:**
   ```sql
   -- Disable login access
   UPDATE `railway`.`user`
   SET `isActive` = FALSE
   WHERE `id` = '<COMPROMISED_USER_ID>';
   ```
3. **Rotate User Password Hash:** Issue a password reset to ensure old credentials cannot authenticate.

### B. Compromised Application Secret / JWT Key Containment
1. **Rotate `JWT_SECRET` in Hosting Environment:** Immediately invalidate all active JWT tokens globally across all users.
2. **Mass Session Revocation:**
   ```sql
   UPDATE `railway`.`user_session`
   SET `revokedAt` = NOW()
   WHERE `revokedAt` IS NULL;
   ```
3. **Restart Backend Containers:** Forces reload of new `JWT_SECRET`.

### C. Compromised Database / Infrastructure Containment
1. **Isolate Database Network:** Restrict MySQL ingress firewall to known administrative bastion IPs or private VPC subnet only.
2. **Rotate Database User Passwords:** Update MySQL user credentials and update `DATABASE_URL` in hosting secrets.
3. **Block Attacker IP Addresses:** Apply edge IP firewall rules at Cloudflare / reverse proxy level to drop all traffic from attacker source CIDRs.

---

## 5. Phase 3: Evidence Preservation & Forensic Logging

> [!IMPORTANT]
> **Forensic Integrity Rule:** Never overwrite, delete, or alter log files or database records during an active investigation. Preserve all evidence for legal and regulatory analysis.

1. **Preserve Application Logs:**
   - Export structured Pino server logs covering 7 days prior to detection.
   - Store log exports in write-once / immutable storage with SHA-256 checksums.
2. **Preserve ActivityLog Records:**
   - Query all audit trail records involving the attacker IP or compromised account:
     ```sql
     SELECT * FROM `railway`.`activitylog`
     WHERE `userId` = '<COMPROMISED_USER_ID>'
        OR `ipAddress` = '<ATTACKER_IP>'
        OR `timestamp` BETWEEN '<START_TIME>' AND '<END_TIME>'
     ORDER BY `timestamp` ASC;
     ```
   - Export results to an encrypted forensic archive.
3. **Preserve System Snapshots:** Take point-in-time snapshots of container logs, environment configs, and database states.

---

## 6. Phase 4: Eradication & Root Cause Analysis

1. **Identify Vulnerability Vector:**
   - Did the incident result from credential guessing, phishing, unpatched dependency, or misconfigured permission?
2. **Patch Code / Configuration:**
   - Implement necessary code fixes or schema constraints.
   - Run full regression test suite (`npx ts-node test_infrastructure_security.ts`, etc.) to confirm remediation.
3. **Remove Unauthorized Backdoors / Artifacts:**
   - Inspect database for any unauthorized user accounts created during the breach window:
     ```sql
     SELECT id, email, roleName, createdAt FROM `railway`.`user`
     WHERE `createdAt` >= '<INCIDENT_START_TIME>';
     ```
   - Delete any unauthorized records after forensic capture.

---

## 7. Phase 5: Recovery & Verification

1. **Restore Normal Operations:**
   - Re-enable services in a controlled, monitored state.
   - Re-activate legitimate user accounts with forced password resets.
2. **Post-Recovery Verification:**
   - Monitor real-time logs for recurrence of malicious traffic patterns.
   - Verify health check endpoints (`/health` returning 200 OK).
   - Confirm audit logging is actively recording all administrative actions.
3. **Heightened Monitoring:** Maintain 24-hour elevated monitoring following any SEV-1 or SEV-2 incident.

---

## 8. Phase 6: Post-Incident Review & Legal Escalation

### A. Post-Incident Review (Lessons Learned)
Within 5 business days of incident resolution:
1. Conduct a blameless post-mortem meeting with engineering and security leads.
2. Compile a formal Incident Post-Mortem Report covering:
   - Root cause analysis
   - Timeline of events
   - Containment effectiveness
   - Corrective action items with assigned owners and deadlines.

### B. Legal & Compliance Escalation (`LEGAL/COMPLIANCE REVIEW REQUIRED`)
Under 45 CFR § 164.402, the Incident Commander and CISO must brief Legal Counsel and the Compliance Officer to evaluate:
- [ ] **Was PHI Acquired or Disclosed?** Determine whether any electronic Protected Health Information was accessed by unauthorized parties.
- [ ] **Four-Factor HIPAA Risk Assessment:**
  1. The nature and extent of the PHI involved (types of identifiers and likelihood of re-identification).
  2. The unauthorized person who used or received the PHI.
  3. Whether the PHI was actually acquired or viewed.
  4. The extent to which the risk to the PHI has been mitigated.
- [ ] **Breach Notification Timelines:** If a breach is confirmed, legal counsel must determine notification requirements to affected individuals (within 60 calendar days under HIPAA) and the HHS Office for Civil Rights (OCR).

---

*End of SECURITY_STEP_12_INCIDENT_RESPONSE.md*
