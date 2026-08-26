# SECURITY STEP 11: THIRD-PARTY INTEGRATIONS, PHI DISCLOSURE & BAA READINESS
**Spine Brain Project — Technical Security & Vendor Compliance Review**
**Date:** 2026-08-24
**Scope:** Third-party vendor discovery, data-flow mapping, PHI disclosure analysis, data minimization, OAuth/webhook security, BAA readiness, and technical integration controls.

---

## Executive Summary

Step 11 establishes a verified inventory and data-flow map of all external third-party integrations across the Spine Brain CRM application. Every external service boundary was inspected for PHI leakage, unnecessary data transmission, credential security, OAuth scope containment, webhook verification, and Business Associate Agreement (BAA) readiness under the HIPAA Security and Privacy Rules.

**Step 11 test result: 37/37 PASSED, 0 FAILED**
**Cumulative security baseline: 297/297 PASSED across Steps 2–11**

> [!IMPORTANT]
> **Compliance & BAA Statement:** No vendor is claimed to be HIPAA compliant merely because it provides security features or SOC 2 certifications. BAA readiness statuses documented herein reflect official vendor policy and technical architecture. This document does not constitute a legal contract, nor does it execute or sign any Business Associate Agreement. **This application is NOT self-certified as HIPAA compliant or HIPAA certified.**

---

## Full Regression Baseline (Steps 2–11)

| Step | Security Domain | Assertions Passed | Assertions Failed | Status |
|------|-----------------|:---:|:---:|:---:|
| Step 2 | Authentication Security | 41 | 0 | ✅ PASS |
| Step 3 | RBAC & Permissions | 26 | 0 | ✅ PASS |
| Step 4 | Resource Authorization / IDOR | 16 | 0 | ✅ PASS |
| Step 5 | Audit Logging | 13 | 0 | ✅ PASS |
| Step 6 | Session & JWT Security | 48 | 0 | ✅ PASS |
| Step 7 | Secrets & Environment Security | 30 | 0 | ✅ PASS |
| Step 8 | API Security Hardening | 33 | 0 | ✅ PASS |
| Step 9 | PHI-Safe Logging & Frontend Security | 12 | 0 | ✅ PASS |
| Step 10 | Files, Documents & Data Export Security | 41 | 0 | ✅ PASS |
| **Step 11** | **Third-Party Integrations & BAA Readiness** | **37** | **0** | **✅ PASS** |
| | **CUMULATIVE TOTAL** | **297** | **0** | **✅ ALL PASS** |

- **Backend TypeScript Compilation (`npx tsc --noEmit`):** 0 errors (PASSED)
- **Prisma Schema Validation (`npx prisma validate`):** VALID 🚀
- **Frontend Production Build (`npm run build`):** PASSED (built in 9.30s)
- **Real Database Safety:** Real MySQL database structure preserved with zero destructive migrations

---

## 1. Third-Party Vendor Inventory (Discovered in Codebase)

The repository was comprehensively inspected across package manifests, environment definitions, services, routes, controllers, and frontend assets. Only vendors actually present in the codebase are included below:

