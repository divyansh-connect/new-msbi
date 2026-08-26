import React, { useState } from 'react';

export const ClinicalIntelligenceSystem: React.FC = () => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold">
              Clinical Intelligence System
            </h1>
          </div>
          <p className="font-body-md text-on-surface-variant">
            Precision clinical lead scoring, surgery path conversion, and physician referral analytics.
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="bg-surface-container-lowest border border-border-subtle rounded-xl px-3 py-2 font-body-sm text-xs font-semibold text-on-surface-variant focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="All">All Clinical Programs</option>
            <option value="Spine">Spine Surgery Program</option>
            <option value="Brain">Brain & Neurosurgery</option>
          </select>
        </div>
      </div>

      {/* Clinical KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm">
          <span className="font-label-md text-xs uppercase text-on-surface-variant font-bold">Clinical Triage Rate</span>
          <div className="font-headline-md text-headline-lg text-primary font-bold my-1">94.2%</div>
          <p className="text-xs text-status-success font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">verified</span> Verified MRI Pre-Screened
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm">
          <span className="font-label-md text-xs uppercase text-on-surface-variant font-bold">Surgery Path Conversion</span>
          <div className="font-headline-md text-headline-lg text-primary font-bold my-1">38.6%</div>
          <p className="text-xs text-status-success font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span> +4.1% vs Q2 benchmark
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-5 shadow-sm">
          <span className="font-label-md text-xs uppercase text-on-surface-variant font-bold">Physician Referral Vol</span>
          <div className="font-headline-md text-headline-lg text-primary font-bold my-1">142 Cases</div>
          <p className="text-xs text-on-surface-variant font-bold">Active MD Network</p>
        </div>

        <div className="bg-primary text-on-primary border border-primary-container rounded-2xl p-5 shadow-sm">
          <span className="font-label-md text-xs uppercase text-primary-fixed font-bold">Clinical Quality Score</span>
          <div className="font-headline-md text-headline-lg font-bold my-1">98 / 100</div>
          <p className="text-xs text-primary-fixed font-bold">Enterprise Clinical Standard</p>
        </div>
      </div>

      {/* High-Density Procedure Metrics Table */}
      <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle flex justify-between items-center bg-surface-muted/50">
          <div>
            <h2 className="font-headline-sm text-base font-bold text-primary">Procedure Category Conversion</h2>
            <p className="text-xs text-on-surface-variant">Patient consults to surgical scheduling breakdown</p>
          </div>
          <span className="bg-primary-container text-on-primary-container font-label-md text-[11px] px-3 py-1 rounded-full font-bold">
            MSBI Protocol v4
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4">Procedure Program</th>
                <th className="py-3 px-4">Inbound Consults</th>
                <th className="py-3 px-4">MRI Verified</th>
                <th className="py-3 px-4">Scheduled Surgeries</th>
                <th className="py-3 px-4">Conversion %</th>
                <th className="py-3 px-4">Quality Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {[
                { name: 'Minimally Invasive Lumbar Fusion', consults: 310, mri: 285, scheduled: 124, conv: '40.0%', score: '96/100' },
                { name: 'Cervical Disc Replacement', consults: 245, mri: 230, scheduled: 98, conv: '40.0%', score: '94/100' },
                { name: 'Trigeminal Neuralgia / Brain', consults: 112, mri: 108, scheduled: 42, conv: '37.5%', score: '98/100' },
                { name: 'Sciatica & Spinal Stenosis', consults: 410, mri: 360, scheduled: 132, conv: '32.2%', score: '90/100' },
              ].map((p, idx) => (
                <tr key={idx} className="hover:bg-surface-muted transition-colors">
                  <td className="py-3.5 px-4 font-bold text-primary">{p.name}</td>
                  <td className="py-3.5 px-4 font-data-mono">{p.consults}</td>
                  <td className="py-3.5 px-4 font-data-mono">{p.mri}</td>
                  <td className="py-3.5 px-4 font-data-mono text-primary font-bold">{p.scheduled}</td>
                  <td className="py-3.5 px-4 font-data-mono font-bold text-status-success">{p.conv}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-surface-container text-primary font-bold px-2 py-0.5 rounded text-[10px]">
                      {p.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
