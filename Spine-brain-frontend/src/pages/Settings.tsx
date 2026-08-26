import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

const subViewTitles: Record<string, { title: string; subtitle: string }> = {
  'organization': { title: 'Practice Organization Profile', subtitle: 'Practice identity, main medical campus details, and business settings.' },
  'clinics': { title: 'Clinic Practice Locations Directory', subtitle: 'Roseville, Edina, and St. Paul practice addresses and facility specs.' },
  'providers': { title: 'Physician & Provider Roster Settings', subtitle: 'Active surgeons, neurosurgeons, NPI numbers, and clinic assignments.' },
  'kpis': { title: 'Operational Alert & KPI Threshold Settings', subtitle: 'Max target CPA, minimum call answer rates, and warning alerts.' },
  'notifications': { title: 'System Notification Preferences', subtitle: 'SMS lead alerts, contract expiration warnings, and weekly email digests.' },
  'security': { title: 'Two-Factor Authentication (MFA) & Security', subtitle: 'TOTP Authenticator app integration, backup recovery codes, and session protection.' },
  'api-keys': { title: 'Master Enterprise API Keys & Webhooks', subtitle: 'Master REST API keys, webhook signing secrets, and developer integration.' },
};

const StaffAlertRow: React.FC<{
  user: any;
  locations: any[];
  onSave: (userId: string, phoneNumber: string | null, emailAlerts: boolean, smsAlerts: boolean, alertLocations: string[]) => Promise<void>;
  isSaving: boolean;
}> = ({ user, locations, onSave, isSaving }) => {
  const [phone, setPhone] = useState(user.phoneNumber || '');
  const [emailAlerts, setEmailAlerts] = useState(user.emailAlerts || false);
  const [smsAlerts, setSmsAlerts] = useState(user.smsAlerts || false);
  
  let parsedLocations: string[] = [];
  if (user.alertLocations) {
    try {
      parsedLocations = typeof user.alertLocations === 'string'
        ? JSON.parse(user.alertLocations)
        : (Array.isArray(user.alertLocations) ? user.alertLocations : []);
    } catch (e) {
      parsedLocations = [];
    }
  }
  const [selectedLocs, setSelectedLocs] = useState<string[]>(parsedLocations);

  const handleLocToggle = (locId: string) => {
    setSelectedLocs(prev =>
      prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
    );
  };

  return (
    <div className="p-4 border border-border-subtle rounded-xl bg-surface-muted space-y-3">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div>
          <span className="font-bold text-primary text-xs sm:text-sm">{user.firstName} {user.lastName}</span>
          <p className="text-[10px] text-on-surface-variant">{user.email} • Role: {user.roleName}</p>
        </div>
        <button
          onClick={() => onSave(user.id, phone || null, emailAlerts, smsAlerts, selectedLocs)}
          disabled={isSaving}
          className="btn-primary-vibrant px-3 py-1.5 rounded-xl font-bold text-[10px] disabled:opacity-50 self-end sm:self-auto cursor-pointer"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border-subtle text-[11px]">
        <div className="space-y-1">
          <label className="block font-bold text-on-surface-variant uppercase text-[9px]">Mobile Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +16125550199"
            className="w-full border border-border-subtle rounded-xl px-2.5 py-1.5 bg-surface-container-lowest text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-2 flex flex-col justify-center">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-on-surface text-xs">
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
            Email Review Alerts
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-bold text-on-surface text-xs">
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
            SMS Review Alerts
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="block font-bold text-on-surface-variant uppercase text-[9px]">Location Filters</label>
          {locations.length === 0 ? (
            <p className="text-[10px] text-on-surface-variant italic">No mapped Google locations configured.</p>
          ) : (
            <div className="max-h-24 overflow-y-auto space-y-1 p-1 bg-surface-container-lowest border border-border-subtle rounded-xl">
              {locations.map(loc => (
                <label key={loc.id} className="flex items-center gap-1.5 cursor-pointer text-[10px] text-on-surface">
                  <input
                    type="checkbox"
                    checked={selectedLocs.includes(loc.googleLocationId)}
                    disabled={!loc.googleLocationId}
                    onChange={() => loc.googleLocationId && handleLocToggle(loc.googleLocationId)}
                    className="rounded text-primary focus:ring-primary h-3 w-3 cursor-pointer"
                  />
                  <span className="truncate">{loc.name}</span>
                </label>
              ))}
            </div>
          )}
          <span className="text-[9px] text-on-surface-variant italic block">(If none selected, receives alerts for all locations)</span>
        </div>
      </div>
    </div>
  );
};

