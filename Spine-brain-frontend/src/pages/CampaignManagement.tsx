import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, API_BASE_URL } from '../api/client';
import { useToast } from '../context/ToastContext';
import { CampaignItem } from '../types/crm';

interface TaskRecord {
  id: string;
  campaignId: string;
  title: string;
  status: string;
  assignedTo?: string;
  dueDate?: string;
  createdAt?: string;
  campaign?: { name: string };
}

interface AssetRecord {
  id: string;
  campaignId: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  mimeType: string;
  createdAt?: string;
  campaign?: { name: string };
}

const fetchCampaigns = async (): Promise<CampaignItem[]> => {
  const res = await apiClient<{ success: boolean; data: any[] }>('/campaigns');
  return res.data.map((c) => {
    let normalizedStatus: 'Active' | 'Draft' | 'Paused' = 'Active';
    if (c.status === 'ENABLED' || c.status === 'Active') {
      normalizedStatus = 'Active';
    } else if (c.status === 'PAUSED' || c.status === 'Paused') {
      normalizedStatus = 'Paused';
    } else if (c.status === 'Draft' || c.status === 'REMOVED') {
      normalizedStatus = 'Draft';
    }

    const channelName = c.platform === 'google_ads' ? 'Google Ads' : (c.channel || 'Digital Ads');

    return {
      id: c.id,
      title: c.name,
      owner: c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : 'Marketing Lead',
      status: normalizedStatus,
      budget: `$${Number(c.budget || 0).toLocaleString()}`,
      spent: `$${Number(c.spend || 0).toLocaleString()}`,
      roi: c.roi ? `+${c.roi}%` : 'N/A',
      channel: channelName,
      leads: c.leadsGenerated || 0,
      startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : 'N/A',
      endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : 'N/A',
      platform: c.platform || 'crm',
      externalCampaignId: c.externalCampaignId,
      impressions: c.impressions || 0,
      clicks: c.clicks || 0,
      ctr: c.ctr || 0,
      cpc: c.cpc || 0,
      conversions: c.conversions || 0,
      conversionValue: c.conversionValue || 0,
    };
  });
};

const subViewTitles: Record<string, { title: string; subtitle: string }> = {
  'all': { title: 'All Campaign Directory', subtitle: 'Central operations overview for active, draft, and completed campaigns.' },
  'active': { title: 'Active Marketing Campaigns', subtitle: 'Live campaigns currently generating traffic, leads, and provider consults.' },
  'calendar': { title: 'Campaign Calendar & Execution Timeline', subtitle: 'Quarterly timeline, launch milestones, and scheduled promotional drives.' },
  'goals': { title: 'Campaign Goals & Performance KPIs', subtitle: 'Target vs actual lead acquisition goals and target CPA metrics.' },
  'assets': { title: 'Campaign Creative Assets & Documents', subtitle: 'Brochures, digital graphic ad sets, and video asset store.' },
  'tasks': { title: 'Campaign Execution Tasks Kanban Board', subtitle: 'Task assignments, progress tracking, and workflow completion status.' },
};

