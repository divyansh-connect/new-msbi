import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { CampaignItem } from '../types/crm';

const fetchCampaigns = async (): Promise<CampaignItem[]> => {
  const res = await apiClient<{ success: boolean; data: any[] }>('/campaigns');
  return res.data.map((c) => ({
    id: c.id,
    title: c.name,
    owner: c.owner?.firstName ? `${c.owner.firstName} ${c.owner.lastName}` : 'System',
    status: c.status,
    budget: `$${Number(c.budget).toLocaleString()}`,
    spent: `$${Number(c.spend || 0).toLocaleString()}`,
    roi: c.roi ? `+ ${c.roi}%` : '--',
    channel: 'Digital Ads',
    leads: c.leadsGenerated || 0,
    startDate: new Date(c.startDate).toLocaleDateString(),
    endDate: c.endDate ? new Date(c.endDate).toLocaleDateString() : 'TBD'
  }));
};

const subViewTitles: Record<string, { title: string; subtitle: string }> = {
  'all': { title: 'All Marketing Campaigns', subtitle: 'Overview of all active, draft, and paused marketing campaigns.' },
  'active': { title: 'Active Campaigns Directory', subtitle: 'Currently running marketing initiatives and real-time performance.' },
  'calendar': { title: 'Campaign Calendar & Execution Timeline', subtitle: 'Quarterly timeline, launch milestones, and scheduled promotional drives.' },
  'goals': { title: 'Campaign Goals & Performance KPIs', subtitle: 'Target vs actual lead acquisition goals and target CPA metrics.' },
  'assets': { title: 'Campaign Creative Assets & Documents', subtitle: 'Brochures, digital graphic ad sets, and video asset store.' },
  'tasks': { title: 'Campaign Execution Tasks Kanban Board', subtitle: 'Task assignments, progress tracking, and workflow completion status.' },
};

