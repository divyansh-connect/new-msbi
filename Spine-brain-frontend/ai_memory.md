# AI MEMORY LOG — MSBI MARKETING CRM

**Update Date: 10 August 2026**  
**Project:** Midwest Spine & Brain Institute (MSBI) Marketing Operations CRM  
**Root Path:** `c:\Users\kiaan\OneDrive\Desktop\bhagyashree_kiaan\stitch_msbi_marketing_operations_crm`

---

## 📌 Architectural State & Navigation Refactor History

1. **Single Primary Navigation Refactor & Duplicate Navigation Removal (10 Aug 2026)**:
   - Removed all duplicate horizontal pill navigation rows (`Overview | Website Analytics | Lead Analytics...`) from page content headers.
   - Established the left expandable sidebar as the single primary navigation system.
   - Configured all page components (`MarketingAnalytics.tsx`, `CampaignManagement.tsx`, `BudgetManagement.tsx`, `ReputationManagement.tsx`, `VendorManagement.tsx`, `Reports.tsx`, `Integrations.tsx`, `UsersAndRoles.tsx`, `Settings.tsx`) to render dedicated, purpose-built sub-views based on `:subview` route param.

2. **Complete Submenu Architecture**:
   - 10 main menu sections and 58 submenus:
     1. **Dashboard** (`/dashboard`)
     2. **Marketing Analytics** (`/marketing-analytics/overview`, `/website`, `/leads`, `/call-tracking`, `/form-submissions`, `/campaigns`, `/roi`, `/source-attribution`)
     3. **Campaign Management** (`/campaigns/all`, `/active`, `/calendar`, `/goals`, `/assets`, `/tasks`)
     4. **Budget Management** (`/budget/overview`, `/planned-vs-actual`, `/vendor-spending`, `/monthly`, `/annual`, `/cost-breakdown`)
     5. **Reputation Management** (`/reputation/reviews`, `/providers`, `/clinics`, `/requests`, `/trends`, `/goals`)
     6. **Vendor Management** (`/vendors/all`, `/contacts`, `/contracts`, `/renewals`, `/invoices`, `/performance`)
     7. **Reports** (`/reports/executive`, `/marketing`, `/leads`, `/roi`, `/budget`, `/reputation`, `/vendor`, `/custom`, `/export`)
     8. **Integrations** (*Separate Main Menu*: `/integrations/ga4`, `/google-ads`, `/meta-ads`, `/gsc`, `/looker`, `/callrail`, `/hubspot`, `/mailchimp`, `/gbp`, `/custom-api`)
     9. **Users & Roles** (`/users-roles/users`, `/departments`, `/permissions`, `/activity-logs`)
     10. **Settings** (*Separate Main Menu*: `/settings/organization`, `/clinics`, `/providers`, `/kpis`, `/notifications`, `/api-keys`)

3. **Frontend-Only Execution Scope**:
   - Zero backend, database, or third-party API dependencies (GA4, Google Ads, Meta, CallRail, HubSpot, Mailchimp).
   - Local React state handles interactive modals.
   - All metric labels state "Sample Data Only".

4. **Official Brand System & Logo Alignment (`midwestspine.net`)**:
   - Palette: `surface-muted` `#E6F0F3`, Header `#E6F0F3`, Active Pill `#CDE4E8`, Primary Navy `#1D3A46`, Electric Blue `#045CB4`.
   - Sidebar Logo: Centered `dasborde logo.png` (`h-14` max-width 200px) with no horizontal line divider.
   - Login Logo: `main-logo.png` (Line-Art Spine/Brain Logo).

5. **Dev Server Fixed Port**:
   - Running clean single dev server on port `3000`.

---

## 🎯 Key Memory Tokens & Constants

- **Update Date**: 10 August 2026
- **Navigation Model**: Single Primary Sidebar Navigation (Zero duplicate horizontal tabs)
- **Architecture**: 100% Frontend-Only with Mock State & React Router `:subview` routing
- **Separate Main Menus**: Integrations & Settings are distinct top-level sidebar items
- **Dashboard Logo Sizing**: `h-14` max-width 200px (Centered in Sidebar)
- **Official Brand Colors**: `#E6F0F3`, `#CDE4E8`, `#1D3A46`, `#045CB4`
- **Dev Server**: `http://localhost:3000`
