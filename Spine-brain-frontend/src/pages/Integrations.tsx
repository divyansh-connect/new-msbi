import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { apiClient, API_BASE_URL } from '../api/client';
import { useToast } from '../context/ToastContext';

interface IntegrationStatus {
  id: string;
  connected: boolean;
  status: string;
  lastSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastError: string | null;
  updatedAt: string | null;
  config?: any;
}

interface IntegrationConnector {
  id: string;
  name: string;
  category: string;
  icon: string;
  connected: boolean;
  lastSync: string;
  description: string;
  dataPoints: string[];
  lastError?: string | null;
  config?: any;
}

const uiDefinitions: Record<string, Omit<IntegrationConnector, 'connected' | 'lastSync'>> = {
  'ga4': { id: 'ga4', name: 'Google Analytics 4', category: 'Web Analytics', icon: 'analytics', description: 'Track website sessions, bounce rate, top landing pages, and patient conversion funnels.', dataPoints: ['Visitor Sessions', 'Pageviews', 'Bounce Rate', 'Goal Conversions'] },
  'google-ads': { id: 'google-ads', name: 'Google Search Ads API', category: 'Paid Advertising', icon: 'ads_click', description: 'Pulls keyword spend, cost per click (CPC), click-through rate (CTR), and Spine/Brain ad campaign ROI.', dataPoints: ['Ad Spend', 'Clicks', 'Impressions', 'Spine/Brain CPC'] },
  'meta-ads': { id: 'meta-ads', name: 'Meta Ads Manager', category: 'Paid Advertising', icon: 'campaign', description: 'Facebook & Instagram social campaign metrics, patient audience reach, and lead ad form fills.', dataPoints: ['Social Ad Spend', 'Lead Form Fills', 'CPM', 'Audience Reach'] },
  'gsc': { id: 'gsc', name: 'Google Search Console', category: 'Organic Search / SEO', icon: 'search', description: 'Monitors organic healthcare search queries, keyword impression rankings, and organic CTR.', dataPoints: ['Organic Clicks', 'Search Impressions', 'Average Position', 'Top Queries'] },
  'looker': { id: 'looker', name: 'Looker Studio Embed', category: 'Executive BI', icon: 'monitoring', description: 'Live executive dashboard reports and automated PDF deck export generator.', dataPoints: ['Executive Board Deck', 'Automated PDF Export', 'BI Visualizations'] },
  'callrail': { id: 'callrail', name: 'CallRail Telephony', category: 'Call Tracking', icon: 'call', description: 'Tracks inbound phone call duration, caller location, missed call alerts, and HIPAA audio playback.', dataPoints: ['Inbound Calls', 'Call Answer Rate', 'HIPAA Audio Playback', 'Missed Call SMS'] },
  'hubspot': { id: 'hubspot', name: 'HubSpot CRM Bridge', category: 'Patient CRM', icon: 'sync_alt', description: 'Syncs inbound patient contact forms, clinical triage qualification status, and consult stages.', dataPoints: ['Patient Contacts', 'Consult Pipeline', 'Triage Status', 'Lifecycle Stages'] },
  'mailchimp': { id: 'mailchimp', name: 'Mailchimp Newsletter', category: 'Email Marketing', icon: 'mail', description: 'Patient education newsletters, post-op care email series, and subscriber list sync.', dataPoints: ['Email Drips', 'Open Rates', 'Unsubscribes', 'Care Series'] },
  'gbp': { id: 'gbp', name: 'Google Business Profile', category: 'Reputation & Reviews', icon: 'grade', description: 'Google star ratings, patient review feed, location ranking scores, and official clinic replies.', dataPoints: ['Google Reviews', 'Star Rating Average', 'Location Ranking', 'Review Requests'] },
  'custom-api': { id: 'custom-api', name: 'Custom REST / Webhooks API', category: 'Developer API', icon: 'api', description: 'Enterprise master API key, inbound webhook listeners, and custom JSON payload integration.', dataPoints: ['Master Key', 'Webhook Secret', 'REST Endpoints', 'JSON Payloads'] },
  'wordpress': { id: 'wordpress', name: 'WordPress CMS', category: 'Content Sync', icon: 'web', description: 'Syncs providers, locations, conditions, and treatments from the main website.', dataPoints: ['Providers', 'Locations', 'Custom Post Types', 'Forms'] }
};