| Vendor | Product / Service | Purpose in CRM | Boundary | Auth / Credential Method | Storage Used? |
|--------|-------------------|----------------|----------|--------------------------|:---:|
| **Google LLC** | Google OAuth 2.0 | Admin & Marketing authentication to Google APIs | Backend | Client ID + Client Secret (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) | DB (Encrypted) |
| **Google LLC** | Google Analytics 4 (GA4) | Web traffic volume and landing page session metrics | Backend | OAuth 2.0 Access/Refresh Token | DB (Encrypted) |
| **Google LLC** | Google Search Console (GSC) | Search queries and organic impression metrics | Backend | OAuth 2.0 Access/Refresh Token | DB (Encrypted) |
| **Google LLC** | Google Ads API | Campaign performance, clicks, ad spend | Backend | OAuth 2.0 Token + Developer Token | DB (Encrypted) |
| **Google LLC** | Google Business Profile / Reviews | Location management and public review sync/replies | Backend | OAuth 2.0 Access/Refresh Token | DB (Encrypted) |
| **Google LLC** | Google Cloud Pub/Sub | Inbound webhook notifications for new Google reviews | Inbound | Webhook Secret (`GOOGLE_REVIEWS_WEBHOOK_SECRET`) | None (Stateless) |
| **WordPress** (midwestspine.net) | WordPress REST API | Read public blog posts, conditions, pages, media | Backend | Public REST API (No auth required) | None |
| **WordPress** (midwestspine.net) | WordPress Form Webhook | Inbound prospective patient contact form submissions | Inbound | HMAC Secret (`WORDPRESS_FORM_WEBHOOK_SECRET`) | Local DB (`FormSubmission`, `Lead`) |
| **CallRail, Inc.** | CallRail API | Inbound phone call logs, durations, caller metadata | Backend | API Token (`CALLRAIL_API_TOKEN`) / DB config | Local DB (`CallLog`) |
| **Meta Platforms, Inc.** | Meta Ads / Graph API | Facebook & Instagram ad campaign metrics | Backend | OAuth Access Token in DB config | DB (Encrypted) |
| **Intuit Inc.** | Mailchimp API | Email campaign metrics (opens, clicks, bounce rate) | Backend | API Key (`apiKey` + `serverPrefix`) in DB config | DB (Encrypted) |
| **HubSpot, Inc.** | HubSpot CRM API | Synchronizing lead/contact identities | Backend | OAuth Access Token in DB config | DB (Encrypted) |
| **Twilio Inc.** | Twilio SendGrid | Staff email notifications for new Google reviews | Backend | SendGrid API Key (`SENDGRID_API_KEY`) | None (Stateless) |
| **Twilio Inc.** | Twilio Programmable SMS | Staff SMS notifications for new Google reviews | Backend | Account SID + Auth Token (`TWILIO_AUTH_TOKEN`) | None (Stateless) |

---

## 2. Integration Architecture & Data-Flow Mapping

```
                                    [MSBI SPINE-BRAIN ARCHITECTURE]
                                                    │
                 ┌──────────────────────────────────┴──────────────────────────────────┐
                 ▼                                                                     ▼
     [INBOUND INTEGRATIONS]                                                [OUTBOUND INTEGRATIONS]
                 │                                                                     │
  ┌──────────────┴──────────────┐                                       ┌──────────────┴──────────────┐
  ▼                             ▼                                       ▼                             ▼
WordPress Form Webhook   Google Reviews Webhook                    Marketing / Analytics       Staff Alerts
(Timing-Safe Secret)     (Pub/Sub Webhook Secret)                 (OAuth 2.0 / API Tokens)   (SendGrid / Twilio)
  │                             │                                       │                             │
  ├─ Validates Secret           ├─ Validates Secret                     ├─ GA4 (Traffic counts)       ├─ Email: Review summary
  ├─ SHA-256 Idempotency        ├─ Single-Review Pull                   ├─ GSC (Search terms)         └─ SMS: Review summary
  └─ Writes Lead + FormSub      └─ Writes Review in DB                  ├─ Google Ads (Spend/Clicks)
                                                                        ├─ Meta Ads (Spend/Clicks)
                                                                        ├─ Mailchimp (Open rates)
                                                                        ├─ CallRail (Call records)
                                                                        └─ HubSpot (Contact sync)
```

### Data-Flow Details by Provider

1. **WordPress REST API (Outbound):**
   `Backend` ──(HTTP GET `/wp-json/wp/v2/posts`)──► `WordPress` ──► `Normalized Post Data (Public Content)`.
   *Classification:* **NON-SENSITIVE** (public marketing content).

