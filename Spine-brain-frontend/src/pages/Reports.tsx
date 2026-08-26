import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { generatePDFReport, generateExcelExport } from '../utils/exportUtils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

const subViewTitles: Record<string, { title: string; subtitle: string }> = {
  'executive': { title: 'Executive Board Overview Report', subtitle: 'High-level summary of lead acquisition, ROI, patient consult volume, and clinic revenue.' },
  'marketing': { title: 'Marketing Channel Performance Report', subtitle: 'Detailed cost per lead, click-through rates, and channel ROI audit.' },
  'leads': { title: 'Patient Lead Acquisition & Funnel Report', subtitle: 'Inbound leads, clinical triage qualification rates, and consult bookings.' },
  'roi': { title: 'Financial ROI & Return Metrics Report', subtitle: 'Blended return on investment, net ad spend, and patient LTV estimates.' },
  'budget': { title: 'Fiscal Budget Variance & Spending Report', subtitle: 'Quarterly budget utilization, department spending, and category variance.' },
  'reputation': { title: 'Reputation & Patient Feedback Report', subtitle: 'Google Business Profile review counts, average star ratings, and response SLAs.' },
  'vendor': { title: 'Vendor SLA & Agency Compliance Report', subtitle: 'Partner agency performance scores, contract renewals, and retainer compliance.' },
  'custom': { title: 'Custom Report Builder', subtitle: 'Select custom dimensions, metrics, date ranges, and export file formats.' },
  'export': { title: 'Export Center & Download History', subtitle: 'Centralized repository of generated PDF decks, Excel workbooks, and CSV logs.' },
};

