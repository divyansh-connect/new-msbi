# PHI Handling & Data Minimization Policy

| Policy Metadata | Specification |
| :--- | :--- |
| **Policy ID** | POL-PHI-002 |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-08-24 |
| **Owner** | Privacy Officer (TO BE ASSIGNED) |
| **Approved By** | Compliance Committee (TO BE ASSIGNED) |
| **Review Date** | Annual (Next: 2027-08-24) |
| **Status** | ACTIVE / LEGAL & COMPLIANCE REVIEW REQUIRED |
| **Classification** | Internal Governance |

---

## 1. Purpose & Scope
This policy governs the creation, collection, processing, transmission, storage, and disposal of Protected Health Information (PHI) and Electronic Protected Health Information (ePHI) across the Spine-Brain platform.

## 2. Identified ePHI Assets
1. **Form Inquiries & Submissions**: Patient name, email address, telephone number, clinical inquiry message, and appointment preferences.
2. **Call Logs**: Caller name, telephone number, call duration, timestamp, and secure audio recording URL.
3. **Leads & Inquiries**: Prospective patient demographic info and condition category.

## 3. Mandatory Handling Safeguards
1. **Minimum Necessary Standard (45 CFR § 164.502(b))**: Workforce members shall only access the minimum necessary ePHI required to fulfill their assigned clinical or administrative role.
2. **Zero Plaintext Storage**: ePHI must never be stored in unencrypted local drives, shared network folders, unmanaged spreadsheets, or portable media.
3. **Client-Side Storage Prohibition**: Patient clinical notes, diagnostic data, and identifiable records are strictly forbidden from `localStorage`, `sessionStorage`, or unmanaged browser cookies.
4. **Third-Party Transmission Restrictions**: ePHI shall not be transmitted to third-party marketing, analytics, or AI providers unless an executed Business Associate Agreement (BAA) is verified on file.
5. **Safe Disposal**: Physical records containing PHI must be cross-cut shredded; digital media must undergo NIST SP 800-88 sanitization.

## 4. Change History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-08-24 | Privacy Officer | Initial baseline formalization for Step 13. |
