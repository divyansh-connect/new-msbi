# MSBI Marketing Operations CRM — Wireframe Specification Document

**Update Date: 10 August 2026**  
**Source of Truth:** Single Primary Navigation Wireframe Architecture  

---

## 📐 Navigation Architecture Specification

### 1. Single Primary Navigation System
- **Left Navigation Sidebar** (`256px` fixed width, expandable accordion submenus):
  - **Single Navigation Source**: All navigation interactions take place in the left sidebar.
  - **No Duplicate Horizontal Navigation**: Duplicate horizontal tab/pill button rows inside page content headers have been removed.
  - Brand Header: Centered `dasborde logo.png` (`h-14`), no horizontal line divider under logo.
  - Active Main Menu: Soft Ice Teal container highlight (`#CDE4E8`) with `#1D3A46` Deep Slate Navy text.
  - Submenu Items: Indented left border line (`border-l-2 border-border-subtle/80`), animated chevron indicator.
  - Footer: Logout button returning user to `/login`.
- **Top Header Bar**: Full width `#E6F0F3` matching background, user profile dropdown with RBAC role switch.

---

## 📑 10-Section Navigation Structure & Dedicated Sub-Views

1. **Dashboard** (`/dashboard` / `/`)
2. **Marketing Analytics** (`/marketing-analytics/...`)
   - Overview (`/marketing-analytics/overview`)
   - Website Analytics (`/marketing-analytics/website`)
   - Lead Analytics (`/marketing-analytics/leads`)
   - Call Tracking (`/marketing-analytics/call-tracking`)
   - Form Submissions (`/marketing-analytics/form-submissions`)
   - Campaign Performance (`/marketing-analytics/campaigns`)
   - ROI Analytics (`/marketing-analytics/roi`)
   - Source Attribution (`/marketing-analytics/source-attribution`)
3. **Campaign Management** (`/campaigns/...`)
   - All Campaigns (`/campaigns/all`)
   - Active Campaigns (`/campaigns/active`)
   - Campaign Calendar (`/campaigns/calendar`)
   - Goals & KPIs (`/campaigns/goals`)
   - Assets & Documents (`/campaigns/assets`)
   - Tasks (`/campaigns/tasks`)
4. **Budget Management** (`/budget/...`)
   - Budget Overview (`/budget/overview`)
   - Planned vs Actual (`/budget/planned-vs-actual`)
   - Vendor Spending (`/budget/vendor-spending`)
   - Monthly Budget (`/budget/monthly`)
   - Annual Budget (`/budget/annual`)
   - Cost Breakdown (`/budget/cost-breakdown`)
5. **Reputation Management** (`/reputation/...`)
   - Google Reviews (`/reputation/reviews`)
   - Provider Ratings (`/reputation/providers`)
   - Clinic Ratings (`/reputation/clinics`)
   - Review Requests (`/reputation/requests`)
   - Review Trends (`/reputation/trends`)
   - Goals (`/reputation/goals`)
6. **Vendor Management** (`/vendors/...`)
   - Vendors (`/vendors/all`)
   - Contacts (`/vendors/contacts`)
   - Contracts (`/vendors/contracts`)
   - Renewals (`/vendors/renewals`)
   - Invoices (`/vendors/invoices`)
   - Performance Score (`/vendors/performance`)
7. **Reports** (`/reports/...`)
   - Executive Dashboard (`/reports/executive`)
   - Marketing Report (`/reports/marketing`)
   - Lead Report (`/reports/leads`)
   - ROI Report (`/reports/roi`)
   - Budget Report (`/reports/budget`)
   - Reputation Report (`/reports/reputation`)
   - Vendor Report (`/reports/vendor`)
   - Custom Reports (`/reports/custom`)
   - Export Center (`/reports/export`)
8. **Integrations** (`/integrations/...`) — *Separate Main Menu*
   - Google Analytics 4 (`/integrations/ga4`)
   - Google Ads (`/integrations/google-ads`)
   - Meta Ads (`/integrations/meta-ads`)
   - Google Search Console (`/integrations/gsc`)
   - Looker Studio (`/integrations/looker`)
   - CallRail (`/integrations/callrail`)
   - HubSpot (`/integrations/hubspot`)
   - Mailchimp (`/integrations/mailchimp`)
   - Google Business Profile (`/integrations/gbp`)
   - Custom API (`/integrations/custom-api`)
9. **Users & Roles** (`/users-roles/...`)
   - Users (`/users-roles/users`)
   - Departments (`/users-roles/departments`)
   - Permissions (`/users-roles/permissions`)
   - Activity Logs (`/users-roles/activity-logs`)
10. **Settings** (`/settings/...`) — *Separate Main Menu*
    - Organization (`/settings/organization`)
    - Clinics (`/settings/clinics`)
    - Providers (`/settings/providers`)
    - KPIs (`/settings/kpis`)
    - Notification Settings (`/settings/notifications`)
    - API Keys (`/settings/api-keys`)

---

## ⚡ Technical Architecture Constraints

- **Single Sidebar Navigation**: Zero duplicate horizontal tab button rows inside pages.
- **Frontend-Only**: All views powered by mock data and React router params (`useParams`).
- **No External Dependencies**: Zero live database or third-party API connections.
- **Sample Data Labels**: All metrics displays state "Sample Data Only".
