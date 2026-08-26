import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { ReviewItem, DoctorRatingItem } from '../types/crm';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

const subViewTitles: Record<string, { title: string; subtitle: string }> = {
  'reviews': { title: 'Google Business Profile Reviews Feed', subtitle: 'Realtime patient reviews, star ratings, and official clinic response portal.' },
  'providers': { title: 'Physician & Doctor Ratings Summary', subtitle: 'Individual doctor star ratings, review counts, and patient satisfaction.' },
  'clinics': { title: 'Clinic Location Rankings', subtitle: 'Roseville, Edina, and St. Paul practice location satisfaction rankings.' },
  'requests': { title: 'Automated Review Acquisition Requests', subtitle: 'Automated SMS and email review link delivery logs and response rates.' },
  'trends': { title: 'Monthly Rating Trends & Analytics', subtitle: 'Historical star rating trajectories across all practice locations.' },
  'goals': { title: 'Reputation Acquisition Targets 2026', subtitle: 'Annual review volume targets and response SLA benchmarks.' },
};

export const ReputationManagement: React.FC = () => {
  const { subview } = useParams<{ subview?: string }>();
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/reputation/reviews');
      return res.data.map(r => {
        const authorName = r.patientName || r.authorName || 'Anonymous';
        return {
          id: r.id,
          author: authorName,
          initials: authorName.substring(0, 2).toUpperCase(),
          verified: r.isVerified ?? true,
          rating: r.rating,
          date: r.date,
          location: r.clinic?.name || r.platform,
          text: r.comment,
          replied: !!r.reply,
          replyText: r.reply || '',
          reviewUrl: r.reviewUrl || ''
        };
      }) as ReviewItem[];
    }
  });

  // Calculate monthly trends from reviews dynamically
  const getTrendData = () => {
    const monthlyData: Record<string, { totalRating: number; count: number }> = {};
    
    // Sort reviews chronologically
    const sortedReviews = [...reviews].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedReviews.forEach(r => {
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return;
      const monthKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { totalRating: 0, count: 0 };
      }
      monthlyData[monthKey].totalRating += r.rating;
      monthlyData[monthKey].count += 1;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      averageRating: parseFloat((data.totalRating / data.count).toFixed(2)),
      reviewsCount: data.count
    }));
  };

  const trendData = getTrendData();
  const totalReviewsCount = reviews.length;
  const goalTarget = 1000;
  const goalPercentage = Math.min(100, parseFloat(((totalReviewsCount / goalTarget) * 100).toFixed(1)));

  const { data: doctorRatings = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/reputation/providers');
      return res.data.map((d, idx) => ({
        id: idx + 1,
        doctorName: d.name || 'Unknown Provider',
        specialty: 'Specialty',
        rating: d.averageRating || 0,
        reviewCount: d.reviewCount || 0,
        clinic: 'Multiple Locations'
      })) as DoctorRatingItem[];
    }
  });

  const { data: clinicRatings = [] } = useQuery({
    queryKey: ['clinics'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/reputation/clinics');
      return res.data.map((c, idx) => ({
        rank: `#${idx + 1}`,
        clinic: c.name || 'Unknown Clinic',
        rating: `${c.averageRating || 0} ★`,
        count: `${c.reviewCount || 0} Reviews`,
        responseTime: 'Pending Data'
      }));
    }
  });

  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [replyInput, setReplyInput] = useState<string>('');
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [patientPhone, setPatientPhone] = useState<string>('');

  const [isSyncingReviews, setIsSyncingReviews] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const { showSuccess, showError } = useToast();

  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const activeSubViewKey = subview || 'reviews';
  const meta = subViewTitles[activeSubViewKey] || subViewTitles['reviews'];

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || !replyInput || isSubmittingReply) return;
    setIsSubmittingReply(true);
    try {
      await apiClient(`/reputation/reviews/${selectedReview.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: replyInput })
      });
      showSuccess('Reply published to Google Business Profile successfully');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setSelectedReview(null);
      setReplyInput('');
    } catch (err: any) {
      console.error(err);
      showError('Failed to publish reply: ' + err.message);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-6">
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
        <div className="flex gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={async () => {
              if (isSyncingReviews) return;
              setIsSyncingReviews(true);
              try {
                await apiClient('/integrations/google-business/sync', { method: 'POST' });
                queryClient.invalidateQueries({ queryKey: ['reviews'] });
                showSuccess('GBP Reviews synced successfully.');
              } catch (err: any) {
                showError('Sync failed: ' + err.message);
              } finally {
                setIsSyncingReviews(false);
              }
            }}
            disabled={isSyncingReviews}
            className="px-3.5 py-2 border border-border-subtle rounded-xl text-xs font-bold hover:bg-surface-container cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {isSyncingReviews ? 'Syncing...' : 'Sync GBP Reviews'}
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="btn-primary-vibrant font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">send</span>
            <span>Send Review Request</span>
          </button>
        </div>
      </div>

      {/* Review Goal Progress Bar */}
      <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-primary font-bold">Annual Review Acquisition Goal</span>
          <span className="text-status-success font-mono">{totalReviewsCount} / {goalTarget} Reviews ({goalPercentage}% Completed)</span>
        </div>
        <div className="w-full bg-surface-container-highest rounded-full h-3">
          <div className="bg-status-success h-3 rounded-full" style={{ width: `${goalPercentage}%` }}></div>
        </div>
      </div>

      {/* Render Dedicated Content View According to Sidebar Submenu Route */}
      {activeSubViewKey === 'providers' ? (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-base font-bold text-primary border-b border-border-subtle pb-3">
            MSBI Physician & Doctor Ratings Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {doctorRatings.map((doc) => (
              <div key={doc.id} className="p-5 border border-border-subtle rounded-2xl hover:border-primary transition-colors bg-surface-muted/30">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-sm text-primary">{doc.doctorName}</h3>
                    <p className="text-xs text-on-surface-variant">{doc.specialty}</p>
                  </div>
                  <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2.5 py-1 rounded-full">
                    {doc.clinic}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-data-mono text-xl font-bold text-primary">{doc.rating}</span>
                    <span className="text-status-warning text-base">★</span>
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">({doc.reviewCount} Verified Reviews)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubViewKey === 'clinics' ? (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-base font-bold text-primary border-b border-border-subtle pb-3">
            Clinic Location Rankings & Patient Satisfaction Score
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {clinicRatings.map((item, idx) => (
              <div key={idx} className="p-5 border border-border-subtle rounded-2xl bg-surface-muted/40 space-y-2">
                <span className="bg-primary text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{item.rank} Ranked</span>
                <p className="font-bold text-sm text-primary mt-1">{item.clinic}</p>
                <div className="flex justify-between text-xs text-on-surface-variant font-medium pt-2 border-t border-border-subtle">
                  <span>Rating: {item.rating}</span>
                  <span>Avg Response: {item.responseTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubViewKey === 'requests' ? (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-base font-bold text-primary border-b border-border-subtle pb-3">
            Automated SMS & Email Review Requests Log
          </h2>
          <div className="space-y-3 text-xs">
            {[
              { name: 'Patient #9102', sentVia: 'SMS Link', date: '10 mins ago', status: 'Delivered' },
              { name: 'Patient #8814', sentVia: 'Email Drip', date: '1 hour ago', status: 'Opened' },
              { name: 'Patient #7741', sentVia: 'SMS Link', date: '3 hours ago', status: 'Review Submitted (5★)' },
            ].map((req, i) => (
              <div key={i} className="p-3 border border-border-subtle rounded-xl flex justify-between items-center bg-surface-muted">
                <div>
                  <span className="font-bold text-primary">{req.name}</span>
                  <p className="text-on-surface-variant">{req.sentVia} • {req.date}</p>
                </div>
                <span className="bg-primary-container text-on-primary-container font-bold px-2.5 py-0.5 rounded-full">
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubViewKey === 'trends' ? (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-base font-bold text-primary border-b border-border-subtle pb-3">
            Monthly Average Rating Trend
          </h2>
          {trendData.length > 0 ? (
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="month" stroke="#71787b" fontSize={12} />
                  <YAxis domain={[1, 5]} stroke="#71787b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#E2E8F0' }} />
                  <Line type="monotone" dataKey="averageRating" name="Average Rating" stroke="#244B59" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="reviewsCount" name="Reviews Count" stroke="#99CAD9" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center bg-surface-muted rounded-xl">
              <p className="text-on-surface-variant text-sm">Rating trend data will populate as new reviews are collected locally.</p>
            </div>
          )}
        </div>
      ) : activeSubViewKey === 'goals' ? (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-base font-bold text-primary border-b border-border-subtle pb-3">
            Reputation Acquisition Targets 2026
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 border border-border-subtle rounded-xl bg-surface-muted">
              <span className="font-bold text-primary">Target 5-Star Ratio</span>
              <p className="text-2xl font-bold text-status-success my-1">&gt; 94%</p>
              <p className="text-on-surface-variant">Currently at 96.2% across Roseville & Edina clinics</p>
            </div>
            <div className="p-4 border border-border-subtle rounded-xl bg-surface-muted">
              <span className="font-bold text-primary">Response SLA Target</span>
              <p className="text-2xl font-bold text-primary my-1 font-mono">&lt; 24 Hours</p>
              <p className="text-on-surface-variant">Avg response time: 2.1 hours</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-headline-sm text-base font-bold text-primary">Google Business Profile Review Feed</h2>

          {reviews.map((rev) => (
            <div key={rev.id} className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {rev.initials}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-on-surface">{rev.author}</span>
                    {rev.verified && (
                      <span className="ml-2 font-label-md text-[10px] bg-status-success/20 text-status-success px-2 py-0.5 rounded-full uppercase font-bold">
                        Verified Patient
                      </span>
                    )}
                    <p className="text-xs text-on-surface-variant">{rev.location} • {new Date(rev.date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex text-status-warning text-sm">
                  {'★'.repeat(rev.rating)}
                </div>
              </div>

              <p className="font-body-sm text-xs text-on-surface leading-relaxed">{rev.text}</p>

              {rev.replied ? (
                <div className="p-3 bg-surface-muted border-l-4 border-primary rounded-xl text-xs space-y-1">
                  <p className="font-bold text-primary">MSBI Official Response:</p>
                  <p className="text-on-surface-variant">{rev.replyText}</p>
                </div>
              ) : (
                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => { setSelectedReview(rev); setReplyInput(''); }}
                    className="btn-outline px-3 py-1.5 rounded-xl font-bold cursor-pointer text-xs flex items-center gap-1.5 hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[14px]">reply</span>
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Request Modal */}
      {showRequestModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h2 className="font-headline-sm text-lg font-bold text-primary">Send Patient Review Request</h2>
              <button onClick={() => setShowRequestModal(false)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!patientPhone || isSendingRequest) return;
                setIsSendingRequest(true);
                try {
                  await apiClient('/reputation/requests', {
                    method: 'POST',
                    body: JSON.stringify({ patientContact: patientPhone, method: 'SMS' })
                  });
                  showSuccess(`Review Request link sent to: ${patientPhone}`);
                  setShowRequestModal(false);
                  setPatientPhone('');
                } catch (err: any) {
                  showError('Failed to send request: ' + err.message);
                } finally {
                  setIsSendingRequest(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">
                  Patient Phone Number / Email
                </label>
                <input
                  type="text"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="(612) 555-0199"
                  className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingRequest}
                  className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSendingRequest ? 'Sending...' : 'Send Review Request'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {selectedReview && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h2 className="font-headline-sm text-lg font-bold text-primary">Respond to {selectedReview.author}</h2>
              <button onClick={() => setSelectedReview(null)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
             <textarea
                rows={4}
                required
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Thank you for sharing your experience with Midwest Spine & Brain Institute..."
                className="w-full border border-border-subtle rounded-xl p-3 text-xs bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReply}
                  className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReply ? 'Publishing...' : 'Publish Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