2. **WordPress Contact Forms (Inbound):**
   `WordPress Form Plugin` ──(HTTP POST `/api/v1/webhooks/wordpress/forms` with `x-webhook-secret`)──► `Fastify Controller` ──► `SHA-256 Idempotency Hash` ──► `Local DB Lead & FormSubmission Tables`.
   *Classification:* **PII / PROSPECTIVE PATIENT CONTACT** (`name`, `email`, `phone`, `message`, `utm_*`).

3. **Google Analytics 4 (Outbound):**
   `GA4Service` ──(OAuth 2.0 `runReport`)──► `Google Analytics API` ──► `Aggregated Metrics (sessions, totalUsers, screenPageViews)`.
   *Classification:* **NON-SENSITIVE** (aggregated statistical counters).

4. **Google Search Console (Outbound):**
   `GSCService` ──(OAuth 2.0 `searchanalytics.query`)──► `Search Console API` ──► `Query terms, clicks, impressions`.
   *Classification:* **NON-SENSITIVE** (search terms).

5. **Google Ads (Outbound):**
   `GoogleAdsService` ──(OAuth 2.0 + Developer Token GAQL query)──► `Google Ads API` ──► `Campaign spend, clicks, conversions`.
   *Classification:* **NON-SENSITIVE** (ad performance aggregates).

6. **Google Business Profile & Reviews (Bidirectional):**
   - Outbound review sync: `GoogleBusinessService` ──(OAuth 2.0 GET)──► `My Business API` ──► `Public Reviews`.
   - Outbound reply: `GoogleBusinessService` ──(OAuth 2.0 PUT)──► `My Business API` ──► `Public Staff Reply`.
   - Inbound webhook: `GCP Pub/Sub` ──(POST `/api/v1/webhooks/google-reviews`)──► `GoogleBusinessService.fetchAndSaveSingleReview()`.
   *Classification:* **PUBLIC METADATA** (public user reviews and clinic responses).

7. **CallRail (Inbound Pull):**
   `CallRailService` ──(GET `/v3/a/{id}/calls.json` with token)──► `CallRail API` ──► `Caller Name, Phone Number, Duration, Call Recording URL` ──► `Local DB CallLog Table`.
   *Classification:* **PII / TELEPHONY ePHI** (prospective patient telephony metadata & audio recordings).

8. **Meta Ads (Outbound Pull):**
   `MetaAdsService` ──(GET `/v26.0/act_{id}/insights` with token)──► `Facebook Graph API` ──► `Spend, impressions, clicks`.
   *Classification:* **NON-SENSITIVE** (ad aggregates).

9. **Mailchimp (Outbound Pull):**
   `MailchimpService` ──(GET `/campaigns`, `/reports/{id}`)──► `Mailchimp API` ──► `Sent counts, open rates, click rates`.
   *Classification:* **NON-SENSITIVE** (campaign performance metrics; no patient lists pushed).

10. **HubSpot (Inbound Pull):**
    `HubSpotService` ──(GET `/crm/v3/objects/contacts`)──► `HubSpot API` ──► `Contact names, emails, phone numbers` ──► `Local DB Lead Table`.
    *Classification:* **PII / PROSPECTIVE PATIENT LEADS** (contact inquiries).

11. **SendGrid & Twilio (Outbound Alerts):**
    `NotificationService` ──(POST SendGrid/Twilio API)──► `Staff Email / Staff Phone`.
    *Payload:* Staff notification regarding new public Google Review (Reviewer display name, star rating, comment text, CRM review link).
    *Classification:* **NON-SENSITIVE / PUBLIC FEEDBACK** (directed to internal staff recipients).

---

## 3. PHI Disclosure Analysis

