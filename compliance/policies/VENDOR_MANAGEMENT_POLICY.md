# Vendor & Business Associate Management Policy

| Policy Metadata | Specification |
| :--- | :--- |
| **Policy ID** | POL-VEN-011 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Owner** | Vendor Management Owner (TO BE ASSIGNED) |
| **Approved By** | Compliance & Legal Committee (TO BE ASSIGNED) |
| **Review Date** | Annual (Next: 2027-08-24) |
| **Status** | ACTIVE / LEGAL & COMPLIANCE REVIEW REQUIRED |
| **Classification** | Internal Governance |

---

## 1. Purpose & Scope
This policy mandates governance, risk assessment, and Business Associate Agreement (BAA) execution for all third-party software, cloud vendors, and subcontractors interacting with the Spine-Brain application or receiving ePHI pursuant to **45 CFR § 164.308(b) and § 164.502(e)**.

## 2. Policy Mandates
1. **BAA Requirement**: Prior to transmitting, creating, receiving, or maintaining any ePHI through a third party, a compliant HIPAA Business Associate Agreement must be fully executed and verified on file (`BAA_REGISTER.md`).
2. **Vendor Risk Assessment**: All vendors must undergo a risk evaluation before onboarding and annually thereafter (`VENDOR_RISK_REGISTER.md`).
3. **Data Flow Minimization**: Integration services must transmit only aggregate performance metrics (impressions, clicks, spend) and public review data, strictly excluding patient demographic and medical records.
4. **Third-Party Credential Protection**: API keys and OAuth tokens for external vendors must be encrypted in MySQL using AES-256-GCM (`INTEGRATION_ENCRYPTION_KEY`).
5. **No Client Tracking Pixels**: Client-side tracking pixels (Meta Pixel, Google Tag Manager) must never be injected on pages processing clinical inquiries or patient appointments.

## 3. Change History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-08-24 | Vendor Owner | Standardized Vendor & BAA Management Policy. |