export const Reports: React.FC = () => {
  const { subview } = useParams<{ subview?: string }>();

  const [dateRange, setDateRange] = useState<string>('Last 30 Days');
  const [location, setLocation] = useState<string>('All Locations');
  const [exportNotice, setExportNotice] = useState<string>('');
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  // Custom Report Builder States
  const [customMetric, setCustomMetric] = useState<string>('Inbound Patient Leads');
  const [customDimension, setCustomDimension] = useState<string>('Marketing Channel (Google/Meta/SEO)');
  const [customFormat, setCustomFormat] = useState<string>('PDF Deck (.pdf)');

  const activeSubViewKey = subview || 'executive';
  const meta = subViewTitles[activeSubViewKey] || subViewTitles['executive'];

  // Global Report Metrics Summary
  const { data: metrics } = useQuery({
    queryKey: ['reportMetrics', dateRange],
    queryFn: async () => {
      let timeframe = 'month';
      if (dateRange === 'Last 30 Days') timeframe = 'month';
      else if (dateRange === 'This Quarter (Q3)') timeframe = 'month';
      else if (dateRange === 'Year to Date (2026)') timeframe = 'year';

      const res = await apiClient<{ success: boolean; data: any }>(`/dashboard/summary?timeframe=${timeframe}`);
      return res.data;
    }
  });

  // Fetch actual Leads for Lead Report
  const { data: reportLeads = [] } = useQuery({
    queryKey: ['reportLeads'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/leads');
      return res.data;
    }
  });

  // Fetch actual Reviews for Reputation Report
  const { data: reportReviews = [] } = useQuery({
    queryKey: ['reportReviews'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/reputation/reviews');
      return res.data;
    }
  });

  // Fetch actual Campaigns for Marketing Report
  const { data: reportCampaigns = [] } = useQuery({
    queryKey: ['reportCampaigns'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/campaigns');
      return res.data;
    }
  });

  // Fetch actual Budget details for Budget Report
  const { data: reportBudgetOverview = [] } = useQuery({
    queryKey: ['reportBudgetOverview'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/budget/overview');
      return res.data;
    }
  });

  const { data: reportBudgetVariance = [] } = useQuery({
    queryKey: ['reportBudgetVariance'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/budget/planned-vs-actual');
      return res.data;
    }
  });

  // Fetch actual Vendors details for Vendor Report
  const { data: reportVendors = [] } = useQuery({
    queryKey: ['reportVendors'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/vendors');
      return res.data;
    }
  });

  // Fetch export list (must return empty history array if no logs exist)
  const { data: exportHistoryList = [] } = useQuery({
    queryKey: ['exportHistoryList'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/reports/exports');
      return res.data;
    }
  });

  const generateReportRows = () => {
    if (activeSubViewKey === 'leads') {
      return reportLeads.map((l: any) => [
        l.name,
        l.source || 'Website Contact Form',
        l.email || l.phone || 'N/A',
        l.status || 'New'
      ]);
    } else if (activeSubViewKey === 'reputation') {
      return reportReviews.map((r: any) => [
        r.authorName || 'Patient',
        `${r.rating} Star`,
        r.platform,
        r.comment || 'No comment provided'
      ]);
    } else if (activeSubViewKey === 'marketing') {
      return reportCampaigns.map((c: any) => [
        c.name,
        c.platform,
        `$${Number(c.budget).toLocaleString()}`,
        c.status
      ]);
    } else if (activeSubViewKey === 'budget') {
      const categoryMap: Record<string, number> = {};
      reportBudgetOverview.forEach(b => {
        if (b.expenses) {
          b.expenses.forEach((e: any) => {
            categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
          });
        }
      });
      return Object.entries(categoryMap).map(([cat, val]) => [
        cat,
        'Active Category',
        `$${val.toLocaleString()}`,
        'Attributed spend'
      ]);
    } else if (activeSubViewKey === 'vendor') {
      return reportVendors.map((v: any) => [
        v.name,
        v.category,
        `${v.performanceScore || 0}/10 SLA`,
        v.contracts ? `${v.contracts.length} Contract(s)` : 'No active contracts'
      ]);
    }

    // Fallback general overview summary
    return [
      ['Inbound Patient Leads', '1,000 Leads', `${metrics?.totalLeads || 0} Leads`, 'Actual CRM Contacts'],
      ['Website Traffic (Sessions)', '20,000 Sessions', `${metrics?.websiteTraffic || 0} Sessions`, 'GA4 Connected'],
      ['Total Paid Ad Spend', '$10,000', `$${(metrics?.totalSpend || 0).toLocaleString()}`, 'Google/Meta Tracker'],
      ['Blended Net ROI', '250.0%', 'Pending Revenue', 'Calculation'],
    ];
  };

  const getReportHeaders = () => {
    if (activeSubViewKey === 'leads') return ['Patient Name', 'Source Form', 'Contact Info', 'Triage Status'];
    if (activeSubViewKey === 'reputation') return ['Patient / Author', 'Rating Score', 'Platform', 'Patient Feedback'];
    if (activeSubViewKey === 'marketing') return ['Campaign Name', 'Ad Platform', 'Allocated Budget', 'Active Status'];
    if (activeSubViewKey === 'budget') return ['Cost Category', 'Period Scope', 'Current Actual Spend', 'Attribution'];
    if (activeSubViewKey === 'vendor') return ['Vendor Partner Name', 'Category', 'SLA Scorecard', 'Executed Contracts'];
    return ['Metric Name', 'Target Goal', 'Current Performance', 'Variance Status'];
  };

  const handleExportPDF = () => {
    generatePDFReport(
      meta.title,
      meta.subtitle,
      {
        headers: getReportHeaders(),
        rows: generateReportRows()
      }
    );
    setExportNotice(`Generated ${meta.title} as PDF file download.`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const handleExportExcel = () => {
    generateExcelExport(
      meta.title,
      getReportHeaders(),
      generateReportRows()
    );
    setExportNotice(`Generated ${meta.title} as Excel CSV spreadsheet file download.`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const handleGenerateCustomReport = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    const reportType = customMetric;

    if (reportType === 'Inbound Patient Leads') {
      headers = ['Lead Name', 'Source', 'Email', 'Created Date'];
      rows = reportLeads.map((l: any) => [
        l.name, 
        l.source, 
        l.email || 'N/A', 
        new Date(l.createdAt).toLocaleDateString()
      ]);
    } else if (reportType === 'Reputation & Experience') {
      headers = ['Reviewer', 'Stars', 'Source Platform', 'Date'];
      rows = reportReviews.map((r: any) => [
        r.authorName || 'Patient', 
        `${r.rating} Star`, 
        r.platform, 
        new Date(r.createdAt).toLocaleDateString()
      ]);
    } else if (reportType === 'Marketing Spend & CPL') {
      headers = ['Campaign Name', 'Ad Platform', 'Budget Allocations', 'Actual Spend'];
      rows = reportCampaigns.map((c: any) => [
        c.name, 
        c.platform, 
        `$${Number(c.budget).toLocaleString()}`, 
        `$${Number(c.spend || 0).toLocaleString()}`
      ]);
    } else if (reportType === 'Budget Allocations') {
      headers = ['Budget Year', 'Month Period', 'Planned Amount', 'Actual Spent'];
      rows = reportBudgetOverview.map((b: any) => [
        b.year, 
        b.month ? `Month ${b.month}` : 'Annual', 
        `$${Number(b.totalPlanned).toLocaleString()}`, 
        `$${Number(b.totalActual).toLocaleString()}`
      ]);
    } else {
      headers = ['Vendor', 'Category', 'SLA Performance', 'Annual Spend'];
      rows = reportVendors.map((v: any) => {
        const totalExpenses = (v.expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
        return [v.name, v.category, `${v.performanceScore || 0}/10`, `$${totalExpenses.toLocaleString()}`];
      });
    }

    if (customFormat === 'PDF Deck (.pdf)') {
      generatePDFReport(`Custom ${reportType} Report`, 'Generated from MSBI Custom Report Builder', { headers, rows });
    } else {
      generateExcelExport(`Custom ${reportType} Report`, headers, rows);
    }
    setExportNotice(`Generated Custom ${reportType} Report download successfully.`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 border-b border-border-subtle pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-headline-lg text-lg sm:text-xl md:text-2xl text-primary font-bold leading-tight">
              {meta.title}
            </h1>
          </div>
          <p className="font-body-md text-on-surface-variant text-xs mt-1">
            {meta.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleExportPDF}
            className="btn-primary-vibrant font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base sm:text-lg">picture_as_pdf</span>
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-status-success text-white font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs flex items-center gap-1.5 hover:opacity-90 transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base sm:text-lg">table_chart</span>
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-surface-container-lowest border border-border-subtle text-primary font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-surface-container transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base sm:text-lg">schedule_send</span>
            <span>Schedule Email</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3.5 bg-status-success/20 border border-status-success text-status-success rounded-2xl font-body-sm text-xs font-bold animate-in fade-in duration-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-base sm:text-lg">check_circle</span>
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Conditional Rendering of Subviews */}
      {activeSubViewKey === 'executive' ? (
        /* 1. EXECUTIVE DASHBOARD SUBVIEW */
        <div className="space-y-6">
          {/* Top filter section */}
          <div className="grid grid-cols-2 gap-4 bg-surface-container-lowest border border-border-subtle p-4 rounded-2xl shadow-sm text-xs">
            <div>
              <label className="block font-bold uppercase text-on-surface-variant mb-1">Time Period</label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="w-full bg-surface-muted border border-border-subtle rounded-xl px-3 py-2 text-on-surface font-medium cursor-pointer">
                <option>Last 30 Days</option>
                <option>This Quarter (Q3)</option>
                <option>Year to Date (2026)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold uppercase text-on-surface-variant mb-1">Clinic Scope</label>
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-surface-muted border border-border-subtle rounded-xl px-3 py-2 text-on-surface font-medium cursor-pointer">
                <option>All Locations</option>
                <option>Main Campus (Roseville)</option>
                <option>Edina Spine Center</option>
                <option>St. Paul Clinic</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Website Traffic</span>
              <p className="text-2xl font-bold text-primary mt-1">{metrics?.websiteTraffic?.toLocaleString() || 0}</p>
              <span className="text-[10px] text-status-success font-bold mt-1 block">GA4 Connected</span>
            </div>
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">CRM Inbound Leads</span>
              <p className="text-2xl font-bold text-primary mt-1">{metrics?.totalLeads || 0}</p>
              <span className="text-[10px] text-on-surface-variant font-medium mt-1 block">Active Contact & Form Fills</span>
            </div>
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">GBP Average Rating</span>
              <p className="text-2xl font-bold text-primary mt-1">{metrics?.overallRating?.toFixed(1) || '0.0'} ★</p>
              <span className="text-[10px] text-on-surface-variant font-medium mt-1 block">From {metrics?.totalReviews || 0} reviews</span>
            </div>
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Total Paid Ad Spend</span>
              <p className="text-2xl font-bold text-primary mt-1">${(metrics?.totalSpend || 0).toLocaleString()}</p>
              <span className="text-[10px] text-on-surface-variant font-medium mt-1 block">Google & Meta sync activity</span>
            </div>
          </div>
        </div>
      ) : activeSubViewKey === 'marketing' ? (
        /* 2. MARKETING REPORT SUBVIEW */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle flex justify-between items-center">
            <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary">Marketing Channel Performance Ledger</h2>
          </div>
          <div className="overflow-x-auto w-full no-scrollbar">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                <tr>
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Spent</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-medium">
                {reportCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-on-surface-variant font-medium">No active marketing campaigns found.</td>
                  </tr>
                ) : (
                  reportCampaigns.map((c: any) => (
                    <tr key={c.id} className="hover:bg-surface-muted transition-colors">
                      <td className="py-3 px-4 font-bold text-primary">{c.name}</td>
                      <td className="py-3 px-4">{c.platform}</td>
                      <td className="py-3 px-4">{new Date(c.startDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">${Number(c.budget).toLocaleString()}</td>
                      <td className="py-3 px-4">${Number(c.spend || 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'Active' ? 'bg-status-success/20 text-status-success' : 'bg-surface-container text-on-surface-variant'}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeSubViewKey === 'leads' ? (
        /* 3. LEAD REPORT SUBVIEW */
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant">Inbound Lead Submissions</span>
              <p className="text-xl sm:text-2xl font-bold text-primary mt-1">{reportLeads.length} Leads</p>
            </div>
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">Form / Webhook Submissions</span>
                <p className="text-xl sm:text-2xl font-bold text-primary mt-1">
                  {reportLeads.filter((l: any) => l.source && l.source.includes('Form')).length} CF7 Forms
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle">
              <h3 className="font-bold text-xs sm:text-sm text-primary">Inbound Patient Contacts Ledger</h3>
            </div>
            <div className="overflow-x-auto w-full no-scrollbar">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Source / Form Name</th>
                    <th className="py-3 px-4">Condition</th>
                    <th className="py-3 px-4">Contact Detail</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4">Triage Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-medium">
                  {reportLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-on-surface-variant font-medium">No patient leads available.</td>
                    </tr>
                  ) : (
                    reportLeads.map((l: any) => (
                      <tr key={l.id} className="hover:bg-surface-muted transition-colors">
                        <td className="py-3 px-4 font-bold text-primary">{l.name}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{l.source}</td>
                        <td className="py-3 px-4 font-semibold">{l.condition || 'General Orthopedic'}</td>
                        <td className="py-3 px-4">{l.email || l.phone || 'N/A'}</td>
                        <td className="py-3 px-4">{new Date(l.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-status-warning/20 text-status-warning font-bold">
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubViewKey === 'roi' ? (
        /* 4. ROI REPORT SUBVIEW */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-status-warning">
            <span className="material-symbols-outlined text-2xl">info</span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-primary">ROI Calculation Requires Revenue / Conversion Data</h3>
              <p className="text-xs text-on-surface-variant">Blended return metrics will populate dynamically once hospital consult valuations are synced.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border-subtle text-xs">
            <div>
              <span className="font-bold text-on-surface-variant uppercase">Blended Paid Ad Spend</span>
              <p className="text-xl font-bold text-primary mt-1">${(metrics?.totalSpend || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="font-bold text-on-surface-variant uppercase">Ad Attributed CPL</span>
              <p className="text-xl font-bold text-primary mt-1">
                {metrics?.totalLeads ? `$${(metrics.totalSpend / metrics.totalLeads).toFixed(2)}` : 'Data unavailable'}
              </p>
            </div>
          </div>
        </div>
      ) : activeSubViewKey === 'budget' ? (
        /* 5. BUDGET REPORT SUBVIEW */
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Master Planned Budget</span>
              <p className="text-xl font-bold text-primary mt-1">
                ${reportBudgetOverview.reduce((sum: number, b: any) => sum + Number(b.totalPlanned), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Actual Funds Spent</span>
              <p className="text-xl font-bold text-primary mt-1">
                ${reportBudgetOverview.reduce((sum: number, b: any) => sum + Number(b.totalActual), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Remaining Budget</span>
              <p className="text-xl font-bold text-status-success mt-1">
                ${(reportBudgetOverview.reduce((sum: number, b: any) => sum + Number(b.totalPlanned), 0) - reportBudgetOverview.reduce((sum: number, b: any) => sum + Number(b.totalActual), 0)).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle">
              <h3 className="font-bold text-xs sm:text-sm text-primary">Budget Period Variance Ledger</h3>
            </div>
            <div className="overflow-x-auto w-full no-scrollbar">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-4">Budget Cycle</th>
                    <th className="py-3 px-4">Planned Allocation</th>
                    <th className="py-3 px-4">Actual Cost</th>
                    <th className="py-3 px-4">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-medium">
                  {reportBudgetOverview.map((b: any) => {
                    const variance = Number(b.totalPlanned) - Number(b.totalActual);
                    const isOver = variance < 0;
                    return (
                      <tr key={b.id} className="hover:bg-surface-muted transition-colors">
                        <td className="py-3 px-4 font-bold text-primary">{b.year} - {b.month ? `Month ${b.month}` : 'Annual Master Plan'}</td>
                        <td className="py-3 px-4">${Number(b.totalPlanned).toLocaleString()}</td>
                        <td className="py-3 px-4">${Number(b.totalActual).toLocaleString()}</td>
                        <td className={`py-3 px-4 font-bold ${isOver ? 'text-status-error' : 'text-status-success'}`}>
                          {isOver ? '-' : '+'}${Math.abs(variance).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubViewKey === 'reputation' ? (
        /* 6. REPUTATION REPORT SUBVIEW */
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant">Experiences Logged</span>
              <p className="text-xl sm:text-2xl font-bold text-primary mt-1">{reportReviews.length} Submissions</p>
            </div>
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant">Average Star Score</span>
              <p className="text-xl sm:text-2xl font-bold text-primary mt-1">
                {(reportReviews.reduce((sum, r) => sum + r.rating, 0) / reportReviews.length || 0).toFixed(1)} ★
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle">
              <h3 className="font-bold text-xs sm:text-sm text-primary">Patient Feedback Submissions</h3>
            </div>
            <div className="overflow-x-auto w-full no-scrollbar">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-4">Patient / Author</th>
                    <th className="py-3 px-4">Star Rating</th>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Feedback Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-medium text-xs">
                  {reportReviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-on-surface-variant font-medium">No reviews logged.</td>
                    </tr>
                  ) : (
                    reportReviews.map((r: any) => (
                      <tr key={r.id} className="hover:bg-surface-muted transition-colors">
                        <td className="py-3 px-4 font-bold text-primary">{r.authorName || 'WordPress Guest'}</td>
                        <td className="py-3 px-4 font-bold text-status-warning">{r.rating} ★</td>
                        <td className="py-3 px-4">{r.platform}</td>
                        <td className="py-3 px-4">{new Date(r.date || r.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-on-surface-variant truncate max-w-xs">{r.comment || 'No text comment'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubViewKey === 'vendor' ? (
        /* 7. VENDOR REPORT SUBVIEW */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle">
            <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary">Partner Compliance & Invoices</h2>
          </div>
          <div className="overflow-x-auto w-full no-scrollbar">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                <tr>
                  <th className="py-3 px-4">Vendor Partner</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">SLA Score</th>
                  <th className="py-3 px-4">Contracts</th>
                  <th className="py-3 px-4">Annual Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-medium text-xs">
                {reportVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-on-surface-variant font-medium">No partner vendors found.</td>
                  </tr>
                ) : (
                  reportVendors.map((v: any) => {
                    const totalExpenses = (v.expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
                    return (
                      <tr key={v.id} className="hover:bg-surface-muted transition-colors">
                        <td className="py-3 px-4 font-bold text-primary">{v.name}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{v.category}</td>
                        <td className="py-3 px-4">
                          <span className="bg-status-success/20 text-status-success font-bold px-2 py-0.5 rounded text-[10px]">
                            {v.performanceScore || 0}/10 SLA
                          </span>
                        </td>
                        <td className="py-3 px-4">{v.contracts ? `${v.contracts.length} active` : 'None'}</td>
                        <td className="py-3 px-4 font-bold font-mono">${totalExpenses.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeSubViewKey === 'custom' ? (
        /* 8. CUSTOM REPORT BUILDER SUBVIEW */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary">Custom Report Builder</h2>
            <p className="text-xs text-on-surface-variant">Select custom dimensions, metrics & export formats</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Select Primary Metric</label>
              <select value={customMetric} onChange={(e) => setCustomMetric(e.target.value)} className="w-full bg-surface-muted border border-border-subtle rounded-xl p-2.5 font-medium text-on-surface cursor-pointer">
                <option>Inbound Patient Leads</option>
                <option>Reputation & Experience</option>
                <option>Marketing Spend & CPL</option>
                <option>Budget Allocations</option>
                <option>Vendors Directory</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Group By Dimension</label>
              <select value={customDimension} onChange={(e) => setCustomDimension(e.target.value)} className="w-full bg-surface-muted border border-border-subtle rounded-xl p-2.5 font-medium text-on-surface cursor-pointer">
                <option>Marketing Channel (Google/Meta/SEO)</option>
                <option>Clinic Location (Roseville/Edina/St.Paul)</option>
                <option>Specialty Program (Spine/Brain)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Export Format</label>
              <select value={customFormat} onChange={(e) => setCustomFormat(e.target.value)} className="w-full bg-surface-muted border border-border-subtle rounded-xl p-2.5 font-medium text-on-surface cursor-pointer">
                <option>PDF Deck (.pdf)</option>
                <option>Excel Workbook (.xlsx)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGenerateCustomReport}
              className="btn-primary-vibrant px-4 py-2 sm:px-5 sm:py-2.5 font-bold rounded-xl text-xs shadow-sm cursor-pointer"
            >
              Generate Custom Report
            </button>
          </div>
        </div>
      ) : activeSubViewKey === 'export' ? (
        /* 9. EXPORT CENTER SUBVIEW */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            MSBI Export Center & Download History
          </h2>
          <div className="space-y-3 text-xs">
            {exportHistoryList.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant font-medium italic">
                No export history available.
              </div>
            ) : (
              exportHistoryList.map((item: any) => (
                <div key={item.id} className="p-3.5 border border-border-subtle rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-surface-muted">
                  <div>
                    <p className="font-bold text-primary text-xs sm:text-sm">{item.name}</p>
                    <p className="text-[11px] text-on-surface-variant">{item.status} • {new Date(item.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* Schedule Email Modal */}
      {showScheduleModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary">Schedule Email Report</h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowScheduleModal(false);
                setExportNotice('Scheduled automated email report successfully!');
                setTimeout(() => setExportNotice(''), 4000);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Recipient Email</label>
                <input
                  type="email"
                  required
                  defaultValue="board@msbi.com"
                  className="w-full border border-border-subtle rounded-xl p-2.5 text-xs bg-surface-muted font-medium text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Frequency</label>
                <select className="w-full border border-border-subtle rounded-xl p-2.5 text-xs bg-surface-muted font-medium text-on-surface cursor-pointer">
                  <option>Weekly (Every Monday 8:00 AM)</option>
                  <option>Monthly (First Day of Month)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
};
