# MSBI Marketing Operations CRM — Client Requirements & Status Log

**Update Date: 10 August 2026**  
**Client:** Midwest Spine & Brain Institute (MSBI)  

---

## 🎯 Client Directives Checklist

1. **Single Primary Sidebar Navigation & Duplicate Removal**:
   - Duplicate horizontal pill buttons (`Overview | Website Analytics | Lead Analytics...`) inside page headers have been completely removed.
   - Left expandable sidebar operates as the single primary navigation system.

2. **Dedicated Submenu Views**:
   - Every single submenu route in the left sidebar opens a dedicated, distinct content view with topic-specific titles, KPIs, charts, and table ledgers.

3. **Design System & Visual Brand Alignment**:
   - Website Theme Sync (`midwestspine.net`): Canvas `#E6F0F3`, Header `#E6F0F3`, Active Pill `#CDE4E8`, Text `#1D3A46`.
   - Logos: Centered `dasborde logo.png` (`h-14`) in Sidebar without horizontal line divider, `main-logo.png` on Login screen.
   - Preserved exact Stitch UI layout, card shadows, rounded corners, fonts, and responsiveness.

4. **Frontend-Only Scope**:
   - Pure React local state & client-side routing.
   - Zero live database or third-party API connections (GA4, Google Ads, Meta Ads, CallRail, HubSpot, Mailchimp).
   - All numbers explicitly labeled as **Sample Data** / **Demo Data**.

5. **Interactive Modals & Logout**:
   - Create Campaign, Add Vendor, Invite Staff, Send Review Request, Configure Integration, Schedule Email Report modals working in frontend state.
   - Logout clears session state and redirects to `/login`.
