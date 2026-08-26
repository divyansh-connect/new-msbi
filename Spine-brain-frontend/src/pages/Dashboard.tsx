import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

import { apiClient } from '../api/client';

const fetchDashboardMetrics = async (range: string) => {
  let timeframe = 'month';
  if (range === 'Last 7 Days') timeframe = 'week';
  else if (range === 'This Quarter') timeframe = 'year'; // Map quarter to year temporarily if needed, or backend can be expanded
  else if (range === 'Year to Date') timeframe = 'year';
  
  const res = await apiClient<{ success: boolean; data: any }>(`/dashboard/summary?timeframe=${timeframe}`)
    .then(r => r.data)
    .catch(() => null);

  return res;
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedRange, setSelectedRange] = useState<string>('Last 30 Days');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboardMetrics', selectedRange],
    queryFn: () => fetchDashboardMetrics(selectedRange),
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 border-b border-border-subtle pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-headline-lg text-lg sm:text-xl md:text-2xl text-primary font-bold leading-tight">
              Executive Dashboard
            </h1>
            
          </div>
          <p className="font-body-md text-on-surface-variant text-xs mt-1">
            Welcome back, <span className="font-bold text-primary">{user.name}</span>. Realtime marketing performance for Midwest Spine & Brain Institute.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="bg-surface-container-lowest border border-border-subtle rounded-xl px-3 py-2 text-xs font-semibold text-on-surface-variant focus:ring-2 focus:ring-primary outline-none shadow-xs cursor-pointer"
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Quarter</option>
            <option>Year to Date</option>
          </select>
          <button
            onClick={() => navigate('/campaigns')}
            className="btn-primary-vibrant font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm hover:border-primary transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="font-body-sm text-xs font-semibold text-on-surface-variant">Inbound Leads</span>
            <span className="material-symbols-outlined text-secondary text-2xl">groups</span>
          </div>
          <div className="font-headline-md text-headline-lg text-primary font-bold mb-1">
            {metrics?.totalLeads?.toLocaleString() || '0'}
          </div>
          <div className="flex items-center gap-1 text-status-success font-body-sm text-xs font-bold">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>Total CRM Contacts</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm hover:border-primary transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="font-body-sm text-xs font-semibold text-on-surface-variant">Website Traffic</span>
            <span className="material-symbols-outlined text-secondary text-2xl">verified</span>
          </div>
          <div className="font-headline-md text-headline-lg text-primary font-bold mb-1">
            {metrics?.websiteTraffic?.toLocaleString() || '0'}
          </div>
          <div className="flex items-center gap-1 text-status-success font-body-sm text-xs font-bold">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>GA4 Sessions</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm hover:border-primary transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="font-body-sm text-xs font-semibold text-on-surface-variant">Active Campaigns</span>
            <span className="material-symbols-outlined text-secondary text-2xl">campaign</span>
          </div>
          <div className="font-headline-md text-headline-lg text-primary font-bold mb-1">
            {metrics?.activeCampaigns || '0'}
          </div>
          <div className="flex items-center gap-1 text-status-warning font-body-sm text-xs font-bold">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>Running ad campaigns</span>
          </div>
        </div>

        <div className="bg-[#244B59] text-white border border-[#1D3A46] rounded-2xl p-5 shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="font-body-sm text-xs font-semibold text-primary-container">Total Spend</span>
            <span className="material-symbols-outlined text-primary-container text-2xl">payments</span>
          </div>
          <div className="font-headline-md text-headline-lg font-bold mb-1 text-white">
            ${metrics?.totalSpend?.toLocaleString() || '0'}
          </div>
          <div className="flex items-center gap-1 text-status-success text-xs font-bold">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>Tracked Cost</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Recharts SVG Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recharts Bar Chart: Weekly Lead Acquisition */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <div>
                <h2 className="font-headline-sm text-base text-primary font-bold">
                  Inbound Pipeline (Leads vs Forms vs Calls)
                </h2>
                <p className="text-xs text-on-surface-variant">Comparing volumes over time</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {metrics?.timeSeries?.inbound?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.timeSeries.inbound}>
                    <XAxis dataKey="date" stroke="#71787b" fontSize={12} />
                    <YAxis stroke="#71787b" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#E2E8F0' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="leads" name="Leads" fill="#244B59" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="formSubmissions" name="Form Subs" fill="#99CAD9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="calls" name="Calls" fill="#045CB4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full text-xs text-on-surface-variant">No data available</div>
              )}
            </div>
          </div>

          {/* Recharts Area Chart: Ad Spend Trend */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <div>
                <h2 className="font-headline-sm text-base text-primary font-bold">
                  Ad Spend Trend (Google vs Meta)
                </h2>
                <p className="text-xs text-on-surface-variant">Campaign Spend Over Time</p>
              </div>
            </div>

            <div className="h-56 w-full">
              {metrics?.timeSeries?.campaigns?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.timeSeries.campaigns}>
                    <XAxis dataKey="date" stroke="#71787b" fontSize={12} />
                    <YAxis stroke="#71787b" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="googleAdsSpend" name="Google Ads" stroke="#244B59" fill="#244B59" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="metaAdsSpend" name="Meta Ads" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full text-xs text-on-surface-variant">No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1-Column: Donut Chart, Rating Trend & System Notifications */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm">
            <h2 className="font-headline-sm text-base text-primary font-bold mb-3">
              Google Reviews Summary
            </h2>
            <div className="w-full flex flex-col justify-center items-center p-4">
              <span className="text-4xl font-bold text-primary mb-1">{metrics?.overallRating?.toFixed(1) || '0.0'}</span>
              <span className="text-xs text-on-surface-variant">Average Rating</span>
              
              <div className="mt-4">
                <span className="text-xl font-bold text-secondary">{metrics?.totalReviews || '0'}</span>
                <span className="text-xs text-on-surface-variant ml-2">Total Reviews</span>
              </div>
            </div>
          </div>

          {/* Pending Tasks & System Alerts Widget */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm">
            <h2 className="font-headline-sm text-base text-primary font-bold mb-3">
              Pending Tasks & Notifications
            </h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-status-warning/10 border border-status-warning/30 rounded-xl flex items-start gap-2.5">
                <span className="material-symbols-outlined text-status-warning text-base">warning</span>
                <div>
                  <p className="font-bold text-status-warning">Vendor Contract Renewal Alert</p>
                  <p className="text-on-surface-variant text-[11px]">OmniHealth Media contract expires in 12 days.</p>
                </div>
              </div>

              <div className="p-3 bg-surface-muted border border-border-subtle rounded-xl flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-base">task</span>
                <div>
                  <p className="font-bold text-primary">Approve Q4 Ad Creatives</p>
                  <p className="text-on-surface-variant text-[11px]">Spine surgery ad graphics pending marketing review.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