export const Settings: React.FC = () => {
  const { subview } = useParams<{ subview?: string }>();
  const [apiKey, setApiKey] = useState<string>('msbi_live_key_99482938472938472938');

  // MFA Modal States
  const [showMfaEnrollModal, setShowMfaEnrollModal] = useState<boolean>(false);
  const [enrollStep, setEnrollStep] = useState<'LOADING' | 'QR' | 'RECOVERY_CODES'>('LOADING');
  const [enrollData, setEnrollData] = useState<{ qrCode: string; secret: string; otpauthUri: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [generatedRecoveryCodes, setGeneratedRecoveryCodes] = useState<string[]>([]);
  const [isVerifyingEnroll, setIsVerifyingEnroll] = useState<boolean>(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [copiedCodes, setCopiedCodes] = useState<boolean>(false);

  // Disable MFA Modal States
  const [showDisableModal, setShowDisableModal] = useState<boolean>(false);
  const [disablePassword, setDisablePassword] = useState<string>('');
  const [disableCode, setDisableCode] = useState<string>('');
  const [isDisablingMfa, setIsDisablingMfa] = useState<boolean>(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  // Regenerate Recovery Codes Modal States
  const [showRegenModal, setShowRegenModal] = useState<boolean>(false);
  const [regenPassword, setRegenPassword] = useState<string>('');
  const [regenCode, setRegenCode] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const { showSuccess, showError } = useToast();
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/users');
      return res.data;
    }
  });

  const { data: mappings = [] } = useQuery({
    queryKey: ['mappings'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/reputation/mappings');
      return res.data;
    }
  });

  const handleSaveNotifications = async (userId: string, phoneNumber: string | null, emailAlerts: boolean, smsAlerts: boolean, alertLocations: string[]) => {
    setSavingUserId(userId);
    try {
      await apiClient(`/users/${userId}/notifications`, {
        method: 'PUT',
        body: JSON.stringify({
          phoneNumber,
          emailAlerts,
          smsAlerts,
          alertLocations
        })
      });
      showSuccess('Alert preferences updated successfully');
      refetchUsers();
    } catch (err: any) {
      console.error(err);
      showError('Failed to save alert preferences: ' + err.message);
    } finally {
      setSavingUserId(null);
    }
  };

  const activeSubViewKey = subview || 'organization';
  const meta = subViewTitles[activeSubViewKey] || subViewTitles['organization'];

  const { data: orgData } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any }>('/settings/organization');
      return res.data;
    }
  });

  const { data: clinics = [] } = useQuery({
    queryKey: ['clinics'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/settings/clinics');
      return res.data;
    }
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/settings/providers');
      return res.data;
    }
  });

  const { data: mfaStatus, refetch: refetchMfaStatus, isLoading: isMfaStatusLoading } = useQuery({
    queryKey: ['mfa-status'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: { enabled: boolean; verifiedAt: string | null; remainingRecoveryCodes: number } }>('/auth/mfa/status');
      return res.data;
    }
  });

  const handleStartEnrollment = async () => {
    setShowMfaEnrollModal(true);
    setEnrollStep('LOADING');
    setMfaError(null);
    setVerifyCode('');
    setCopiedCodes(false);

    try {
      const res = await apiClient<{ success: boolean; data: any }>('/auth/mfa/enroll', {
        method: 'POST'
      });
      if (res.success) {
        setEnrollData(res.data);
        setEnrollStep('QR');
      }
    } catch (err: any) {
      setMfaError(err?.message || 'Failed to initialize MFA enrollment');
    }
  };

  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.length !== 6) return;
    setIsVerifyingEnroll(true);
    setMfaError(null);

    try {
      const res = await apiClient<{ success: boolean; recoveryCodes: string[]; message: string }>('/auth/mfa/verify-enrollment', {
        method: 'POST',
        body: JSON.stringify({ code: verifyCode })
      });

      if (res.success) {
        setGeneratedRecoveryCodes(res.recoveryCodes || []);
        setEnrollStep('RECOVERY_CODES');
        refetchMfaStatus();
      }
    } catch (err: any) {
      setMfaError(err?.message || 'Invalid verification code. Please check your authenticator app.');
    } finally {
      setIsVerifyingEnroll(false);
    }
  };

  const handleCopyRecoveryCodes = () => {
    navigator.clipboard.writeText(generatedRecoveryCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDisablingMfa(true);
    setDisableError(null);

    try {
      const res = await apiClient<{ success: boolean; message: string }>('/auth/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: disablePassword,
          code: disableCode || undefined
        })
      });

      if (res.success) {
        setShowDisableModal(false);
        setDisablePassword('');
        setDisableCode('');
        refetchMfaStatus();
      }
    } catch (err: any) {
      setDisableError(err?.message || 'Failed to disable MFA. Verify your current password and code.');
    } finally {
      setIsDisablingMfa(false);
    }
  };

  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegenerating(true);
    setRegenError(null);

    try {
      const res = await apiClient<{ success: boolean; recoveryCodes: string[] }>('/auth/mfa/recovery-codes/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: regenPassword,
          code: regenCode
        })
      });

      if (res.success) {
        setGeneratedRecoveryCodes(res.recoveryCodes || []);
        setShowRegenModal(false);
        setRegenPassword('');
        setRegenCode('');
        setShowMfaEnrollModal(true);
        setEnrollStep('RECOVERY_CODES');
        refetchMfaStatus();
      }
    } catch (err: any) {
      setRegenError(err?.message || 'Failed to regenerate codes. Check your password and code.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Universal Fixed Top Header */}
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
      </div>

      {/* Render Dedicated Submenu Content View */}
      {activeSubViewKey === 'clinics' ? (
        /* Clinics Manager View */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            MSBI Clinic Practice Locations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
            {clinics.map((clinic, i) => (
              <div key={i} className="p-3.5 border border-border-subtle rounded-xl bg-surface-muted space-y-2">
                <span className="font-bold text-primary text-xs sm:text-sm">{clinic.name}</span>
                <p className="text-on-surface-variant">{clinic.address || 'Address not set'}</p>
                <p className="font-bold text-secondary">Physicians: {clinic.providers?.map((p: any) => p.name).join(', ') || 'N/A'}</p>
              </div>
            ))}
            {clinics.length === 0 && (
              <div className="p-3.5 border border-border-subtle rounded-xl bg-surface-muted space-y-2 col-span-3 text-center">
                <p className="text-on-surface-variant">No clinics configured yet.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeSubViewKey === 'providers' ? (
        /* Providers Physician Roster */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Physician & Provider Roster Settings
          </h2>
          <div className="space-y-3 text-xs">
            {providers.map((p, i) => (
              <div key={i} className="p-3.5 border border-border-subtle rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-surface-muted">
                <div>
                  <p className="font-bold text-primary text-xs sm:text-sm">{p.name}</p>
                  <p className="text-[11px] text-on-surface-variant">{p.specialty || 'Specialty N/A'} • NPI: {p.npi || 'N/A'}</p>
                </div>
                <span className="bg-primary-container text-on-primary-container font-bold px-2.5 py-0.5 rounded-full text-[10px] self-start sm:self-auto">
                  Active
                </span>
              </div>
            ))}
            {providers.length === 0 && (
              <div className="p-3.5 border border-border-subtle rounded-xl flex justify-center items-center bg-surface-muted">
                 <p className="text-on-surface-variant">No providers configured yet.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeSubViewKey === 'kpis' ? (
        /* KPI Alert Threshold Settings */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Operational Alert & KPI Threshold Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs">
            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Max Target CPA ($)</label>
              <input type="number" defaultValue="55.00" className="w-full border border-border-subtle rounded-xl p-2.5 bg-surface-muted text-on-surface font-mono font-bold" />
            </div>
            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Min Call Answer Rate Warning (%)</label>
              <input type="number" defaultValue="85.0" className="w-full border border-border-subtle rounded-xl p-2.5 bg-surface-muted text-on-surface font-mono font-bold" />
            </div>
          </div>
        </div>
      ) : activeSubViewKey === 'notifications' ? (
        /* Notification Preferences View */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            System Notification Preferences
          </h2>
          
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="p-4 border border-border-subtle rounded-xl text-center bg-surface-muted">
                <p className="text-xs text-on-surface-variant italic">No system users found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user: any) => (
                  <StaffAlertRow
                    key={user.id}
                    user={user}
                    locations={mappings}
                    onSave={handleSaveNotifications}
                    isSaving={savingUserId === user.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeSubViewKey === 'api-keys' ? (
        /* Master API Keys Manager */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Custom Master API Keys & Webhook Secret
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold uppercase text-on-surface-variant mb-1">Enterprise Master API Key</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="flex-1 bg-surface-muted border border-border-subtle rounded-xl p-2.5 font-data-mono text-xs font-bold text-primary"
                />
                <button
                  onClick={() => setApiKey(`msbi_live_key_${Math.random().toString(36).substring(2, 15)}`)}
                  className="btn-primary-vibrant font-bold px-4 py-2 rounded-xl text-xs cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  Regenerate Key
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubViewKey === 'security' ? (
        /* Security & Two-Factor Authentication (MFA) View */
        <div className="space-y-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mfaStatus?.enabled ? 'bg-status-success/15 text-status-success' : 'bg-primary/10 text-primary'}`}>
                  <span className="material-symbols-outlined text-2xl">
                    {mfaStatus?.enabled ? 'verified_user' : 'shield'}
                  </span>
                </div>
                <div>
                  <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary">
                    Two-Factor Authentication (TOTP)
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Industry standard RFC 6238 time-based one-time password security
                  </p>
                </div>
              </div>

              <div>
                {isMfaStatusLoading ? (
                  <span className="text-xs text-on-surface-variant">Loading status...</span>
                ) : mfaStatus?.enabled ? (
                  <span className="bg-status-success/15 text-status-success font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
                    MFA Enabled & Active
                  </span>
                ) : (
                  <span className="bg-surface-muted text-on-surface-variant font-bold px-3 py-1 rounded-full text-xs">
                    Not Configured
                  </span>
                )}
              </div>
            </div>

            {mfaStatus?.enabled ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-surface-muted border border-border-subtle rounded-xl space-y-1">
                    <span className="text-on-surface-variant font-bold uppercase text-[10px]">Verification Standard</span>
                    <p className="font-bold text-primary text-sm">RFC 6238 TOTP</p>
                  </div>
                  <div className="p-3.5 bg-surface-muted border border-border-subtle rounded-xl space-y-1">
                    <span className="text-on-surface-variant font-bold uppercase text-[10px]">Active Recovery Codes</span>
                    <p className="font-bold text-primary text-sm">{mfaStatus.remainingRecoveryCodes} Unused Codes</p>
                  </div>
                  <div className="p-3.5 bg-surface-muted border border-border-subtle rounded-xl space-y-1">
                    <span className="text-on-surface-variant font-bold uppercase text-[10px]">Last Verified</span>
                    <p className="font-bold text-primary text-sm">
                      {mfaStatus.verifiedAt ? new Date(mfaStatus.verifiedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowRegenModal(true);
                      setRegenError(null);
                      setRegenPassword('');
                      setRegenCode('');
                    }}
                    className="btn-primary-vibrant font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">autorenew</span>
                    Regenerate Recovery Codes
                  </button>

                  <button
                    onClick={() => {
                      setShowDisableModal(true);
                      setDisableError(null);
                      setDisablePassword('');
                      setDisableCode('');
                    }}
                    className="border border-status-error/30 text-status-error hover:bg-status-error/10 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">lock_open</span>
                    Disable Two-Factor Auth
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-on-surface-variant leading-relaxed">
                  Protect your MSBI clinical intelligence portal account with an extra layer of security. In addition to your password, you will be prompted for a 6-digit verification code generated by your authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, or Authy).
                </p>

                <button
                  onClick={handleStartEnrollment}
                  className="btn-primary-vibrant font-bold px-5 py-3 rounded-xl text-xs cursor-pointer shadow-md flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">add_moderator</span>
                  Set Up Two-Factor Authentication
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Organization Profile Settings */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Practice Profile Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs">
            <div>
              <label className="block text-on-surface-variant font-bold uppercase mb-1">Organization Name</label>
              <input
                type="text"
                readOnly
                value={orgData?.name || "Midwest Spine & Brain Institute (MSBI)"}
                className="w-full bg-surface-muted border border-border-subtle rounded-xl p-2.5 font-bold text-primary"
              />
            </div>

            <div>
              <label className="block text-on-surface-variant font-bold uppercase mb-1">Currency & Timezone</label>
              <input
                type="text"
                readOnly
                value={`${orgData?.currency || 'USD'} • ${orgData?.timezone || 'UTC'}`}
                className="w-full bg-surface-muted border border-border-subtle rounded-xl p-2.5 font-medium text-on-surface"
              />
            </div>
          </div>
        </div>
      )}

      {/* MFA Enrollment Modal */}
      {showMfaEnrollModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in duration-150 relative">
            <button
              onClick={() => setShowMfaEnrollModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {enrollStep === 'LOADING' ? (
              <div className="py-12 text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                <p className="text-xs text-on-surface-variant font-medium">Generating secure encryption keys...</p>
              </div>
            ) : enrollStep === 'QR' && enrollData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
                  <span className="material-symbols-outlined text-primary text-xl">qr_code_scanner</span>
                  <h3 className="font-headline-sm text-base font-bold text-primary">Scan QR Code</h3>
                </div>

                <p className="text-xs text-on-surface-variant">
                  Open your authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, or Authy) and scan this QR code:
                </p>

                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-border-subtle">
                  <img src={enrollData.qrCode} alt="TOTP QR Code" className="w-48 h-48 rounded-lg" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase">Manual Entry Key:</span>
                  <div className="p-2 bg-surface-muted border border-border-subtle rounded-xl font-mono text-xs font-bold text-center select-all text-primary">
                    {enrollData.secret}
                  </div>
                </div>

                {mfaError && (
                  <div className="p-3 bg-status-error/10 border border-status-error/30 rounded-xl text-status-error text-xs font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {mfaError}
                  </div>
                )}

                <form onSubmit={handleVerifyEnrollment} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                      Enter 6-Digit Code from App
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full border border-border-subtle rounded-xl p-3 text-center text-lg tracking-[0.4em] font-mono font-bold bg-surface-muted text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="000000"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingEnroll || verifyCode.length !== 6}
                    className="w-full btn-primary-vibrant font-bold py-3 rounded-xl text-xs cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>{isVerifyingEnroll ? 'Verifying...' : 'Verify & Enable 2FA'}</span>
                    <span className="material-symbols-outlined text-base">check</span>
                  </button>
                </form>
              </div>
            ) : enrollStep === 'RECOVERY_CODES' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
                  <span className="material-symbols-outlined text-status-success text-xl">verified</span>
                  <h3 className="font-headline-sm text-base font-bold text-primary">2FA Enabled & Recovery Codes</h3>
                </div>

                <div className="p-3.5 bg-status-warning/10 border border-status-warning/30 rounded-xl text-xs text-on-surface space-y-1">
                  <p className="font-bold text-status-warning flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">warning</span>
                    Save These One-Time Recovery Codes
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    If you lose access to your phone, each code can be used once to log in. These codes will NOT be displayed again.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-surface-muted border border-border-subtle rounded-xl">
                  {generatedRecoveryCodes.map((code, idx) => (
                    <div key={idx} className="font-mono text-xs font-bold text-center py-1 px-2 bg-surface-container-lowest rounded-lg border border-border-subtle text-primary">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyRecoveryCodes}
                    className="flex-1 border border-border-subtle bg-surface-muted hover:bg-surface-container-lowest font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedCodes ? 'check' : 'content_copy'}
                    </span>
                    {copiedCodes ? 'Copied to Clipboard!' : 'Copy All Codes'}
                  </button>

                  <button
                    onClick={() => setShowMfaEnrollModal(false)}
                    className="flex-1 btn-primary-vibrant font-bold py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1"
                  >
                    I've Saved My Codes
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Disable MFA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in duration-150 relative space-y-4">
            <button
              onClick={() => setShowDisableModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
              <span className="material-symbols-outlined text-status-error text-xl">lock_open</span>
              <h3 className="font-headline-sm text-base font-bold text-primary">Disable Two-Factor Auth</h3>
            </div>

            <p className="text-xs text-on-surface-variant">
              To disable 2FA, please verify your identity by entering your current account password and a current 6-digit authenticator code:
            </p>

            {disableError && (
              <div className="p-3 bg-status-error/10 border border-status-error/30 rounded-xl text-status-error text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {disableError}
              </div>
            )}

            <form onSubmit={handleDisableMfa} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full border border-border-subtle rounded-xl p-2.5 text-xs bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">6-Digit Code or Recovery Code</label>
                <input
                  type="text"
                  required
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  className="w-full border border-border-subtle rounded-xl p-2.5 text-xs font-mono bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="123456 or XXXX-XXXX"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="flex-1 border border-border-subtle bg-surface-muted font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDisablingMfa || !disablePassword}
                  className="flex-1 bg-status-error text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isDisablingMfa ? 'Disabling...' : 'Confirm Deactivation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regenerate Recovery Codes Modal */}
      {showRegenModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in duration-150 relative space-y-4">
            <button
              onClick={() => setShowRegenModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
              <span className="material-symbols-outlined text-primary text-xl">autorenew</span>
              <h3 className="font-headline-sm text-base font-bold text-primary">Regenerate Recovery Codes</h3>
            </div>

            <p className="text-xs text-on-surface-variant">
              Regenerating recovery codes will immediately invalidate all previously issued recovery codes. Enter your password and 6-digit code:
            </p>

            {regenError && (
              <div className="p-3 bg-status-error/10 border border-status-error/30 rounded-xl text-status-error text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {regenError}
              </div>
            )}

            <form onSubmit={handleRegenerateCodes} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={regenPassword}
                  onChange={(e) => setRegenPassword(e.target.value)}
                  className="w-full border border-border-subtle rounded-xl p-2.5 text-xs bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">6-Digit Authenticator Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={regenCode}
                  onChange={(e) => setRegenCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-border-subtle rounded-xl p-2.5 text-xs font-mono bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegenModal(false)}
                  className="flex-1 border border-border-subtle bg-surface-muted font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegenerating || !regenPassword || regenCode.length !== 6}
                  className="flex-1 btn-primary-vibrant font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isRegenerating ? 'Generating...' : 'Generate New Codes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