export const Integrations: React.FC = () => {
  const { subview } = useParams<{ subview?: string }>();
  const [searchParams] = useSearchParams();
  const [connectors, setConnectors] = useState<IntegrationConnector[]>(Object.values(uiDefinitions).map(def => ({...def, connected: false, lastSync: 'Not connected'})));
  const [activeModalConnector, setActiveModalConnector] = useState<IntegrationConnector | null>(null);
  const { showSuccess, showError } = useToast();
  
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isTestingWordPress, setIsTestingWordPress] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Property Selection State
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  useEffect(() => {
    // If returning from OAuth
    if (searchParams.get('connected') === 'true' && searchParams.get('subview')) {
      const sv = searchParams.get('subview');
      const def = uiDefinitions[sv!];
      if (def) {
        setActiveModalConnector({...def, connected: true, lastSync: 'Just now'});
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await apiClient<{ success: boolean; data: IntegrationStatus[] }>('/integrations/status');
        if (res.success) {
          const merged = Object.values(uiDefinitions).map(uiDef => {
            const statusData = res.data.find(s => s.id === uiDef.id);
            let lastSync = 'Not connected';
            let connected = false;
            
            if (statusData && statusData.connected) {
              connected = true;
              if (statusData.lastSyncAt) {
                lastSync = new Date(statusData.lastSyncAt).toLocaleString();
              } else {
                lastSync = 'Pending sync';
              }
            }
            
            return {
              ...uiDef,
              connected,
              lastSync,
              lastError: statusData?.lastError,
              config: statusData?.config
            };
          });
          
          setConnectors(merged);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch integrations status');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
  }, []);

  useEffect(() => {
    if (activeModalConnector?.connected && (activeModalConnector.id === 'ga4' || activeModalConnector.id === 'gsc')) {
      fetchProperties(activeModalConnector.id);
    }
  }, [activeModalConnector]);

  const fetchProperties = async (type: string) => {
    setLoadingProperties(true);
    try {
      if (type === 'ga4') {
        const res = await apiClient<{ success: boolean; data: any[] }>('/integrations/ga4/properties');
        if (res.success) setProperties(res.data || []);
      } else if (type === 'gsc') {
        const res = await apiClient<{ success: boolean; data: any[] }>('/integrations/gsc/sites');
        if (res.success) setProperties(res.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load integration properties:', err?.message || 'Network error');
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleSaveProperty = async () => {
    if (isSavingConfig) return;
    setIsSavingConfig(true);
    try {
      if (activeModalConnector?.id === 'ga4') {
        await apiClient('/integrations/ga4/property', { method: 'POST', body: JSON.stringify({ propertyId: selectedPropertyId }) });
      } else if (activeModalConnector?.id === 'gsc') {
        await apiClient('/integrations/gsc/site', { method: 'POST', body: JSON.stringify({ siteUrl: selectedPropertyId }) });
      }
      showSuccess('Configuration saved successfully');
    } catch (err: any) {
      console.error('Failed to save integration property:', err?.message || 'Network error');
      showError('Failed to save configuration: ' + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestWordPressConnection = async () => {
    if (isTestingWordPress) return;
    setIsTestingWordPress(true);
    try {
      setLoading(true);
      const res = await apiClient<{ success: boolean; error?: string }>('/integrations/wordpress/health');
      if (res.success) {
        showSuccess('WordPress connection successful!');
      } else {
        showError('WordPress connection failed: ' + res.error);
      }
      // re-fetch status to update UI
      const statusRes = await apiClient<{ success: boolean; data: IntegrationStatus[] }>('/integrations/status');
      if (statusRes.success) {
        const merged = Object.values(uiDefinitions).map(uiDef => {
          const statusData = statusRes.data.find(s => s.id === uiDef.id);
          let lastSync = 'Not connected';
          let connected = false;
          if (statusData && statusData.connected) {
            connected = true;
            if (statusData.lastSyncAt) lastSync = new Date(statusData.lastSyncAt).toLocaleString();
            else lastSync = 'Pending sync';
          }
          return { ...uiDef, connected, lastSync, lastError: statusData?.lastError, config: statusData?.config };
        });
        setConnectors(merged);
        const updatedConnector = merged.find(c => c.id === 'wordpress');
        if (updatedConnector) setActiveModalConnector(updatedConnector);
      }
    } catch (err: any) {
      showError('Error testing connection: ' + err.message);
    } finally {
      setLoading(false);
      setIsTestingWordPress(false);
    }
  };

  const filteredConnectors = connectors.filter((c) => {
    if (!subview) return true;
    return c.id.toLowerCase() === subview.toLowerCase();
  });

  const toggleConnection = (id: string) => {
    setConnectors(
      connectors.map((c) =>
        c.id === id ? { ...c, connected: !c.connected, lastSync: !c.connected ? 'Just now' : 'Not connected' } : c
      )
    );
    if (activeModalConnector && activeModalConnector.id === id) {
      setActiveModalConnector((prev) =>
        prev ? { ...prev, connected: !prev.connected, lastSync: !prev.connected ? 'Just now' : 'Not connected' } : null
      );
    }
  };

  const initiateGoogleOAuth = () => {
    window.location.href = `${API_BASE_URL}/integrations/google/oauth/start`;
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 border-b border-border-subtle pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-headline-lg text-lg sm:text-xl md:text-2xl text-primary font-bold leading-tight">
              Third-Party Integrations & Connectors
            </h1>
          </div>
          <p className="font-body-md text-on-surface-variant text-xs mt-1">
            Configure external data connectors, view sync status, and manage API data mapping.
          </p>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
          <p>Loading connection status...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-status-error/10 border border-status-error/30 text-status-error rounded-xl">
          <p className="font-bold">Error loading integrations</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredConnectors.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm hover:border-secondary transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3 border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold shrink-0">
                      <span className="material-symbols-outlined text-lg sm:text-xl">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-primary">{item.name}</h3>
                      <span className="text-[10px] font-bold uppercase text-on-surface-variant bg-surface-muted px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`font-label-md text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase shrink-0 ml-1 ${
                      item.connected
                        ? 'bg-status-success/20 text-status-success border border-status-success/30'
                        : 'bg-surface-dim text-on-surface-variant border border-outline-variant'
                    }`}
                  >
                    {item.connected ? 'Active' : 'Not Connected'}
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">{item.description}</p>

                <div className="space-y-1.5 border-t border-border-subtle pt-3">
                  <p className="text-[10px] font-bold uppercase text-on-surface-variant">Synced Data Points:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.dataPoints.map((dp, idx) => (
                      <span key={idx} className="bg-surface-muted text-primary text-[10px] px-2 py-0.5 rounded font-medium">
                        {dp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border-subtle flex justify-between items-center text-xs">
                <span className="text-on-surface-variant text-[11px]">Sync: {item.lastSync}</span>
                <button
                  onClick={() => setActiveModalConnector(item)}
                  className="px-3 py-1.5 btn-primary-vibrant text-xs font-bold rounded-xl cursor-pointer"
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connector Config Modal */}
      {activeModalConnector && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">{activeModalConnector.icon}</span>
                <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary">{activeModalConnector.name}</h2>
              </div>
              <button onClick={() => { setActiveModalConnector(null); setProperties([]); setSelectedPropertyId(''); }} className="text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-surface-muted border border-border-subtle rounded-xl flex justify-between items-center">
                <span>Connector Status</span>
                <span className={`font-bold ${activeModalConnector.connected ? 'text-status-success' : 'text-on-surface-variant'}`}>
                  {activeModalConnector.connected ? 'Connected & Active' : 'Disconnected'}
                </span>
              </div>

              {!activeModalConnector.connected && (
                <div className="p-3 bg-status-warning/10 border border-status-warning/30 text-status-warning rounded-xl">
                  <p className="font-bold">Credentials Required</p>
                  <p className="text-xs mt-1">Please connect securely via the backend to enable this integration.</p>
                </div>
              )}

              {(activeModalConnector.id === 'wordpress') ? (
                <div className="mt-4 text-xs">
                  <div className="p-3 bg-surface-muted border border-border-subtle rounded-xl flex justify-between items-center mb-4">
                    <span>Base URL</span>
                    <span className="font-bold text-primary">
                      {activeModalConnector.config?.baseUrl || 'https://midwestspine.net'}
                    </span>
                  </div>
                  {activeModalConnector.lastError && (
                    <div className="mb-4 p-3 bg-status-error/10 border border-status-error/30 text-status-error rounded-xl">
                      <p className="font-bold">Last Error</p>
                      <p className="text-xs">{activeModalConnector.lastError}</p>
                    </div>
                  )}
                  <button
                    onClick={handleTestWordPressConnection}
                    disabled={isTestingWordPress}
                    className="btn-primary-vibrant px-4 py-2.5 rounded-xl font-bold w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">sync</span>
                    {isTestingWordPress ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              ) : (activeModalConnector.id === 'ga4' || activeModalConnector.id === 'gsc') ? (
                <>
                  {!activeModalConnector.connected ? (
                     <div className="mt-4 text-center">
                       <button onClick={initiateGoogleOAuth} className="btn-primary-vibrant px-4 py-2.5 rounded-xl font-bold cursor-pointer w-full text-sm flex items-center justify-center gap-2">
                         <span className="material-symbols-outlined">login</span>
                         Connect with Google
                       </button>
                     </div>
                  ) : (
                    <div className="mt-4">
                       <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Select Property</label>
                       {loadingProperties ? (
                         <div className="text-on-surface-variant animate-pulse">Loading properties...</div>
                       ) : (
                         <div className="flex flex-col gap-2">
                           <select 
                             className="w-full border border-border-subtle rounded-xl p-2.5 bg-surface-muted font-medium text-on-surface cursor-pointer"
                             value={selectedPropertyId}
                             onChange={(e) => setSelectedPropertyId(e.target.value)}
                           >
                             <option value="">-- Select --</option>
                             {properties.map(p => (
                               <option key={activeModalConnector.id === 'ga4' ? p.property : p.siteUrl} value={activeModalConnector.id === 'ga4' ? p.property.split('/')[1] : p.siteUrl}>
                                 {activeModalConnector.id === 'ga4' ? p.displayName : p.siteUrl}
                               </option>
                             ))}
                           </select>
                            <button
                              onClick={handleSaveProperty}
                              disabled={!selectedPropertyId || isSavingConfig}
                              className="btn-primary-vibrant px-4 py-2 rounded-xl font-bold mt-2 disabled:opacity-50"
                            >
                              {isSavingConfig ? 'Saving...' : 'Save Configuration'}
                            </button>
                         </div>
                       )}
                    </div>
                  )}
                </>
              ) : (
                <div className="opacity-50 pointer-events-none">
                  <div>
                    <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">API Key / Access Token</label>
                    <input
                      type="password"
                      value="●●●●●●●●●●●●●●●●●●●●"
                      readOnly
                      className="w-full border border-border-subtle rounded-xl p-2.5 bg-surface-muted font-mono"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Sync Frequency</label>
                    <select className="w-full border border-border-subtle rounded-xl p-2.5 bg-surface-muted font-medium text-on-surface cursor-pointer">
                      <option>Realtime Webhook</option>
                      <option>Every 15 Minutes</option>
                      <option>Hourly Digest</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
                {(activeModalConnector.id !== 'ga4' && activeModalConnector.id !== 'gsc' && activeModalConnector.id !== 'wordpress') && (
                  <button
                    type="button"
                    onClick={() => toggleConnection(activeModalConnector.id)}
                    className={`px-3 py-2 rounded-xl font-bold cursor-pointer text-xs ${
                      activeModalConnector.connected
                        ? 'bg-status-error/20 text-status-error hover:bg-status-error/30'
                        : 'bg-status-success/20 text-status-success hover:bg-status-success/30'
                    }`}
                  >
                    {activeModalConnector.connected ? 'Mock Disconnect' : 'Mock Connect'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setActiveModalConnector(null); setProperties([]); setSelectedPropertyId(''); }}
                  className="bg-surface-muted text-on-surface px-4 py-2 rounded-xl font-bold cursor-pointer text-xs ml-auto hover:bg-surface-dim"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
