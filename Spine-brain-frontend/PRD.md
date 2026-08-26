# MSBI Marketing Operations CRM — Product Requirements Document (PRD)

**Update Date: 10 August 2026**  
**Status:** Single Primary Navigation Refactor — Complete  
**Client:** Midwest Spine & Brain Institute (MSBI)  

---

## 1. Navigation & Sub-Menu UX Refactor

> [!IMPORTANT]
> **REMOVAL OF DUPLICATE HORIZONTAL NAVIGATION**:
> All duplicate horizontal pill buttons (`Overview | Website Analytics | Lead Analytics...`) have been removed from page headers.
> The left expandable sidebar is now established as the **single primary navigation system** for the application.

- **No Duplicate Controls**: Clicking a submenu item in the left sidebar opens its dedicated page view directly. No redundant navigation controls are rendered inside page bodies.
- **Persistent View State**: Refreshing the browser on any submenu route (e.g., `/marketing-analytics/leads`, `/budget/planned-vs-actual`) preserves the exact view state and keeps the parent main menu expanded in the sidebar.

---

## 2. Complete Navigation & Submenu Architecture

The single Admin CRM application features a collapsible/expandable sidebar with 10 main menu sections and 58 submenus:

### 1. 🏠 Dashboard (`/dashboard` or `/`)
- Executive overview displaying Realtime Inbound Leads, Qualified Consults, Call Answer Rate, Blended ROI, Weekly Acquisition Bar Visualizer, Website Traffic Area Chart, Lead Sources Donut Chart, Google Review Trend Line Graph, and Pending Tasks.

### 2. 📈 Marketing Analytics (`/marketing-analytics/...`)
- **Overview** (`/marketing-analytics/overview`): Executive summary of lead acquisition, ROI, and call conversion performance.
- **Website Analytics** (`/marketing-analytics/website`): Visitor sessions, pageviews, bounce rate & top landing page performance table.
- **Lead Analytics** (`/marketing-analytics/leads`): Lead volume, qualification rate, response time, and funnel stage breakdown.
- **Call Tracking** (`/marketing-analytics/call-tracking`): Live CallRail telephony recordings, missed call tracking, and HIPAA audio player.
- **Form Submissions** (`/marketing-analytics/form-submissions`): Contact form fills, appointment pre-evaluations, and consultation inquiries log.
- **Campaign Performance** (`/marketing-analytics/campaigns`): Cost-per-lead and revenue return comparison chart across Google Ads, Meta, and SEO.
- **ROI Analytics** (`/marketing-analytics/roi`): Blended ROI calculations, total ad spend, and attributed lifetime value.
- **Source Attribution** (`/marketing-analytics/source-attribution`): First-touch, last-touch, and linear touchpoint distribution analytics.

### 3. 📢 Campaign Management (`/campaigns/...`)
- **All Campaigns** (`/campaigns/all`): Overview of all active, draft, and paused marketing campaigns.
- **Active Campaigns** (`/campaigns/active`): Currently running marketing initiatives and real-time performance.
- **Campaign Calendar** (`/campaigns/calendar`): Quarterly timeline execution schedule and launch milestones.
- **Goals & KPIs** (`/campaigns/goals`): Target vs actual lead acquisition goals and target CPA metrics.
- **Assets & Documents** (`/campaigns/assets`): Brochures, digital graphic ad sets, and video asset store.
- **Tasks** (`/campaigns/tasks`): Task assignments, progress tracking, and execution Kanban board (To Do, In Progress, Completed).

### 4. 💰 Budget Management (`/budget/...`)
- **Budget Overview** (`/budget/overview`): Department budget utilization progress bars and annual overview.
- **Planned vs Actual** (`/budget/planned-vs-actual`): Q3 fiscal category budget planning vs actual spend ledger table.
- **Vendor Spending** (`/budget/vendor-spending`): Donut chart visualization of vendor retainers and ad channel spend.
- **Monthly Budget** (`/budget/monthly`): Monthly spend allocation vs actual utilization timeline bar chart.
- **Annual Budget** (`/budget/annual`): Quarterly approved master allocations and future fiscal commitments.
- **Cost Breakdown** (`/budget/cost-breakdown`): Unit cost breakdown cards across ad purchases, retainers, and software.

### 5. ⭐ Reputation Management (`/reputation/...`)
- **Google Reviews** (`/reputation/reviews`): Google Business Profile review feed and official clinic response portal.
- **Provider Ratings** (`/reputation/providers`): Individual doctor star ratings, review counts, and patient satisfaction.
- **Clinic Ratings** (`/reputation/clinics`): Roseville, Edina, and St. Paul practice location satisfaction rankings.
- **Review Requests** (`/reputation/requests`): Automated SMS and email review link delivery logs.
- **Review Trends** (`/reputation/trends`): Historical star rating trajectories across practice locations line chart.
- **Goals** (`/reputation/goals`): Annual review volume targets and response SLA benchmarks.

