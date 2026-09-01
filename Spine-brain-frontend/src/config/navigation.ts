export interface SubMenuItem {
  label: string;
  path: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  submenus?: SubMenuItem[];
}

export const navStructure: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/',
  },
  {
    id: 'analytics',
    label: 'Marketing Analytics',
    icon: 'analytics',
    path: '/marketing-analytics',
    submenus: [
      { label: 'Overview', path: '/marketing-analytics/overview' },
      { label: 'Website Analytics', path: '/marketing-analytics/website' },
      { label: 'Lead Analytics', path: '/marketing-analytics/leads' },
      { label: 'Form Submissions', path: '/marketing-analytics/form-submissions' },
      { label: 'Campaign Performance', path: '/marketing-analytics/campaigns' },
      { label: 'ROI Analytics', path: '/marketing-analytics/roi' },
      { label: 'Source Attribution', path: '/marketing-analytics/source-attribution' },
    ],
  },
  {
    id: 'campaigns',
    label: 'Campaign Management',
    icon: 'campaign',
    path: '/campaigns',
    submenus: [
      { label: 'All Campaigns', path: '/campaigns/all' },
      { label: 'Active Campaigns', path: '/campaigns/active' },
      { label: 'Campaign Calendar', path: '/campaigns/calendar' },
      { label: 'Goals & KPIs', path: '/campaigns/goals' },
      { label: 'Assets & Documents', path: '/campaigns/assets' },
      { label: 'Tasks', path: '/campaigns/tasks' },
    ],
  },
  {
    id: 'budget',
    label: 'Budget Management',
    icon: 'payments',
    path: '/budget',
    submenus: [
      { label: 'Budget Overview', path: '/budget/overview' },
      { label: 'Planned vs Actual', path: '/budget/planned-vs-actual' },
      { label: 'Vendor Spending', path: '/budget/vendor-spending' },
      { label: 'Monthly Budget', path: '/budget/monthly' },
      { label: 'Annual Budget', path: '/budget/annual' },
      { label: 'Cost Breakdown', path: '/budget/cost-breakdown' },
    ],
  },
  {
    id: 'reputation',
    label: 'Reputation Management',
    icon: 'star_rate',
    path: '/reputation',
    submenus: [
      { label: 'Google Reviews', path: '/reputation/reviews' },
      { label: 'Provider Ratings', path: '/reputation/providers' },
      { label: 'Clinic Ratings', path: '/reputation/clinics' },
      { label: 'Review Requests', path: '/reputation/requests' },
      { label: 'Review Trends', path: '/reputation/trends' },
      { label: 'Goals', path: '/reputation/goals' },
    ],
  },
  {
    id: 'vendors',
    label: 'Vendor Management',
    icon: 'handshake',
    path: '/vendors',
    submenus: [
      { label: 'Vendors', path: '/vendors/all' },
      { label: 'Contacts', path: '/vendors/contacts' },
      { label: 'Contracts', path: '/vendors/contracts' },
      { label: 'Renewals', path: '/vendors/renewals' },
      { label: 'Invoices', path: '/vendors/invoices' },
      { label: 'Performance Score', path: '/vendors/performance' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'description',
    path: '/reports',
    submenus: [
      { label: 'Executive Dashboard', path: '/reports/executive' },
      { label: 'Marketing Report', path: '/reports/marketing' },
      { label: 'Lead Report', path: '/reports/leads' },
      { label: 'ROI Report', path: '/reports/roi' },
      { label: 'Budget Report', path: '/reports/budget' },
      { label: 'Reputation Report', path: '/reports/reputation' },
      { label: 'Vendor Report', path: '/reports/vendor' },
      { label: 'Custom Reports', path: '/reports/custom' },
      { label: 'Export Center', path: '/reports/export' },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: 'extension',
    path: '/integrations',
    submenus: [
      { label: 'Google Analytics 4', path: '/integrations/ga4' },
      { label: 'Google Ads', path: '/integrations/google-ads' },
      { label: 'Meta Ads', path: '/integrations/meta-ads' },
      { label: 'Google Search Console', path: '/integrations/gsc' },
      { label: 'Looker Studio', path: '/integrations/looker' },
      { label: 'HubSpot', path: '/integrations/hubspot' },
      { label: 'Mailchimp', path: '/integrations/mailchimp' },
      { label: 'Google Business Profile', path: '/integrations/gbp' },
      { label: 'Custom API', path: '/integrations/custom-api' },
    ],
  },
  {
    id: 'users-roles',
    label: 'Users & Roles',
    icon: 'group_add',
    path: '/users-roles',
    submenus: [
      { label: 'Users', path: '/users-roles/users' },
      { label: 'Departments', path: '/users-roles/departments' },
      { label: 'Permissions', path: '/users-roles/permissions' },
      { label: 'Activity Logs', path: '/users-roles/activity-logs' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    path: '/settings',
    submenus: [
      { label: 'Organization', path: '/settings/organization' },
      { label: 'Clinics', path: '/settings/clinics' },
      { label: 'Providers', path: '/settings/providers' },
      { label: 'KPIs', path: '/settings/kpis' },
      { label: 'Notification Settings', path: '/settings/notifications' },
      { label: 'Two-Factor Auth (MFA)', path: '/settings/security' },
      { label: 'API Keys', path: '/settings/api-keys' },
    ],
  },
];