| Integration | Outbound Data Sent | Inbound Data Received | PHI Leaving System? | PHI Handled / Received? | Finding & Safeguard |
|-------------|-------------------|----------------------|:-------------------:|:-----------------------:|---------------------|
| **Google Analytics 4** | Property ID, Date range | Total users, sessions, pageviews | **NO** | **NO** | Aggregated web traffic only. Zero patient identifiers sent. |
| **Google Search Console** | Site URL, Date range | Query strings, impressions, clicks | **NO** | **NO** | Search engine performance only. |
| **Google Ads** | Customer ID, Date range, GAQL query | Campaign names, clicks, ad spend | **NO** | **NO** | Advertising metrics only. |
| **Google Business Profile** | Staff review reply comment | Reviewer name, star rating, comment | **NO** | **NO** (Public data) | Clinic staff must be trained to avoid disclosing PHI when replying to public reviews. |
| **Google Pub/Sub** | N/A (Receives webhook) | Pub/Sub message alert type | **NO** | **NO** | Webhook payload contains only review resource ID; review fetched over TLS. |
| **WordPress REST** | Query parameters (page, per_page) | Posts, pages, treatment categories | **NO** | **NO** | Public CMS content only. |
| **WordPress Forms** | N/A (Inbound webhook) | Name, email, phone, message | **NO** | **YES (PII / Prospective PHI)** | Inbound contact forms capture patient inquiries. Protected by HMAC secret & database encryption. |
| **CallRail** | Account ID, pagination limit | Caller name, phone number, recording URL | **NO** | **YES (Telephony ePHI)** | Call recordings and caller phone numbers handled. Requires CallRail HIPAA plan & BAA. |
| **Meta Ads** | Ad Account ID, Date range | Impressions, clicks, ad spend | **NO** | **NO** | Advertising aggregates only. |
| **Mailchimp** | Audience ID, pagination limit | Sent counts, open rates, bounces | **NO** | **NO** | Pulls campaign statistics only. Patient records are **NEVER** exported to Mailchimp. |
| **HubSpot** | Query parameters for contacts | Contact names, emails, phone numbers | **NO** | **YES (PII / Lead Data)** | Pulls prospective patient contacts into CRM. |
| **SendGrid (Twilio)** | Staff email, review comment | Delivery status | **NO** | **NO** | Sends alerts regarding public Google reviews to staff only. |
| **Twilio SMS** | Staff phone, review comment | Message SID | **NO** | **NO** | Sends SMS alerts regarding public Google reviews to staff only. |

---

## 4. Data Minimization Analysis

| Integration | Minimization Status | Code Verification |
|-------------|:-------------------:|-------------------|
| **WordPress REST** | ✅ MINIMAL | `wordpress.service.ts` uses strict `safeParams` filter (`['page', 'per_page', 'search', 'order', 'orderby', '_embed']`) and caps `per_page` at 100. |
| **Meta Ads** | ✅ MINIMAL | `meta-ads.service.ts` requests only `id,name,status,start_time,stop_time` and aggregate insight fields (`impressions,clicks,spend,actions,action_values`). |
| **Mailchimp** | ✅ MINIMAL | `mailchimp.service.ts` queries only sent campaigns and aggregate report totals (`/reports/{id}`). Does not write or export patient records. |
| **GA4** | ✅ MINIMAL | `ga4.service.ts` queries only statistical metrics (`totalUsers`, `activeUsers`, `newUsers`, `sessions`, `screenPageViews`, `engagedSessions`). |
| **HubSpot** | ✅ MINIMAL | `hubspot.service.ts` restricts properties to `firstname,lastname,email,phone,lifecyclestage,hs_analytics_source`. Does not push CRM clinical data out. |
| **Google Ads** | ✅ MINIMAL | `google-ads.service.ts` queries only campaign IDs, names, dates, impressions, clicks, cost micros, and conversion values. |
| **CallRail** | ✅ MINIMAL | `callrail.service.ts` requests recent 100 calls and stores only necessary CRM telephony fields (`caller`, `phone`, `duration`, `campaign`, `status`, `audioUrl`, `timestamp`). |
| **Notifications** | ✅ MINIMAL | `notification.service.ts` routes alerts strictly to staff who have `emailAlerts` or `smsAlerts` enabled with matching location preferences. |

