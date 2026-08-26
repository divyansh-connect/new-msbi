import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { generatePDFReport } from '../utils/exportUtils';
import { sanitizeUrl } from '../utils/urlSecurity';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';





const subViewTitles: Record<string, { title: string; subtitle: string }> = {
  'overview': { title: 'Marketing Analytics Overview', subtitle: 'Executive summary of lead acquisition, ROI, and call conversion performance.' },
  'website': { title: 'Website Traffic & GA4 Analytics', subtitle: 'Visitor sessions, pageviews, bounce rate & top landing page performance.' },
  'leads': { title: 'Lead Qualification & Conversion Analytics', subtitle: 'Lead volume, qualification rate, and stage-by-stage funnel performance.' },
  'call-tracking': { title: 'CallRail Telephony & Inbound Call Logs', subtitle: 'Live telephony recordings, missed call tracking & call duration metrics.' },
  'form-submissions': { title: 'Inbound Patient Form Submissions', subtitle: 'Contact form fills, appointment pre-evaluations, and consultation inquiries.' },
  'campaigns': { title: 'Campaign Channel Performance Comparison', subtitle: 'Cost-per-lead and revenue return across Google Ads, Meta, and SEO.' },
  'roi': { title: 'ROI Analytics & Net Financial Return', subtitle: 'Blended ROI calculations, total ad spend, and attributed lifetime value.' },
  'source-attribution': { title: 'Multi-Touch Source Attribution Model', subtitle: 'First-touch, last-touch, and linear touchpoint distribution analytics.' },
  'email-marketing': { title: 'Email Marketing & Newsletters', subtitle: 'Mailchimp campaign performance, open rates, and click metrics.' },
};