### 6. 🤝 Vendor Management (`/vendors/...`)
- **Vendors** (`/vendors/all`): External agencies, SaaS partners, and marketing contractors directory cards.
- **Contacts** (`/vendors/contacts`): Account executive contacts, phone numbers, and emergency escalation emails directory table.
- **Contracts** (`/vendors/contracts`): Active agency contracts, MSA terms, and downloadable PDF agreements.
- **Renewals** (`/vendors/renewals`): Alerts and timeline for agency renewals expiring within 30-90 days.
- **Invoices** (`/vendors/invoices`): Recent agency invoices, monthly retainers, and approval status ledger.
- **Performance Score** (`/vendors/performance`): Quality metrics, uptime SLAs, and lead delivery scorecards.

### 7. 📊 Reports (`/reports/...`)
- **Executive Dashboard** (`/reports/executive`): High-level summary of lead acquisition, ROI, patient consult volume, and clinic revenue.
- **Marketing Report** (`/reports/marketing`): Detailed cost per lead, click-through rates, and channel ROI audit.
- **Lead Report** (`/reports/leads`): Inbound leads, clinical triage qualification rates, and consult bookings.
- **ROI Report** (`/reports/roi`): Blended return on investment, net ad spend, and patient LTV estimates.
- **Budget Report** (`/reports/budget`): Quarterly budget utilization, department spending, and category variance.
- **Reputation Report** (`/reports/reputation`): Google Business Profile review counts, average star ratings, and response SLAs.
- **Vendor Report** (`/reports/vendor`): Partner agency performance scores, contract renewals, and retainer compliance.
- **Custom Reports** (`/reports/custom`): Select custom dimensions, metrics, date ranges, and export file formats.
- **Export Center** (`/reports/export`): Centralized repository of generated PDF decks, Excel workbooks, and CSV logs.

### 8. 🔗 Integrations (`/integrations/...`) — *Separate Main Menu*
- **Google Analytics 4** (`/integrations/ga4`)
- **Google Ads** (`/integrations/google-ads`)
- **Meta Ads** (`/integrations/meta-ads`)
- **Google Search Console** (`/integrations/gsc`)
- **Looker Studio** (`/integrations/looker`)
- **CallRail** (`/integrations/callrail`)
- **HubSpot** (`/integrations/hubspot`)
- **Mailchimp** (`/integrations/mailchimp`)
- **Google Business Profile** (`/integrations/gbp`)
- **Custom API** (`/integrations/custom-api`)

### 9. 👥 Users & Roles (`/users-roles/...`)
- **Users** (`/users-roles/users`): Manage staff user profiles, role assignments, and pending invitations directory table.
- **Departments** (`/users-roles/departments`): Practice department organization, department heads, and member count.
- **Permissions** (`/users-roles/permissions`): Granular role-based access control (RBAC) permissions matrix grid.
- **Activity Logs** (`/users-roles/activity-logs`): Audit log of user events, budget modifications, and security actions table.

### 10. ⚙️ Settings (`/settings/...`) — *Separate Main Menu*
- **Organization** (`/settings/organization`): Practice identity, main medical campus details, and business settings.
- **Clinics** (`/settings/clinics`): Roseville, Edina, and St. Paul practice addresses and facility specs.
- **Providers** (`/settings/providers`): Active surgeons, neurosurgeons, NPI numbers, and clinic assignments.
- **KPIs** (`/settings/kpis`): Operational alert and KPI threshold settings.
- **Notification Settings** (`/settings/notifications`): SMS lead alerts, contract expiration warnings, and weekly email digests.
- **API Keys** (`/settings/api-keys`): Master REST API keys, webhook signing secrets, and developer integration.

---

## 3. Brand Design System (`midwestspine.net` Official Tokens)

- **Canvas Background**: `#E6F0F3` (Soft Light Ice Teal)
- **Top Header Bar**: `#E6F0F3` (Matching Sidebar Header perfectly)
- **Sidebar Background**: `#E6F0F3` (No horizontal line divider under logo)
- **Active Navigation Pill**: `#CDE4E8` (Soft Light Ice Teal Pill) with `#1D3A46` Deep Slate Navy text & filled icon
- **Primary Navy Text & Headings**: `#1D3A46`
- **Electric Blue Link Accent**: `#045CB4`
- **Main Logos**:
  - `src/main-logo.png` (Login Screen)
  - `src/dasborde logo.png` (Sidebar Top Header, Centered `h-14` max-width 200px)

---

## 4. Frontend State & Interactions

- **Interactive Modals**: "Create New Campaign", "Add New Vendor", "Invite Staff Member", "Respond on Google Review", "Configure Integration", "Schedule Email Report".
- **Local React State**: Form submissions dynamically append new items to sample data arrays without page reload.
- **Logout Flow**: Frontend `useAuth().logout()` clears user session state and redirects to `/login`.