---

## 5. OAuth 2.0 & Credential Security

- **Scopes:** Scopes requested in [`src/services/google.service.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/services/google.service.ts) are strictly minimal:
  - `analytics.readonly` (read GA4 traffic)
  - `webmasters.readonly` (read Search Console queries)
  - `adwords` (manage Google Ads campaigns)
  - `business.manage` (manage Business Profile reviews)
  *(No excessive scopes such as Gmail, Google Drive, or Calendar are requested).*
- **State Token Protection:** OAuth start generates a 256-bit cryptographically secure random hex string stored in memory with a strict 10-minute expiry and single-use invalidation upon callback execution.
- **Credential Storage:** All third-party OAuth access tokens, refresh tokens, and API keys are stored in MySQL using **AES-256-GCM** authenticated encryption (`v1:{iv}:{authTag}:{ciphertext}`) via [`src/utils/crypto.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/utils/crypto.ts).
- **Frontend Isolation:** Zero third-party tokens or credentials are returned via API responses or exposed in frontend environment configurations.

---

## 6. Webhook Security & Idempotency

1. **WordPress Form Webhook (`/api/v1/webhooks/wordpress/forms`):**
   - **Authentication:** Validates `x-webhook-secret` header against `process.env.WORDPRESS_FORM_WEBHOOK_SECRET` using `crypto.timingSafeEqual` (timing-attack resistant).
   - **Rate Limiting:** Enforced at 20 requests/minute.
   - **Idempotency:** Computes deterministic SHA-256 hash over form payload (`formId|formName|email|phone|sourceUrl|message`) to prevent duplicate record insertion on webhook replays.
2. **Google Reviews Webhook (`/api/v1/webhooks/google-reviews`):**
   - **Authentication:** Validates incoming webhook secret against `process.env.GOOGLE_REVIEWS_WEBHOOK_SECRET` using `crypto.timingSafeEqual`.
   - **Rate Limiting:** Enforced at 30 requests/minute.
   - **Payload Safety:** Only processes Pub/Sub `NEW_REVIEW` alerts and fetches the individual review securely over authenticated TLS.

---

## 7. Cloud Storage, Analytics, Error Monitoring & AI Review

- **Cloud Storage:** No active AWS S3, Cloudinary, or Azure Blob SDK is present in the codebase. Document URLs in contracts and invoices are stored as validated HTTPS reference strings.
- **Client-Side Analytics:** Zero third-party trackers (Google Tag Manager `gtag`, Meta Pixel `fbq`, Mixpanel) exist in `index.html` or React components.
- **Error Monitoring:** No Sentry, Datadog, LogRocket, or Rollbar SDK is installed. Application uses local Pino structured logging with strict `[REDACTED]` masking on passwords, tokens, cookies, and authorization headers.
- **AI Services:** Zero external AI services (OpenAI, Anthropic, Azure OpenAI) are connected or invoked.

---

## 8. Business Associate Agreement (BAA) Review