export const MarketingAnalytics: React.FC = () => {
  const { subview } = useParams<{ subview?: string }>();
  const [selectedCallAudio, setSelectedCallAudio] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const [isSyncingCallRail, setIsSyncingCallRail] = useState(false);

  const activeSubViewKey = subview || 'overview';
  const meta = subViewTitles[activeSubViewKey] || subViewTitles['overview'];

  const { data: callLogs } = useQuery({
    queryKey: ['callLogs'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/calls');
      return res.data;
    }
  });
  const { data: formSubmissions } = useQuery({
    queryKey: ['formSubmissions'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/form-submissions');
      return res.data;
    }
  });

  const { data: overviewData } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any }>('/analytics/overview');
      return res.data;
    }
  });

  const { data: websiteData } = useQuery({
    queryKey: ['analytics-website'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any }>('/analytics/website');
      return res.data;
    }
  });

  const { data: leadsData } = useQuery({
    queryKey: ['analytics-leads'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any }>('/analytics/leads');
      return res.data;
    }
  });

  const { data: leadsList } = useQuery({
    queryKey: ['leads-list'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/leads');
      return res.data;
    }
  });

  const { data: roiData } = useQuery({
    queryKey: ['analytics-roi'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any }>('/analytics/roi');
      return res.data;
    }
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['analytics-campaigns'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/analytics/campaigns-performance');
      return res.data;
    }
  });

  const { data: attributionData } = useQuery({
    queryKey: ['analytics-attribution'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/analytics/attribution');
      return res.data;
    }
  });

  const { data: emailData } = useQuery({
    queryKey: ['analytics-email'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; connected: boolean; data: any[] }>('/analytics/email-marketing');
      return res;
    }
  });

  const { data: timeSeriesData } = useQuery({
    queryKey: ['analytics-timeseries'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any }>('/analytics/time-series');
      return res.data;
    }
  });

  const overview = overviewData || null;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Responsive Top Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 border-b border-border-subtle pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-headline-lg text-lg sm:text-xl md:text-2xl text-primary font-bold leading-tight">
              {meta.title}
            </h1>
            
          </div>
          <p className="font-body-md text-on-surface-variant text-xs mt-1">
            {meta.subtitle}
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto mt-1 sm:mt-0">
          <button
            onClick={() => generatePDFReport(meta.title, meta.subtitle)}
            className="btn-primary-vibrant font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export Analytics PDF</span>
          </button>
        </div>
      </div>

      {/* Render Dedicated View Content According to Sidebar Submenu Route */}
      {activeSubViewKey === 'website' ? (
        /* Dedicated Website Analytics View */
        <div className="space-y-5 sm:space-y-6">
          {(!websiteData || !websiteData.connected) ? (
            <div className="p-8 bg-surface-muted border border-border-subtle rounded-2xl text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">link_off</span>
              <h2 className="font-headline-sm font-bold text-primary">Google Analytics 4 Not Connected</h2>
              <p className="text-sm text-on-surface-variant mt-2">Please authorize Google Analytics 4 in the Integrations settings to view live website performance.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
                  <span className="font-label-md text-xs font-bold text-on-surface-variant uppercase">Total Sessions</span>
                  <p className="font-headline-md text-xl sm:text-2xl font-bold text-primary my-1">{websiteData?.data?.overview?.sessions?.toLocaleString() || 0}</p>
                </div>

                <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
                  <span className="font-label-md text-xs font-bold text-on-surface-variant uppercase">Pageviews</span>
                  <p className="font-headline-md text-xl sm:text-2xl font-bold text-primary my-1">{websiteData?.data?.overview?.screenPageViews?.toLocaleString() || 0}</p>
                </div>

                <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
                  <span className="font-label-md text-xs font-bold text-on-surface-variant uppercase">Active Users</span>
                  <p className="font-headline-md text-xl sm:text-2xl font-bold text-primary my-1">{websiteData?.data?.overview?.activeUsers?.toLocaleString() || 0}</p>
                </div>

                <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
                  <span className="font-label-md text-xs font-bold text-on-surface-variant uppercase">Engaged Sessions</span>
                  <p className="font-headline-md text-xl sm:text-2xl font-bold text-primary my-1">{websiteData?.data?.overview?.engagedSessions?.toLocaleString() || 0}</p>
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary">Top Performing Website Landing Pages</h2>
                
                <div className="overflow-x-auto w-full no-scrollbar">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                      <tr>
                        <th className="py-2.5 px-3 sm:px-4">Page Path</th>
                        <th className="py-2.5 px-3 sm:px-4">Sessions</th>
                        <th className="py-2.5 px-3 sm:px-4">Pageviews</th>
                        <th className="py-2.5 px-3 sm:px-4">Bounce Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {(websiteData?.data?.landingPages || []).map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-surface-muted transition-colors">
                          <td className="py-3 px-3 sm:px-4 font-bold text-primary max-w-[220px] truncate">{row.path}</td>
                          <td className="py-3 px-3 sm:px-4 font-data-mono whitespace-nowrap">{row.sessions?.toLocaleString() || 0}</td>
                          <td className="py-3 px-3 sm:px-4 font-data-mono whitespace-nowrap">{row.pageviews?.toLocaleString() || 0}</td>
                          <td className="py-3 px-3 sm:px-4 font-data-mono whitespace-nowrap">{(row.bounceRate * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                      {(!websiteData?.data?.landingPages || websiteData.data.landingPages.length === 0) && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-on-surface-variant text-xs">No landing page data found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {websiteData?.data?.searchConsole && (
                <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 mt-5">
                  <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary">Search Console Queries</h2>
                  
                  <div className="overflow-x-auto w-full no-scrollbar">
                    <table className="w-full text-left text-xs min-w-[600px]">
                      <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                        <tr>
                          <th className="py-2.5 px-3 sm:px-4">Query</th>
                          <th className="py-2.5 px-3 sm:px-4">Clicks</th>
                          <th className="py-2.5 px-3 sm:px-4">Impressions</th>
                          <th className="py-2.5 px-3 sm:px-4">CTR</th>
                          <th className="py-2.5 px-3 sm:px-4">Position</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {(websiteData.data.searchConsole || []).map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-muted transition-colors">
                            <td className="py-3 px-3 sm:px-4 font-bold text-primary">{row.query}</td>
                            <td className="py-3 px-3 sm:px-4 font-data-mono whitespace-nowrap">{row.clicks?.toLocaleString() || 0}</td>
                            <td className="py-3 px-3 sm:px-4 font-data-mono whitespace-nowrap">{row.impressions?.toLocaleString() || 0}</td>
                            <td className="py-3 px-3 sm:px-4 font-data-mono whitespace-nowrap">{(row.ctr * 100).toFixed(2)}%</td>
                            <td className="py-3 px-3 sm:px-4 font-data-mono whitespace-nowrap">{row.position?.toFixed(1) || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : activeSubViewKey === 'leads' ? (
        /* Lead Qualification View */
        <div className="space-y-5 sm:space-y-6">
          {(!leadsData || leadsData.connected === false) && (
            <div className="p-4 mb-4 bg-status-warning/10 border border-status-warning/30 text-status-warning rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">sync_disabled</span>
                <div>
                  <p className="font-bold text-sm">HubSpot Not Connected</p>
                  <p className="text-xs">Displaying limited local data. Connect HubSpot to view full lifecycle analytics.</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
              <span className="text-xs font-bold uppercase text-on-surface-variant">Qualified Patient Leads</span>
              <p className="text-xl sm:text-2xl font-bold text-primary my-1">{leadsData?.totalSubmissions || 0}</p>
              <span className="text-xs text-on-surface-variant font-bold">Total Verified Submissions</span>
            </div>
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
              <span className="text-xs font-bold uppercase text-on-surface-variant">HubSpot Sync Status</span>
              <p className="text-xl sm:text-2xl font-bold text-primary my-1">{leadsData?.connected ? 'Connected' : 'Offline'}</p>
              <span className="text-xs text-status-success font-bold">Verified Lead Sync</span>
            </div>
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
              <span className="text-xs font-bold uppercase text-on-surface-variant">Cost Per Qualified Lead</span>
              <p className="text-xl sm:text-2xl font-bold text-primary my-1">{leadsData?.calls || 0}</p>
              <span className="text-xs text-status-success font-bold">Total Call Volume</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-primary text-sm sm:text-base">Lead Funnel Stage Breakdown</h2>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-primary">Inbound Inquiries ({leadsData?.totalLeads || 0})</span>
                  <span className="font-bold text-on-surface-variant">Total CRM Leads</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-primary">Form Submissions ({leadsData?.totalSubmissions || 0})</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-primary">Calls ({leadsData?.calls || 0})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-primary text-sm sm:text-base">Qualified CRM Lead Log</h2>
            <div className="overflow-x-auto w-full no-scrollbar">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                  <tr>
                    <th className="py-2.5 px-3 sm:px-4">Lead Name</th>
                    <th className="py-2.5 px-3 sm:px-4">Contact Info</th>
                    <th className="py-2.5 px-3 sm:px-4">Source Form</th>
                    <th className="py-2.5 px-3 sm:px-4">Platform / Ext ID</th>
                    <th className="py-2.5 px-3 sm:px-4">Status</th>
                    <th className="py-2.5 px-3 sm:px-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {(leadsList || []).map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-surface-muted transition-colors">
                      <td className="py-3 px-3 sm:px-4 font-bold text-primary">{lead.name}</td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="text-on-surface">{lead.email || 'No Email'}</div>
                        <div className="text-on-surface-variant font-data-mono text-[10px]">{lead.phone || 'No Phone'}</div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-medium text-secondary">{lead.source}</td>
                      <td className="py-3 px-3 sm:px-4 font-data-mono text-[10px] text-on-surface-variant">
                        {lead.leadPlatform ? `${lead.leadPlatform} / ${lead.externalLeadId?.substring(0, 8)}...` : 'Manual'}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className="bg-status-success/20 text-status-success font-bold text-[10px] px-2.5 py-0.5 rounded uppercase">
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-on-surface-variant">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {leadsList?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-on-surface-variant text-xs">
                        No lead records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubViewKey === 'call-tracking' ? (
        /* CallRail Call Log View */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-surface-container-lowest p-4 rounded-2xl border border-border-subtle shadow-sm">
            <div>
              <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary">CallRail Telephony Log</h2>
              <p className="text-xs text-on-surface-variant">Real-time call recordings & missed call tracking </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="bg-status-success/20 text-status-success font-bold text-[11px] px-3 py-1 rounded-full">
                CallRail Demo Bridge Active
              </span>
              <button
                onClick={async () => {
                  if (isSyncingCallRail) return;
                  setIsSyncingCallRail(true);
                  try {
                    await apiClient('/integrations/callrail/sync', { method: 'POST' });
                    showSuccess('CallRail Data Synced successfully.');
                  } catch (err: any) {
                    showError('CallRail Sync failed: ' + err.message);
                  } finally {
                    setIsSyncingCallRail(false);
                  }
                }}
                disabled={isSyncingCallRail}
                className="px-3 py-1 border border-border-subtle rounded-xl text-[11px] font-bold hover:bg-surface-container cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {isSyncingCallRail ? 'Syncing...' : 'Sync CallRail Data'}
              </button>
            </div>
          </div>

          {selectedCallAudio && (
            <div className="p-4 bg-primary text-white rounded-2xl shadow-lg flex justify-between items-center animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl sm:text-2xl">play_circle</span>
                <div>
                  <p className="font-bold text-xs">Playing Audio Recording: {selectedCallAudio}</p>
                  <p className="text-[11px] opacity-90">Encrypted HIPAA Telephony Stream (Demo Audio)</p>
                </div>
              </div>
              <button onClick={() => setSelectedCallAudio(null)} className="text-white hover:opacity-80 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}

          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
            {/* Scrollable Table Wrapper */}
            <div className="overflow-x-auto w-full no-scrollbar">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Caller</th>
                    <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Phone Number</th>
                    <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Duration</th>
                    <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Time</th>
                    <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Campaign Source</th>
                    <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Audio Playback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {(callLogs || []).map((call) => (
                    <tr key={call.id} className="hover:bg-surface-muted transition-colors">
                      <td className="py-3 px-3 sm:px-4 font-bold text-primary whitespace-nowrap">{call.caller || 'Unknown'}</td>
                      <td className="py-3 px-3 sm:px-4 font-data-mono whitespace-nowrap">{call.phone}</td>
                      <td className="py-3 px-3 sm:px-4 font-data-mono whitespace-nowrap">{call.duration}</td>
                      <td className="py-3 px-3 sm:px-4 text-on-surface-variant whitespace-nowrap">{new Date(call.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-3 sm:px-4 text-secondary font-medium whitespace-nowrap">{call.campaign || 'Direct'}</td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          call.status === 'Answered'
                            ? 'bg-status-success/20 text-status-success'
                            : call.status === 'Missed'
                            ? 'bg-status-error/20 text-status-error'
                            : 'bg-status-warning/20 text-status-warning'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        {call.audioUrl ? (
                          <a
                            href={sanitizeUrl(call.audioUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-surface-container hover:bg-surface-container-high text-primary font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">play_arrow</span> Listen
                          </a>
                        ) : (
                          <span className="text-on-surface-variant text-[10px]">No audio</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {callLogs?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-on-surface-variant text-xs">
                        No call logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubViewKey === 'form-submissions' ? (
        /* Form Submissions Log */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm p-4 sm:p-5 space-y-3">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Inbound Website Form Submissions Log
          </h2>

          <div className="space-y-3">
            {(formSubmissions || []).map((sub) => (
              <div key={sub.id} className="p-3.5 border border-border-subtle rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 hover:bg-surface-muted transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-primary">{sub.name || 'Unknown Patient'}</span>
                    <span className="text-[11px] text-on-surface-variant">({sub.email || sub.phone || 'No Contact'})</span>
                  </div>
                  <p className="text-[11px] text-secondary mt-0.5">{sub.formName || 'Website Contact Form'} • {new Date(sub.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="bg-primary-container text-on-primary-container text-[11px] font-bold px-3 py-1 rounded-full self-start sm:self-auto">
                  {sub.status}
                </span>
              </div>
            ))}
            {formSubmissions?.length === 0 && (
              <div className="p-3.5 border border-border-subtle rounded-xl text-center text-on-surface-variant text-xs">
                No form submissions found.
              </div>
            )}
          </div>
        </div>
      ) : activeSubViewKey === 'campaigns' ? (
        /* Campaign Performance View */
        <div className="space-y-6">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-primary text-sm sm:text-base">Campaign Return Comparison</h2>
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignsData || []}>
                  <XAxis dataKey="name" stroke="#71787b" fontSize={11} />
                  <YAxis stroke="#71787b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px' }} />
                  <Legend />
                  <Bar dataKey="spend" fill="#045CB4" radius={[4, 4, 0, 0]} name="Spend" />
                  <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : activeSubViewKey === 'roi' ? (
        /* ROI Analytics View */
        <div className="space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-[#244B59] text-white border border-[#1D3A46] rounded-2xl p-4 sm:p-5 shadow-md">
              <span className="text-xs font-semibold text-primary-container">Blended ROI</span>
              <p className="text-2xl sm:text-3xl font-bold my-1">{roiData?.roi !== null ? `${roiData.roi.toFixed(1)}%` : 'N/A'}</p>
              <span className="text-xs text-status-success font-bold">{roiData?.roiStatus === 'revenue_unavailable' ? 'Revenue Unavailable' : 'Strict ROI'}</span>
            </div>
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
              <span className="text-xs font-bold text-on-surface-variant uppercase">Total Ad Spend</span>
              <p className="text-xl sm:text-2xl font-bold text-primary my-1">${Number(roiData?.totalAdSpend || 0).toLocaleString()}</p>
              <span className="text-xs text-on-surface-variant">Across All Channels</span>
            </div>
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
              <span className="text-xs font-bold text-on-surface-variant uppercase">Attributed Patient Revenue</span>
              <p className="text-xl sm:text-2xl font-bold text-status-success my-1">${Number(roiData?.verifiedRevenue || 0).toLocaleString()}</p>
              <span className="text-xs text-status-success font-bold">Verified CRM Revenue</span>
            </div>
          </div>
        </div>
      ) : activeSubViewKey === 'source-attribution' ? (
        /* Source Attribution Deep-Dive */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Source Attribution & Touchpoint Model
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
            {(attributionData || []).map((attr: any) => (
              <div key={attr.id} className="p-3.5 border border-border-subtle rounded-xl bg-surface-muted">
                <span className="font-bold text-primary block mb-1">{attr.source}</span>
                <p className="text-on-surface-variant">First Touch: {attr.firstTouchCount} | Last Touch: {attr.lastTouchCount}</p>
                <p className="text-status-success font-bold mt-1">Linear Return: ${Number(attr.linearReturn).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubViewKey === 'email-marketing' ? (
        /* Email Marketing View */
        <div className="space-y-5 sm:space-y-6">
          {(!emailData || !emailData.connected) ? (
            <div className="p-8 bg-surface-muted border border-border-subtle rounded-2xl text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">mail_lock</span>
              <h2 className="font-headline-sm font-bold text-primary">Mailchimp Not Connected</h2>
              <p className="text-sm text-on-surface-variant mt-2">Please authorize Mailchimp in the Integrations settings to view email campaign analytics.</p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
                Sent Campaigns Performance
              </h2>
              <div className="overflow-x-auto w-full no-scrollbar">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                    <tr>
                      <th className="py-2.5 px-3 sm:px-4">Campaign Name</th>
                      <th className="py-2.5 px-3 sm:px-4">Recipients</th>
                      <th className="py-2.5 px-3 sm:px-4">Open Rate</th>
                      <th className="py-2.5 px-3 sm:px-4">Click Rate</th>
                      <th className="py-2.5 px-3 sm:px-4">Unsubscribes</th>
                      <th className="py-2.5 px-3 sm:px-4">Bounces</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {(emailData.data || []).map((camp: any, idx: number) => (
                      <tr key={idx} className="hover:bg-surface-muted transition-colors">
                        <td className="py-3 px-3 sm:px-4 font-bold text-primary">{camp.name}</td>
                        <td className="py-3 px-3 sm:px-4 font-data-mono">{camp.sent || 0}</td>
                        <td className="py-3 px-3 sm:px-4 font-data-mono">{((camp.openRate || 0) * 100).toFixed(1)}%</td>
                        <td className="py-3 px-3 sm:px-4 font-data-mono">{((camp.clickRate || 0) * 100).toFixed(1)}%</td>
                        <td className="py-3 px-3 sm:px-4 font-data-mono text-status-warning">{camp.unsubscribes || 0}</td>
                        <td className="py-3 px-3 sm:px-4 font-data-mono text-status-error">{camp.bounces || 0}</td>
                      </tr>
                    ))}
                    {(!emailData.data || emailData.data.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-on-surface-variant text-xs">No email campaigns found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Default Overview View */
        <div className="space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
              <span className="font-body-sm text-xs font-semibold text-on-surface-variant">Total Inbound Leads</span>
              <div className="font-headline-md text-xl sm:text-2xl text-primary font-bold my-1">{overview?.leads?.data?.leadCount || 0}</div>
              <p className="text-xs text-on-surface-variant font-bold flex items-center gap-1">
                CRM Contacts
              </p>
            </div>

            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
              <span className="font-body-sm text-xs font-semibold text-on-surface-variant">Form Submissions</span>
              <div className="font-headline-md text-xl sm:text-2xl text-primary font-bold my-1">{overview?.leads?.data?.formSubmissionCount || 0}</div>
              <p className="text-xs text-on-surface-variant font-bold flex items-center gap-1">
                Verified Inquiries
              </p>
            </div>

            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
              <span className="font-body-sm text-xs font-semibold text-on-surface-variant">Total Calls</span>
              <div className="font-headline-md text-xl sm:text-2xl text-primary font-bold my-1">{overview?.calls?.data?.callCount || 0}</div>
              <p className="text-xs text-on-surface-variant font-bold flex items-center gap-1">
                CallRail Volume
              </p>
            </div>

            <div className="bg-[#244B59] text-white border border-[#1D3A46] rounded-2xl p-4 sm:p-5 shadow-sm">
              <span className="font-body-sm text-xs font-semibold text-primary-container">Ad Spend (Google + Meta)</span>
              <div className="font-headline-md text-xl sm:text-2xl font-bold my-1">${overview?.paidAdvertising?.data?.totalSpend?.toLocaleString() || 0}</div>
              <p className="text-xs text-status-success font-bold flex items-center gap-1">
                Direct Cost
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
            <h3 className="font-headline-sm text-sm sm:text-base text-primary font-bold mb-4">
              Monthly Inbound Performance Comparison
            </h3>
            <div className="h-56 sm:h-64 w-full">
              {timeSeriesData?.inbound?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData.inbound}>
                    <XAxis dataKey="date" stroke="#71787b" fontSize={11} />
                    <YAxis stroke="#71787b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="leads" name="Total CRM Leads" stroke="#244B59" strokeWidth={3} />
                    <Line type="monotone" dataKey="formSubmissions" name="Verified Inquiries" stroke="#10B981" strokeWidth={3} />
                    <Line type="monotone" dataKey="calls" name="Calls" stroke="#045CB4" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-muted rounded-xl">
                  <p className="text-on-surface-variant text-sm">No data available for the selected period.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