export const CampaignManagement: React.FC = () => {
  const { subview } = useParams<{ subview?: string }>();
  const queryClient = useQueryClient();
  
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns
  });
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showMetricsModal, setShowMetricsModal] = useState<boolean>(false);
  
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);

  // Create Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newBudget, setNewBudget] = useState<string>('');
  const [newOwner, setNewOwner] = useState<string>('Admin User');
  const [newStatus, setNewStatus] = useState<string>('Active');
  const [newStartDate, setNewStartDate] = useState<string>('');
  const [newEndDate, setNewEndDate] = useState<string>('');
  const [newGoal, setNewGoal] = useState<string>('');

  const activeSubViewKey = subview || 'all';
  const meta = subViewTitles[activeSubViewKey] || subViewTitles['all'];

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
      setNewTitle('');
      setNewBudget('');
      setNewStartDate('');
      setNewEndDate('');
      setNewGoal('');
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
    if (!newTitle) return;
    
    createMutation.mutate({
      name: newTitle,
      status: newStatus,
      budget: parseFloat(newBudget || '0'),
      startDate: newStartDate || new Date().toISOString(),
      endDate: newEndDate || undefined,
      goal: newGoal
    });
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    
    updateMutation.mutate({
      id: selectedCampaign.id,
      name: selectedCampaign.title,
      status: selectedCampaign.status,
      budget: parseFloat(selectedCampaign.budget.replace(/[^0-9.-]+/g,""))
    });
  };

  const openEditModal = (camp: CampaignItem) => {
    setSelectedCampaign({ ...camp });
    setShowEditModal(true);
  };

  const openMetricsModal = (camp: CampaignItem) => {
    setSelectedCampaign(camp);
    setShowMetricsModal(true);
  };

  const downloadDocument = (filename: string, fileType: string) => {
    // Generate a dummy blob and trigger download to simulate proper document download
    const content = `Mock content for ${filename}\nFile Type: ${fileType}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 sm:space-y-6 text-left relative">
      {/* Universal Fixed Top Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 border-b border-border-subtle pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-headline-lg text-lg sm:text-xl md:text-2xl text-primary font-bold leading-tight text-left">
              {meta.title}
            </h1>
            <span className="bg-primary-container text-on-primary-container px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold whitespace-nowrap inline-flex items-center shrink-0">
              Database Sync Connected
            </span>
          </div>
          <p className="font-body-md text-on-surface-variant text-xs mt-1 text-left">
            {meta.subtitle}
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary-vibrant font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Create New Campaign</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center font-bold text-primary">Loading Campaigns...</div>
      ) : activeSubViewKey === 'calendar' ? (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 text-left">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-border-subtle pb-3">
            <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary">Q3 Campaign Execution Schedule</h2>
            <span className="text-xs font-bold text-secondary">Timeline</span>
          </div>

          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="p-3.5 border border-border-subtle rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-surface-muted/50 text-left">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-primary text-left">{c.title}</h3>
                  <p className="text-xs text-on-surface-variant text-left">Owner: {c.owner} • {c.channel}</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs font-data-mono font-bold text-primary">{c.startDate} — {c.endDate}</span>
                  <p className="text-[11px] text-status-success font-bold mt-0.5">{c.budget}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubViewKey === 'goals' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-left">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm sm:text-base text-primary border-b border-border-subtle pb-2 text-left">Target vs Actual Leads Goal</h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Spine Health Push Goal</span>
                  <span className="text-primary font-mono">312 / 400 Leads (78%)</span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Neurology Consult Target</span>
                  <span className="text-primary font-mono">184 / 200 Leads (92%)</span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-2.5">
                  <div className="bg-status-success h-2.5 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm sm:text-base text-primary border-b border-border-subtle pb-2 text-left">Cost Per Acquisition (CPA) Goals</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-surface-muted border border-border-subtle rounded-xl">
                <span>Google Spine Ads Target CPA</span>
                <span className="font-bold text-status-success">$47.85 (Goal &lt; $55.00)</span>
              </div>
              <div className="flex justify-between p-3 bg-surface-muted border border-border-subtle rounded-xl">
                <span>Meta Social Ads Target CPA</span>
                <span className="font-bold text-status-warning">$46.66 (Goal &lt; $40.00)</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubViewKey === 'assets' ? (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 text-left">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3 text-left">
            Campaign Creative Assets & Document Store
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
            {[
              { name: 'Spine_Surgery_Brochure.pdf', size: '4.2 MB', type: 'PDF Document', date: 'Aug 04, 2026' },
              { name: 'Minimally_Invasive_Ad_1080x1080.png', size: '1.8 MB', type: 'Graphic Asset', date: 'Aug 02, 2026' },
              { name: 'Doctor_Consult_Video.mp4', size: '24.5 MB', type: 'Video Asset', date: 'Jul 28, 2026' },
            ].map((file, idx) => (
              <div key={idx} className="p-3 border border-border-subtle rounded-xl bg-surface-muted/30 flex justify-between items-center hover:border-primary transition-all text-left overflow-hidden">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="material-symbols-outlined text-secondary text-xl sm:text-2xl shrink-0">description</span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-bold text-primary truncate text-xs sm:text-sm text-left">{file.name}</p>
                    <p className="text-[11px] text-on-surface-variant text-left">{file.type} • {file.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => downloadDocument(file.name, file.type)}
                  className="p-2 bg-surface-container hover:bg-surface-container-high text-primary font-bold rounded-xl cursor-pointer shrink-0 ml-2 flex items-center justify-center shadow-xs"
                  title={`Download ${file.name}`}
                >
                  <span className="material-symbols-outlined text-base">download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubViewKey === 'tasks' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 text-left">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 space-y-3 shadow-sm">
            <h3 className="font-bold text-sm text-primary border-b border-border-subtle pb-2 flex justify-between">
              <span>To Do</span>
              <span className="bg-surface-container text-primary px-2 py-0.5 rounded text-xs font-bold">2</span>
            </h3>
            <div className="p-3 bg-surface-muted border border-border-subtle rounded-xl text-xs space-y-1 text-left">
              <p className="font-bold text-primary">Finalize Spine Surgery TV Spot</p>
              <p className="text-on-surface-variant text-[11px]">Assigned to: Sarah Jenkins</p>
            </div>
            <div className="p-3 bg-surface-muted border border-border-subtle rounded-xl text-xs space-y-1 text-left">
              <p className="font-bold text-primary">Upload Meta Retargeting Pixel</p>
              <p className="text-on-surface-variant text-[11px]">Assigned to: Digital Media Team</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 space-y-3 shadow-sm text-left">
            <h3 className="font-bold text-sm text-primary border-b border-border-subtle pb-2 flex justify-between">
              <span>In Progress</span>
              <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded text-xs font-bold">0</span>
            </h3>
          </div>

          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 space-y-3 shadow-sm text-left">
            <h3 className="font-bold text-sm text-primary border-b border-border-subtle pb-2 flex justify-between">
              <span>Completed</span>
              <span className="bg-status-success/20 text-status-success px-2 py-0.5 rounded text-xs font-bold">3</span>
            </h3>
            <div className="p-3 bg-surface-muted border border-border-subtle rounded-xl text-xs space-y-1 text-left">
              <p className="font-bold text-primary">Budget Allocations Audit</p>
              <p className="text-on-surface-variant text-[11px]">Completed by: Dr. Vance</p>
            </div>
          </div>
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
                  <div className="text-left">
                    <h2 className="font-headline-sm text-sm sm:text-base text-primary font-bold text-left">{camp.title}</h2>
                    <p className="font-body-sm text-xs text-on-surface-variant mt-0.5 text-left">Owner: {camp.owner}</p>
                  </div>
                  <span
                    className={`font-label-md text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold shrink-0 ml-2 ${
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