| Vendor | Product / Service | Data Handled | PHI Risk | BAA Status | Authoritative Verification & Action Required |
|--------|-------------------|--------------|:--------:|:----------:|----------------------------------------------|
| **Google LLC** | Google Cloud Platform / Pub/Sub | Review alert webhook notifications | Low (Metadata) | `ACCOUNT_CONFIGURATION_REQUIRED` | Google Cloud offers a HIPAA BAA covering GCP services (Pub/Sub). Must be reviewed and accepted in GCP Console under Compliance. *(Note: Google Ads and standard Google services are NOT covered under GCP BAA).* |
| **Google LLC** | GA4, GSC, Google Ads, GBP | Web analytics, search queries, ad metrics, public reviews | None (Aggregates / Public) | `NOT_APPLICABLE` | These services handle only non-PHI aggregate marketing metrics and public reviews. |
| **WordPress Host** (midwestspine.net) | Web Server & Form Plugin | Contact form submissions (`name`, `email`, `phone`, `message`) | **Medium (Prospective PHI)** | `MANUAL REVIEW REQUIRED` | The web hosting provider hosting `midwestspine.net` and processing web forms must execute a BAA with the clinic, or forms must be posted directly over TLS without unencrypted hosting database retention. |
| **CallRail, Inc.** | Call Tracking & Recording | Inbound patient caller names, phone numbers, call audio URLs | **High (Telephony ePHI)** | `ACCOUNT_CONFIGURATION_REQUIRED` | CallRail officially provides a HIPAA-compliant plan with a Business Associate Agreement and call recording encryption/redaction. Organization must ensure the account is on CallRail's Healthcare Plan with executed BAA. |
| **Meta Platforms, Inc.** | Facebook / Instagram Ads API | Ad impressions, clicks, spend | None (Aggregates) | `NOT_APPLICABLE` (Aggregate Metrics) / `VERIFIED_NOT_AVAILABLE` (For PHI) | Meta does NOT sign BAAs. The CRM only reads aggregate ad performance metrics. Zero patient data is sent to Meta. |
| **Intuit Inc.** (Mailchimp) | Mailchimp Email Marketing API | Campaign email send counts, open rates, click rates | None (Aggregates) | `NOT_APPLICABLE` (Aggregate Metrics) / `VERIFIED_NOT_AVAILABLE` (For PHI) | Mailchimp does NOT sign BAAs under standard terms. The CRM strictly limits integration to reading campaign aggregates. **Patient records must NEVER be exported to Mailchimp.** |
| **HubSpot, Inc.** | HubSpot Smart CRM | Prospective contact names, emails, phone numbers | **Medium (Prospective PHI)** | `ACCOUNT_CONFIGURATION_REQUIRED` | HubSpot offers a HIPAA BAA addendum for customers on HubSpot Enterprise Smart CRM plans with Sensitive Data features enabled. Organization must verify Enterprise tier and execute BAA. |
| **Twilio Inc.** | Twilio SendGrid | Staff alert emails for new Google reviews | None (Staff Notifications) | `ACCOUNT_CONFIGURATION_REQUIRED` (If PHI used) / `NOT_APPLICABLE` (For Staff Review Alerts) | Twilio offers a HIPAA BAA for SendGrid and Twilio SMS. For staff-only review alerts, no patient PHI is sent; if patient communications are added in future, Twilio BAA must be active. |
| **Twilio Inc.** | Twilio Programmable SMS | Staff alert SMS for new Google reviews | None (Staff Notifications) | `ACCOUNT_CONFIGURATION_REQUIRED` (If PHI used) / `NOT_APPLICABLE` (For Staff Review Alerts) | Same as above. Staff alerts only. |

---

## 9. Potential Business Associate Classifications

Under 45 CFR § 160.103, vendors that create, receive, maintain, or transmit Protected Health Information (PHI) on behalf of a Covered Entity are classified as Business Associates:

1. **CallRail, Inc. — POTENTIAL BUSINESS ASSOCIATE:**
   - *Rationale:* CallRail receives, processes, and records inbound phone calls from patients seeking medical consultations. Inbound call audio and caller phone numbers constitute electronic Protected Health Information (ePHI) when associated with a specialized spine and brain clinic.
   - *Requirement:* Account must be configured on CallRail Healthcare plan with signed BAA.
2. **WordPress Web Hosting Provider — POTENTIAL BUSINESS ASSOCIATE:**
   - *Rationale:* If prospective patients submit medical contact forms on `midwestspine.net` and those submissions pass through or are temporarily stored on the WordPress web server, the hosting facility is transmitting/maintaining ePHI.
   - *Requirement:* BAA with web hosting provider or direct API submission architecture.