export const CampaignManagement: React.FC = () => {
  const { subview } = useParams<{ subview?: string }>();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns
  });

  const [isSyncingAds, setIsSyncingAds] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showMetricsModal, setShowMetricsModal] = useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);

  const [newTitle, setNewTitle] = useState<string>('');
  const [newBudget, setNewBudget] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('Active');
  const [newStartDate, setNewStartDate] = useState<string>('');
  const [newEndDate, setNewEndDate] = useState<string>('');
  const [newGoal, setNewGoal] = useState<string>('');

  const activeSubViewKey = subview || 'all';
  const meta = subViewTitles[activeSubViewKey] || subViewTitles['all'];

  const { data: assets = [], isLoading: isAssetsLoading } = useQuery({
    queryKey: ['campaign-assets'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: AssetRecord[] }>('/campaigns/assets/all');
      return res.data || [];
    },
    enabled: activeSubViewKey === 'assets'
  });

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['campaign-tasks'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: TaskRecord[] }>('/campaigns/tasks/all');
      return res.data || [];
    },
    enabled: activeSubViewKey === 'tasks'
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return apiClient(`/campaigns/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-tasks'] });
      showSuccess('Task status updated successfully!');
    },
    onError: (err: any) => {
      showError('Failed to update task: ' + err.message);
    }
  });

  const handleDownloadRealAsset = async (assetId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/campaigns/assets/${assetId}/download`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess(`Downloaded ${fileName} successfully!`);
    } catch (err: any) {
      showError('Asset download failed: ' + err.message);
    }
  };

  const handleSyncGoogleAds = async () => {
    if (isSyncingAds) return;
    setIsSyncingAds(true);
    try {
      const res = await apiClient<{ success: boolean; message: string }>('/integrations/google-ads/sync', { method: 'POST' });
      if (res.success) {
        showSuccess('Google Ads campaigns synced successfully!');
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      } else {
        showError(res.message || 'Failed to sync Google Ads');
      }
    } catch (err: any) {
      showError('Google Ads sync failed: ' + err.message);
    } finally {
      setIsSyncingAds(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeSubViewKey === 'active') return c.status === 'Active';
    return true;
  });

  const createMutation = useMutation({
    mutationFn: (newCamp: any) => apiClient('/campaigns', {
      method: 'POST',
      body: JSON.stringify(newCamp)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowCreateModal(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updateCamp: any) => apiClient(`/campaigns/${updateCamp.id}`, {
      method: 'PUT',
      body: JSON.stringify(updateCamp)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowEditModal(false);
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: newTitle,
      status: newStatus,
      budget: parseFloat(newBudget || '0'),
      startDate: newStartDate,
      endDate: newEndDate || undefined,
      goal: newGoal
    });
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    updateMutation.mutate(selectedCampaign);
  };

  const openEditModal = (camp: CampaignItem) => {
    setSelectedCampaign({ ...camp });
    setShowEditModal(true);
  };

  const openMetricsModal = (camp: CampaignItem) => {
    setSelectedCampaign(camp);
    setShowMetricsModal(true);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-primary text-left">
            {meta.title}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 text-left">
            {meta.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleSyncGoogleAds}
            disabled={isSyncingAds}
            className="bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <span className={`material-symbols-outlined text-base ${isSyncingAds ? 'animate-spin' : ''}`}>sync</span>
            <span>{isSyncingAds ? 'Syncing...' : 'Sync Ads'}</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary-vibrant font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center font-bold text-primary">Loading Campaigns...</div>
      ) : activeSubViewKey === 'calendar' ? (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="p-3.5 border border-border-subtle rounded-xl flex justify-between items-center bg-surface-muted/50">
                <div>
                  <h3 className="font-bold text-sm text-primary">{c.title}</h3>
                  <p className="text-xs text-on-surface-variant">Owner: {c.owner} • {c.channel}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-primary">{c.startDate} — {c.endDate}</span>
                  <p className="text-[11px] text-status-success font-bold">{c.budget}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubViewKey === 'goals' ? (
        <div className="space-y-5 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-left">
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm sm:text-base text-primary border-b border-border-subtle pb-2 text-left">CRM Database Lead Goals Progress</h3>
              <div className="space-y-3 text-xs">
                {campaigns.filter(c => c.leads > 0 || c.budget).map((c) => {
                  const targetMatch = c.title.match(/(\d+)\s*Leads/i) || [null, '200'];
                  const targetLeads = parseInt(targetMatch[1] || '200', 10);
                  const pct = Math.min(100, Math.round((c.leads / targetLeads) * 100));
                  return (
                    <div key={c.id}>
                      <div className="flex justify-between font-bold mb-1">
                        <span>{c.title}</span>
                        <span className="text-primary font-mono">{c.leads} / {targetLeads} Leads ({pct}%)</span>
                      </div>
                      <div className="w-full bg-surface-container-highest rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                {campaigns.length === 0 && (
                  <p className="text-on-surface-variant italic">No active CRM lead goals configured.</p>
                )}
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm sm:text-base text-primary border-b border-border-subtle pb-2 text-left">Cost Per Lead (CPL / CPA) Performance</h3>
              <div className="space-y-3 text-xs">
                {campaigns.map((c) => {
                  const spendNum = parseFloat(c.spent.replace(/[^0-9.-]+/g, '') || '0');
                  const cpa = c.leads > 0 ? (spendNum / c.leads).toFixed(2) : '0.00';
                  return (
                    <div key={c.id} className="flex justify-between p-3 bg-surface-muted border border-border-subtle rounded-xl">
                      <span>{c.title} ({c.channel})</span>
                      <span className="font-bold text-status-success">${cpa} / Lead</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : activeSubViewKey === 'assets' ? (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 text-left">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3 text-left">
            Campaign Creative Assets & Document Store
          </h2>

          {isAssetsLoading ? (
            <div className="py-12 text-center text-sm font-bold text-on-surface-variant">Loading Assets from Storage...</div>
          ) : assets.length === 0 ? (
            <div className="py-12 text-center text-sm font-bold text-on-surface-variant border border-dashed border-border-subtle rounded-2xl">
              No creative assets uploaded in database storage yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
              {assets.map((asset) => (
                <div key={asset.id} className="p-3 border border-border-subtle rounded-xl bg-surface-muted/30 flex justify-between items-center hover:border-primary transition-all text-left overflow-hidden">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="material-symbols-outlined text-secondary text-xl sm:text-2xl shrink-0">
                      {asset.mimeType.includes('pdf') ? 'picture_as_pdf' : asset.mimeType.includes('image') ? 'image' : 'movie'}
                    </span>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-bold text-primary truncate text-xs sm:text-sm text-left">{asset.name}</p>
                      <p className="text-[11px] text-on-surface-variant text-left">{asset.fileType} • {asset.fileSize}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadRealAsset(asset.id, asset.name)}
                    className="p-2 bg-surface-container hover:bg-surface-container-high text-primary font-bold rounded-xl cursor-pointer shrink-0 ml-2 flex items-center justify-center shadow-xs"
                    title={`Download ${asset.name}`}
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeSubViewKey === 'tasks' ? (
        <div className="space-y-4">
          {isTasksLoading ? (
            <div className="py-12 text-center text-sm font-bold text-on-surface-variant">Loading Tasks...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 text-left">
              {['To Do', 'In Progress', 'Completed'].map((columnStatus) => {
                const columnTasks = tasks.filter(t => t.status === columnStatus);
                return (
                  <div key={columnStatus} className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 space-y-3 shadow-sm text-left">
                    <h3 className="font-bold text-sm text-primary border-b border-border-subtle pb-2 flex justify-between">
                      <span>{columnStatus}</span>
                      <span className="bg-surface-container text-primary px-2 py-0.5 rounded text-xs font-bold">{columnTasks.length}</span>
                    </h3>
                    {columnTasks.length === 0 ? (
                      <p className="text-xs text-on-surface-variant italic py-4 text-center">No tasks in {columnStatus}</p>
                    ) : (
                      columnTasks.map((t) => (
                        <div key={t.id} className="p-3 bg-surface-muted border border-border-subtle rounded-xl text-xs space-y-2 text-left">
                          <div>
                            <p className="font-bold text-primary text-left">{t.title}</p>
                            <p className="text-on-surface-variant text-[11px] text-left">Assigned to: {t.assignedTo || 'Unassigned'}</p>
                          </div>
                          <div className="pt-2 border-t border-border-subtle flex justify-between items-center">
                            <span className="text-[10px] text-on-surface-variant font-mono">Move Status:</span>
                            <select
                              value={t.status}
                              onChange={(e) => updateTaskStatusMutation.mutate({ taskId: t.id, status: e.target.value })}
                              className="text-[11px] border border-border-subtle bg-surface-container rounded px-1.5 py-0.5 font-bold text-primary"
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 text-left">
          {filteredCampaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm hover:border-secondary transition-all flex flex-col justify-between text-left"
            >
              <div>
                <div className="flex justify-between items-start mb-3 border-b border-border-subtle pb-3">
                  <div className="text-left min-w-0 flex-1 pr-2">
                    <h2 className="font-headline-sm text-sm sm:text-base text-primary font-bold text-left truncate">{camp.title}</h2>
                    <p className="font-body-sm text-xs text-on-surface-variant mt-0.5 text-left truncate">Owner: {camp.owner}</p>
                  </div>
                  <span
                    className={`font-label-md text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold shrink-0 ${
                      camp.status === 'Active'
                        ? 'bg-status-success/20 text-status-success border-status-success/30'
                        : camp.status === 'Draft'
                        ? 'bg-surface-dim text-on-surface-variant border-outline-variant'
                        : 'bg-status-warning/20 text-status-warning border-status-warning/30'
                    }`}
                  >
                    {camp.status}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 text-xs">
                  <div className="text-left">
                    <p className="font-label-md text-[10px] uppercase text-on-surface-variant font-bold text-left">Allocated Budget</p>
                    <p className="font-data-mono text-xs sm:text-sm font-bold text-on-surface mt-0.5 text-left">{camp.budget}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-label-md text-[10px] uppercase text-on-surface-variant font-bold text-right">Net Campaign ROI</p>
                    <p className={`font-data-mono text-xs sm:text-sm font-bold mt-0.5 text-right ${camp.roi.includes('+') ? 'text-primary font-extrabold' : 'text-on-surface-variant'}`}>
                      {camp.roi}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border-subtle flex justify-between items-center text-xs text-on-surface-variant">
                  <span className="truncate pr-2 text-left">Channel: {camp.channel}</span>
                  <span className="font-bold text-primary whitespace-nowrap">{camp.leads} Leads</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2 pt-2">
                <button
                  onClick={() => openMetricsModal(camp)}
                  className="flex-1 bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer text-center"
                >
                  View Metrics
                </button>
                <button
                  onClick={() => openEditModal(camp)}
                  className="px-3.5 bg-surface-muted hover:bg-surface-container border border-border-subtle rounded-xl text-xs text-on-surface-variant font-medium cursor-pointer text-center"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New Campaign Modal */}
      {showCreateModal && createPortal(
<div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-lg w-full p-5 sm:p-6 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary text-left">Create New Campaign</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold text-left">Campaign Title</label>
                <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Spine Surgery Q4 Push" className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold text-left">Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold text-left">Budget ($ USD)</label>
                  <input type="number" required value={newBudget} onChange={(e) => setNewBudget(e.target.value)} placeholder="10000" className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold text-left">Start Date</label>
                  <input type="date" required value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold text-left">End Date</label>
                  <input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold text-left">Goal / Objective</label>
                <input type="text" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="e.g. Generate 500 Qualified Leads" className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">{createMutation.isPending ? 'Saving...' : 'Save Campaign'}</button>
              </div>
            </form>
          </div>
        </div>
      ,
        document.body
      )}

      {/* Edit Campaign Modal */}
      {showEditModal && selectedCampaign && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-lg w-full p-5 sm:p-6 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary text-left">Edit Campaign: {selectedCampaign.title}</h2>
              <button onClick={() => setShowEditModal(false)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold text-left">Campaign Title</label>
                <input type="text" required value={selectedCampaign.title} onChange={(e) => setSelectedCampaign({...selectedCampaign, title: e.target.value})} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold text-left">Status</label>
                  <select value={selectedCampaign.status} onChange={(e) => setSelectedCampaign({...selectedCampaign, status: e.target.value as any})} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold text-left">Budget</label>
                  <input type="text" required value={selectedCampaign.budget} onChange={(e) => setSelectedCampaign({...selectedCampaign, budget: e.target.value})} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold text-left">Start Date</label>
                  <input type="text" value={selectedCampaign.startDate} onChange={(e) => setSelectedCampaign({...selectedCampaign, startDate: e.target.value})} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold text-left">End Date</label>
                  <input type="text" value={selectedCampaign.endDate} onChange={(e) => setSelectedCampaign({...selectedCampaign, endDate: e.target.value})} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="bg-secondary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-secondary-dark cursor-pointer">{updateMutation.isPending ? 'Updating...' : 'Update Campaign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Metrics Modal */}
      {showMetricsModal && selectedCampaign && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-2xl w-full p-5 sm:p-6 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary text-left">Metrics Overview: {selectedCampaign.title}</h2>
              <button onClick={() => setShowMetricsModal(false)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-surface-muted border border-border-subtle rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Allocated Budget</p>
                <p className="font-data-mono font-bold text-primary mt-1">{selectedCampaign.budget}</p>
              </div>
              <div className="bg-surface-muted border border-border-subtle rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Amount Spent</p>
                <p className="font-data-mono font-bold text-status-warning mt-1">{selectedCampaign.spent}</p>
              </div>
              <div className="bg-surface-muted border border-border-subtle rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Generated Leads</p>
                <p className="font-data-mono font-bold text-secondary mt-1">{selectedCampaign.leads}</p>
              </div>
              <div className="bg-surface-muted border border-border-subtle rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Net ROI</p>
                <p className="font-data-mono font-bold text-status-success mt-1">{selectedCampaign.roi}</p>
              </div>
            </div>

            {selectedCampaign.platform === 'google_ads' && (
              <div className="bg-surface-container border border-border-subtle rounded-xl p-4 mb-4 space-y-2 text-xs">
                <p className="font-bold text-primary uppercase text-[10px]">Google Ads Real-Time Performance Breakdown</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold">Impressions</span>
                    <p className="font-mono font-bold text-on-surface">{selectedCampaign.impressions?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold">Clicks</span>
                    <p className="font-mono font-bold text-on-surface">{selectedCampaign.clicks?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold">CTR (%)</span>
                    <p className="font-mono font-bold text-on-surface">{selectedCampaign.ctr || 0}%</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold">Avg CPC ($)</span>
                    <p className="font-mono font-bold text-on-surface">${selectedCampaign.cpc || 0}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-surface-container border border-border-subtle rounded-xl p-4 flex items-center justify-center min-h-[150px] mb-4">
              <p className="text-sm font-bold text-on-surface-variant">Performance Chart Placeholder</p>
            </div>

            <div className="flex justify-end pt-4 border-t border-border-subtle">
              <button onClick={() => setShowMetricsModal(false)} className="btn-primary-vibrant px-6 py-2 rounded-xl text-xs font-bold cursor-pointer">Close Metrics</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
