# Business Associate Agreement (BAA) Register

| Document Metadata | Value |
| :--- | :--- |
| **Register ID** | BAA-REG-2026-01 |
| **Version** | 1.0.0 |
| **Last Updated** | 2026-08-24 |
| **Governance Standard** | 45 CFR § 164.502(e) & § 164.504(e) (Business Associate Contracts) |
| **Owner** | Vendor Management & Legal Counsel (TO BE ASSIGNED) |
| **Review Frequency** | Semi-Annual |

---

## 1. Vendor BAA Inventory & Tracking

*Notice: In accordance with verification standards, BAA execution dates, signatures, and contract statuses are not fabricated. Vendors lacking confirmed BAA records in repository legal archives are designated as `MANUAL REVIEW REQUIRED`.*

| Vendor / Provider Name | Service Provided & Purpose | PHI / ePHI Transmitted or Stored | BAA Required? | Current BAA Status | Effective Date | Renewal / Review Date | Known Subprocessors | Evidence / Legal Repository Location | Assigned Owner | Action Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Railway Corp.** | Container hosting, Node.js API runtime & Managed MySQL | **YES** (Hosts MySQL database containing ePHI inquiries, call logs, user sessions) | **YES** | **MANUAL REVIEW REQUIRED** | TO BE ASSIGNED | TO BE ASSIGNED | AWS / GCP infrastructure | Railway Console Account / Legal Archive | Infrastructure Owner (TO BE ASSIGNED) | Obtain signed Enterprise BAA with Railway / verify HIPAA-compliant plan tier. |
| **Google LLC (Google Ads / GA4)** | Campaign conversion analytics & aggregate web traffic | **NO** (Only aggregate impressions, clicks, spend, and website pageview counts transmitted) | **NO** (Assuming zero PHI transmission) | **NOT APPLICABLE / VERIFIED** | N/A | Annual Review | Google Global Cloud | `src/services/googleAds.service.ts`, `src/services/ga4.service.ts` | Marketing Lead (TO BE ASSIGNED) | Maintain strict code guardrails ensuring patient demographic data is never transmitted. |
| **Meta Platforms, Inc. (Meta Ads)** | Social media advertising campaign sync & aggregate metrics | **NO** (Only aggregate ad spend and clicks retrieved; zero client tracking pixels on ePHI pages) | **NO** (Assuming zero PHI transmission) | **NOT APPLICABLE / VERIFIED** | N/A | Annual Review | Meta Global Infra | `src/services/metaAds.service.ts`, `test_third_party_security.ts` | Marketing Lead (TO BE ASSIGNED) | Verify frontend contains zero Meta Pixel scripts. |
| **CallRail, Inc.** | Inbound call tracking, caller identification & call recording | **YES** (Processes caller telephone numbers, caller names, and audio recording URLs) | **YES** | **MANUAL REVIEW REQUIRED** | TO BE ASSIGNED | TO BE ASSIGNED | Twilio / AWS | CallRail Account / Legal Contract Archive | Operations Lead (TO BE ASSIGNED) | Verify executed HIPAA BAA with CallRail for healthcare call recording. |
| **HubSpot, Inc.** | Marketing automation & aggregate campaign tracking | **NO** (Configured for aggregate marketing campaigns; ePHI inquiry sync not active) | **CONDITIONAL** (If used for patient leads, BAA required) | **MANUAL REVIEW REQUIRED** | TO BE ASSIGNED | TO BE ASSIGNED | AWS / Cloudflare | HubSpot Account / Legal Archive | Operations Lead (TO BE ASSIGNED) | Legal review of HubSpot usage scope; execute BAA if prospective patient leads are synchronized. |
| **Automattic / WordPress Engine** | Public clinic CMS & website intake form webhook dispatches | **NO** (WordPress only serves public CMS content; webhooks dispatch inbound inquiries over TLS) | **CONDITIONAL** (If intake form data is retained in WP database) | **MANUAL REVIEW REQUIRED** | TO BE ASSIGNED | TO BE ASSIGNED | Hosting Provider | WordPress Server Config / Hosting Account | Web Development Lead (TO BE ASSIGNED) | Disable local database storage of patient form submissions in WordPress (`cf7_db` / Gravity Forms DB). |
| **The Rocket Science Group (Mailchimp)** | General newsletter & practice update broadcasts | **NO** (Broadcast marketing only; no clinical treatment or patient inquiry data synchronized) | **NO** (Assuming zero PHI transmission) | **NOT APPLICABLE / VERIFIED** | N/A | Annual Review | Akamai / AWS | `src/services/mailchimp.service.ts` | Marketing Lead (TO BE ASSIGNED) | Prohibit uploading clinical patient lists to Mailchimp. |

---

## 2. BAA Governance Verification Checklist
- [ ] Contact Railway Enterprise Support to execute standard Business Associate Agreement.
- [ ] Confirm CallRail Healthcare Compliance tier and verify countersigned BAA.
- [ ] Verify HubSpot account configuration restricts synchronization to non-clinical leads.
- [ ] Audit WordPress hosting database to ensure form inquiries are transmitted via webhook and immediately purged from WordPress MySQL tables.