3. **HubSpot, Inc. — POTENTIAL BUSINESS ASSOCIATE (If used for patient inquiries):**
   - *Rationale:* If HubSpot is used to capture and manage prospective patient inquiries or consultation requests.
   - *Requirement:* HubSpot Enterprise subscription with executed HIPAA BAA addendum.
4. **Non-PHI Service Providers (Google Ads, Meta Ads, GA4, GSC, Mailchimp):**
   - *Rationale:* These services receive only aggregated statistical metrics (clicks, impressions, bounce rates) or public web data. They do NOT receive, transmit, or maintain PHI on behalf of the CRM.

---

## 10. Code Changes & Security Hardening in Step 11

| File | Change | Security Rationale |
|------|--------|-------------------|
| [`test_third_party_security.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/test_third_party_security.ts) | **NEW:** 37-assertion comprehensive third-party integration test suite covering Groups 1–7 | Verifies credential isolation, OAuth state tokens, minimal scopes, RBAC enforcement, timing-safe webhook authentication, data minimization, error sanitization, and tracker absence |
| [`src/services/notification.service.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/services/notification.service.ts) | Verified and audited alert routing and credential encapsulation | Ensures email and SMS alerts contain only public Google review data directed to staff recipients |
| [`src/services/integrations.service.ts`](file:///i:/spine-brain-project/Spine-Brain-backend/src/services/integrations.service.ts) | Verified AES-256-GCM encryption and credential stripping | Ensures `GET /api/v1/integrations/status` never exposes encrypted or plaintext tokens |

---

## 11. Remaining Risks & Technical Observations

1. **WordPress Inbound Webhook Transport:** Contact form submissions from WordPress contain prospective patient names, emails, phones, and messages. While the webhook endpoint enforces timing-safe secret validation and rate limiting, the security of the form submission prior to reaching the CRM depends on the WordPress web server environment and TLS configuration.
2. **CallRail Recording URLs:** Call audio URLs stored in `CallLog` point to CallRail's infrastructure. Access to these recordings must be gated by CallRail's secure/HIPAA playback permissions.
3. **Third-Party API Token Expiration:** Google OAuth tokens are automatically refreshed and saved to the database. If a refresh token is revoked in Google Cloud Console, the integration status will transition to `error` and require re-authorization.

---

## 12. Manual Action Checklist (For Organization Compliance & Operations)

- [ ] **Verify CallRail HIPAA Plan & BAA:** Confirm that the clinic's CallRail account is enrolled in the Healthcare/HIPAA plan and that a signed Business Associate Agreement is on file with CallRail, Inc.
- [ ] **Verify WordPress Web Hosting BAA:** Confirm that the hosting provider hosting `midwestspine.net` has an executed BAA on file, or configure form submissions to transmit statelessly over TLS.
- [ ] **Verify HubSpot Enterprise BAA (If Leads are managed in HubSpot):** Confirm that HubSpot is on an Enterprise plan with the Sensitive Data / HIPAA addendum executed if patient contact information is stored in HubSpot.
- [ ] **Review GCP BAA in Google Cloud Console:** Log into the Google Cloud Console for the project hosting Google OAuth & Pub/Sub and accept the standard Google Cloud HIPAA BAA under Compliance settings.
- [ ] **Review Staff Public Review Response Guidelines:** Train clinic staff never to include patient medical conditions, diagnoses, or admission of treatment in public responses to Google Reviews.
- [ ] **Enforce No Patient Export to Mailchimp:** Ensure operational policy prohibits importing patient email lists into Mailchimp, as Mailchimp does not execute HIPAA BAAs.
- [ ] **Verify Production OAuth Redirect URIs:** Verify that production OAuth redirect URIs in Google Cloud Console match the production HTTPS domain.
- [ ] **Review Third-Party Credential Rotation Schedule:** Establish annual rotation of SendGrid API keys, Twilio Auth Tokens, and CallRail API tokens.

---

*End of SECURITY_STEP_11_THIRD_PARTY_BAA.md*
