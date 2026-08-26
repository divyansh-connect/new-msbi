# Vendor Security Risk Register

| Document Metadata | Value |
| :--- | :--- |
| **Register ID** | VEN-RISK-2026-01 |
| **Version** | 1.0.0 |
| **Last Updated** | 2026-08-24 |
| **Governance Standard** | 45 CFR § 164.308(b) (Business Associate Risk Governance) |
| **Review Frequency** | Annual |

---

## 1. Third-Party Vendor Risk Profiles

| Vendor | Primary Purpose | Data Transmitted / Maintained | PHI Processed? | Identified Security Risks | BAA Status | Key Subprocessors | Breach Notification SLA | Contract Status | Inherent Risk Level | Residual Risk Level | Review Due Date |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Railway Corp.** | Cloud container & managed MySQL database hosting | Full MySQL schema, patient inquiries, call logs, user passwords | **YES** | Cloud misconfiguration, container breach, unauthorized administrative access, datacenter outage | `MANUAL REVIEW REQUIRED` | AWS / GCP infrastructure | < 24 Hours (per HIPAA BAA) | Active Hosting Subscription | **Critical** | **Low (Mitigated by AES-256-GCM, TLS, strict IAM)** | 2027-08-24 |
| **CallRail, Inc.** | Dynamic call tracking & telephony call recording | Caller phone numbers, caller names, voice recordings | **YES** | Eavesdropping, unauthorized recording access, telecom credential leak | `MANUAL REVIEW REQUIRED` | Twilio, AWS | < 48 Hours | Active Vendor Contract | **High** | **Low (Mitigated by RBAC restricted audio access)** | 2027-08-24 |
| **Google LLC (Google Ads / GA4)** | Search advertising & web traffic analytics | Aggregate impressions, clicks, advertising spend, pageviews | **NO** | Accidental demographic / conversion tag leakage | `NOT APPLICABLE` | Google Data Centers | Standard Google SLA | Active Service Agreement | **Medium** | **Low (Zero PHI in payload; verified by tests)** | 2027-08-24 |
| **Meta Platforms, Inc.** | Social media advertising campaign sync | Aggregate ad spend, impressions, click metrics | **NO** | Tracking pixel leakage, cross-site tracking of patient visits | `NOT APPLICABLE` | Meta Infrastructure | Standard Meta SLA | Active Service Agreement | **Medium** | **Low (Zero Meta Pixel on ePHI pages)** | 2027-08-24 |
| **HubSpot, Inc.** | Marketing automation & campaign attribution | Aggregate campaign metrics & prospective inquiry forms | **CONDITIONAL** | Unintended sync of clinical messages or diagnostic data | `MANUAL REVIEW REQUIRED` | AWS, Cloudflare | < 72 Hours | Active Service Agreement | **Medium** | **Low (Restricted to aggregate marketing metrics)** | 2027-08-24 |
| **WordPress (CMS Host)** | Public website content & intake form webhook dispatch | Public blog posts, pages; inbound form POST webhooks | **NO** | CMS vulnerability, unpatched WordPress plugin exploit, form data cache | `MANUAL REVIEW REQUIRED` | Web Hosting Provider | < 24 Hours | Active Hosting Subscription | **High** | **Low (Webhook verified with HMAC secret; no WP DB storage)** | 2027-08-24 |
| **Mailchimp** | Practice newsletter & patient education announcements | Email addresses, newsletter open/click statistics | **NO** | Mass email misdirection, account compromise | `NOT APPLICABLE` | Akamai, AWS | Standard SLA | Active Subscription | **Low** | **Low (No clinical data; opt-out honored)** | 2027-08-24 |

---

## 2. Vendor Onboarding & Offboarding Controls
1. **Onboarding Security Review**: All new software vendors must undergo architectural security review by the Security Officer.
2. **BAA Requirement**: If vendor touches ePHI, access is blocked until countersigned BAA is uploaded to the legal archive.
3. **Offboarding Deprovisioning**: Upon vendor contract termination, integration credentials in `IntegrationCredential` are immediately set to `isActive: false` and API keys purged.
