import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { VendorItem } from '../types/crm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { sanitizeUrl } from '../utils/urlSecurity';

const subViewTitles: Record<string, { title: string; subtitle: string }> = {
  'all': { title: 'Partner Vendors Directory', subtitle: 'Overview of external agencies, SaaS partners, and marketing contractors.' },
  'contacts': { title: 'Agency Primary Contacts Directory', subtitle: 'Account executive contacts, phone numbers, and emergency escalation emails.' },
  'contracts': { title: 'Executed Partner Master Contracts', subtitle: 'Active agency contracts, MSA terms, and downloadable PDF agreements.' },
  'renewals': { title: 'Upcoming Contract Renewals Schedule', subtitle: 'Alerts and timeline for agency renewals expiring within 30-90 days.' },
  'invoices': { title: 'Vendor Invoices & Payment Ledger', subtitle: 'Recent agency invoices, monthly retainers, and approval status.' },
  'performance': { title: 'Vendor SLA Performance Scores', subtitle: 'Quality metrics, uptime SLAs, and lead delivery scorecards.' },
};

export const VendorManagement: React.FC = () => {
  const { subview } = useParams<{ subview?: string }>();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newVendorName, setNewVendorName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Ad Agency');

  // Form states for modals
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactVendorId, setContactVendorId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [contractVendorId, setContactContractId] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractRenewalDate, setContractRenewalDate] = useState('');
  const [contractDocUrl, setContractDocUrl] = useState('');

  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [invoiceVendorId, setInvoiceVendorId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<'Paid' | 'Pending' | 'Overdue'>('Pending');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceDocUrl, setInvoiceDocUrl] = useState('');

  const [actionModal, setActionModal] = useState<{ type: 'sla' | 'renew' | 'initiate', vendorName: string; details?: string } | null>(null);

  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingContract, setIsSavingContract] = useState(false);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [isTogglingInvoice, setIsTogglingInvoice] = useState(false);

  const activeSubViewKey = subview || 'all';
  const meta = subViewTitles[activeSubViewKey] || subViewTitles['all'];

  // Fetch all vendors with nested relations (expenses, contacts, contracts, invoices)
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/vendors');
      return res.data.map((v: any) => {
        // Calculate annual spend sum from actual Expense records
        const totalExpenses = (v.expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
        
        // Find latest contract to determine renewal date
        let latestContract = null;
        if (v.contracts && v.contracts.length > 0) {
          latestContract = [...v.contracts].sort((a, b) => new Date(b.renewalDate).getTime() - new Date(a.renewalDate).getTime())[0];
        }
        
        let daysLeft = 0;
        let urgent = false;
        if (latestContract) {
          const diffTime = new Date(latestContract.renewalDate).getTime() - Date.now();
          daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          urgent = daysLeft <= 90 && daysLeft >= 0;
        }

        const primaryContact = v.contacts && v.contacts.length > 0 ? v.contacts[0] : null;
        
        return {
          id: v.id,
          name: v.name,
          category: v.category,
          initials: v.name.substring(0, 2).toUpperCase(),
          score: v.performanceScore !== null ? v.performanceScore : 0,
          spend: totalExpenses > 0 ? `$${totalExpenses.toLocaleString()}` : '$0',
          renewalDate: latestContract ? new Date(latestContract.renewalDate).toLocaleDateString() : 'No contract available',
          daysLeft,
          urgent,
          status: latestContract ? (daysLeft < 0 ? 'Expired' : 'Active') : 'Inactive',
          contactName: primaryContact ? primaryContact.name : 'No contact available',
          contactEmail: primaryContact ? primaryContact.email : 'No email available',
          contacts: v.contacts || [],
          contracts: v.contracts || [],
          invoices: v.invoices || [],
          expenses: v.expenses || []
        };
      }) as any[];
    }
  });

  const createMutation = useMutation({
    mutationFn: (newVendor: any) => apiClient('/vendors', {
      method: 'POST',
      body: JSON.stringify(newVendor)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setShowAddModal(false);
      setNewVendorName('');
      setNewCategory('Ad Agency');
      showSuccess('Vendor added successfully!');
    },
    onError: (err: any) => {
      showError('Failed to add vendor: ' + err.message);
    }
  });

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName || createMutation.isPending) return;
    createMutation.mutate({
      name: newVendorName,
      category: newCategory,
      performanceScore: 0
    });
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactVendorId || !contactName || isSavingContact) return;

    setIsSavingContact(true);
    try {
      await apiClient(`/vendors/${contactVendorId}/contacts`, {
        method: 'POST',
        body: JSON.stringify({
          name: contactName,
          email: contactEmail || null,
          phone: contactPhone || null
        })
      });
      showSuccess('Contact added successfully!');
      setShowAddContactModal(false);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    } catch (err: any) {
      showError('Failed to add contact: ' + err.message);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractVendorId || !contractValue || !contractStartDate || !contractRenewalDate || isSavingContract) return;

    setIsSavingContract(true);
    try {
      await apiClient(`/vendors/${contractVendorId}/contracts`, {
        method: 'POST',
        body: JSON.stringify({
          value: parseFloat(contractValue),
          startDate: new Date(contractStartDate).toISOString(),
          renewalDate: new Date(contractRenewalDate).toISOString(),
          documentUrl: contractDocUrl || null
        })
      });
      showSuccess('Contract added successfully!');
      setShowAddContractModal(false);
      setContactContractId('');
      setContractValue('');
      setContractStartDate('');
      setContractRenewalDate('');
      setContractDocUrl('');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    } catch (err: any) {
      showError('Failed to add contract: ' + err.message);
    } finally {
      setIsSavingContract(false);
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceVendorId || !invoiceAmount || !invoiceDueDate || isSavingInvoice) return;

    setIsSavingInvoice(true);
    try {
      await apiClient(`/vendors/${invoiceVendorId}/invoices`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(invoiceAmount),
          status: invoiceStatus,
          dueDate: new Date(invoiceDueDate).toISOString(),
          documentUrl: invoiceDocUrl || null
        })
      });
      showSuccess('Invoice added successfully!');
      setShowAddInvoiceModal(false);
      setInvoiceVendorId('');
      setInvoiceAmount('');
      setInvoiceStatus('Pending');
      setInvoiceDueDate('');
      setInvoiceDocUrl('');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    } catch (err: any) {
      showError('Failed to add invoice: ' + err.message);
    } finally {
      setIsSavingInvoice(false);
    }
  };

  const handleToggleInvoiceStatus = async (invoiceId: string, currentStatus: string) => {
    if (isTogglingInvoice) return;
    const nextStatusMap: Record<string, 'Paid' | 'Pending' | 'Overdue'> = {
      'Pending': 'Paid',
      'Paid': 'Overdue',
      'Overdue': 'Pending'
    };
    const nextStatus = nextStatusMap[currentStatus] || 'Pending';

    setIsTogglingInvoice(true);
    try {
      await apiClient(`/vendors/invoices/${invoiceId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    } catch (err: any) {
      showError('Failed to update invoice status: ' + err.message);
    } finally {
      setIsTogglingInvoice(false);
    }
  };

  // Flatten helper lists for sub-menus
  const allContacts = vendors.flatMap(v => 
    (v.contacts || []).map((c: any) => ({
      contactId: c.id,
      vendorName: v.name,
      category: v.category,
      contactName: c.name,
      contactEmail: c.email || 'N/A',
      contactPhone: c.phone || 'N/A',
      score: v.score
    }))
  );

  const allContracts = vendors.flatMap(v => 
    (v.contracts || []).map((c: any) => ({
      contractId: c.id,
      vendorName: v.name,
      category: v.category,
      value: c.value,
      startDate: c.startDate,
      renewalDate: c.renewalDate,
      documentUrl: c.documentUrl,
      score: v.score
    }))
  );

  const allRenewals = vendors.flatMap(v => 
    (v.contracts || []).map((c: any) => {
      const diffTime = new Date(c.renewalDate).getTime() - Date.now();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const status = daysLeft < 0 ? 'Expired' : daysLeft <= 30 ? 'Due Soon' : 'Upcoming';
      const urgent = daysLeft <= 90 && daysLeft >= 0;
      
      return {
        contractId: c.id,
        vendorName: v.name,
        renewalDate: c.renewalDate,
        daysLeft,
        status,
        urgent
      };
    })
  ).sort((a, b) => a.daysLeft - b.daysLeft);

  const allInvoices = vendors.flatMap(v => 
    (v.invoices || []).map((inv: any) => ({
      invoiceId: inv.id,
      vendorName: v.name,
      amount: inv.amount,
      dueDate: inv.dueDate,
      status: inv.status,
      documentUrl: inv.documentUrl
    }))
  ).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Header */}
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
        <div className="flex gap-2 self-start sm:self-auto">
          {activeSubViewKey === 'contacts' && (
            <button
              onClick={() => setShowAddContactModal(true)}
              className="btn-primary-vibrant font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">add_moderator</span>
              <span>Add Contact</span>
            </button>
          )}
          {activeSubViewKey === 'contracts' && (
            <button
              onClick={() => setShowAddContractModal(true)}
              className="btn-primary-vibrant font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">text_snippet</span>
              <span>Add Contract</span>
            </button>
          )}
          {activeSubViewKey === 'invoices' && (
            <button
              onClick={() => setShowAddInvoiceModal(true)}
              className="btn-primary-vibrant font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              <span>Add Invoice</span>
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary-vibrant font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">add_business</span>
            <span>Add New Vendor</span>
          </button>
        </div>
      </div>

      {/* Render Dedicated Submenu Content View */}
      {activeSubViewKey === 'contacts' ? (
        /* Primary Contacts View with Responsive Scroll Wrapper */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-border-subtle">
            <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary">Agency Primary Contacts</h2>
          </div>
          <div className="overflow-x-auto w-full no-scrollbar">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                <tr>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Vendor</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Category</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Contact Person</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Email</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Phone</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Vendor SLA Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {allContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-on-surface-variant font-medium">No vendor contacts available.</td>
                  </tr>
                ) : (
                  allContacts.map((c, idx) => (
                    <tr key={idx} className="hover:bg-surface-muted transition-colors">
                      <td className="py-3 px-3 sm:px-4 font-bold text-primary whitespace-nowrap">{c.vendorName}</td>
                      <td className="py-3 px-3 sm:px-4 text-on-surface-variant whitespace-nowrap">{c.category}</td>
                      <td className="py-3 px-3 sm:px-4 font-semibold text-on-surface whitespace-nowrap">{c.contactName}</td>
                      <td className="py-3 px-3 sm:px-4 text-secondary font-medium whitespace-nowrap">{c.contactEmail}</td>
                      <td className="py-3 px-3 sm:px-4 text-on-surface-variant whitespace-nowrap">{c.contactPhone}</td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <span className="bg-status-success/20 text-status-success font-bold px-2.5 py-0.5 rounded text-[10px]">
                          {c.score}/100
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeSubViewKey === 'performance' ? (
        /* Performance Audit Log */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Vendor SLA Performance Scores & Audit Log
          </h2>
          <div className="space-y-3 text-xs">
            {vendors.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant font-medium">No vendors available.</div>
            ) : (
              vendors.map((v) => (
                <div key={v.id} className="p-3.5 border border-border-subtle rounded-xl space-y-1.5 bg-surface-muted/30">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs sm:text-sm text-primary">{v.name}</span>
                    <span className="font-data-mono font-bold text-status-success">{v.score} / 10 Score</span>
                  </div>
                  <p className="text-on-surface-variant text-xs">Detailed SLA metrics unavailable</p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeSubViewKey === 'contracts' ? (
        /* Master Contracts View */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Executed Partner Contracts & Legal Documents
          </h2>
          <div className="space-y-3 text-xs">
            {allContracts.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant font-medium">No contracts available.</div>
            ) : (
              allContracts.map((c, idx) => (
                <div key={idx} className="p-3.5 border border-border-subtle rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-surface-muted">
                  <div>
                    <p className="font-bold text-primary text-xs sm:text-sm">{c.vendorName} — Master Contract Agreement</p>
                    <p className="text-[11px] text-on-surface-variant">
                      Value: ${Number(c.value).toLocaleString()} | Effective: {new Date(c.startDate).toLocaleDateString()} • Expires: {new Date(c.renewalDate).toLocaleDateString()}
                    </p>
                  </div>
                  {c.documentUrl ? (
                    <a
                      href={sanitizeUrl(c.documentUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-surface-container text-primary font-bold rounded-lg hover:bg-surface-container-high cursor-pointer flex items-center gap-1 self-start sm:self-auto whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span> Open Document
                    </a>
                  ) : (
                    <span className="px-3 py-1.5 text-on-surface-variant font-semibold select-none self-start sm:self-auto italic text-[11px]">
                      No document available
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeSubViewKey === 'renewals' ? (
        /* Renewals Schedule View */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Upcoming Contract Renewals Schedule
          </h2>
          <div className="space-y-3 text-xs">
            {allRenewals.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant font-medium">No upcoming contract renewals.</div>
            ) : (
              allRenewals.map((r, idx) => (
                <div key={idx} className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 ${r.urgent ? 'bg-status-warning/10 border-status-warning/40' : 'bg-surface-muted border-border-subtle'}`}>
                  <div>
                    <span className="font-bold text-primary text-xs sm:text-sm">{r.vendorName}</span>
                    <p className="text-on-surface-variant text-[11px]">
                      Renewal Date: {new Date(r.renewalDate).toLocaleDateString()} ({r.daysLeft < 0 ? 'Expired' : `${r.daysLeft} days remaining`})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.status === 'Expired' ? 'bg-status-error/20 text-status-error' : r.status === 'Due Soon' ? 'bg-status-warning/20 text-status-warning' : 'bg-status-success/20 text-status-success'
                    }`}>
                      {r.status}
                    </span>
                    <button
                      onClick={() => setActionModal({ 
                        type: 'initiate', 
                        vendorName: r.vendorName,
                        details: `Contract ID: ${r.contractId.substring(0,8)} | Renewal Date: ${new Date(r.renewalDate).toLocaleDateString()} (${r.daysLeft} days remaining)`
                      })}
                      className="btn-primary-vibrant text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      Initiate Renewal
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeSubViewKey === 'invoices' ? (
        /* Invoices Ledger View */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Active Agency Contracts & Recent Invoices
          </h2>
          <div className="space-y-3 text-xs font-medium">
            {allInvoices.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant font-medium">No invoices available.</div>
            ) : (
              allInvoices.map((inv, idx) => (
                <div key={idx} className="p-3.5 border border-border-subtle rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 hover:bg-surface-muted transition-colors">
                  <div>
                    <p className="font-bold text-primary text-xs sm:text-sm">{inv.vendorName}</p>
                    <p className="text-on-surface-variant text-[11px]">Invoice ID: {inv.invoiceId.substring(0, 8)} • Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex sm:flex-row justify-between sm:text-right items-center gap-3 w-full sm:w-auto">
                    <span className="font-data-mono font-bold text-xs sm:text-sm text-on-surface">${Number(inv.amount).toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      {inv.documentUrl ? (
                        <a href={sanitizeUrl(inv.documentUrl)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px] font-bold">
                          Document
                        </a>
                      ) : (
                        <span className="text-on-surface-variant/60 italic text-[10px]">No PDF</span>
                      )}
                      <button
                        onClick={() => handleToggleInvoiceStatus(inv.invoiceId, inv.status)}
                        title="Click to toggle status"
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded cursor-pointer transition-transform active:scale-95 ${
                          inv.status === 'Paid' ? 'bg-status-success/20 text-status-success' : inv.status === 'Overdue' ? 'bg-status-error/20 text-status-error' : 'bg-status-warning/20 text-status-warning'
                        }`}
                      >
                        {inv.status}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Default Vendor Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className={`bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between relative transition-all ${
                vendor.urgent ? 'border-2 border-status-warning' : 'border border-border-subtle hover:border-secondary'
              }`}
            >
              {vendor.urgent && (
                <div className="absolute top-0 right-0 bg-status-warning text-white font-label-md text-[10px] px-2 py-0.5 rounded-bl-xl flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[11px]">schedule</span> RENEWS IN {vendor.daysLeft} DAYS
                </div>
              )}

              <div className="p-4 sm:p-5 border-b border-border-subtle">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-headline-sm text-sm sm:text-base text-primary font-bold">{vendor.name}</h3>
                    <span className="inline-block px-2.5 py-0.5 bg-surface-container text-on-surface-variant font-label-md text-[10px] sm:text-[11px] rounded-full font-bold mt-1">
                      {vendor.category}
                    </span>
                  </div>
                  <div className="h-9 w-9 sm:h-10 sm:w-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-inner shrink-0 ml-2">
                    {vendor.initials}
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-surface-muted/50 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-medium">Performance SLA Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 sm:w-20 h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-status-success rounded-full"
                        style={{ width: `${Math.min(100, vendor.score * 10)}%` }}
                      ></div>
                    </div>
                    <span className="font-data-mono font-bold text-primary">{vendor.score}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-medium">Annual Spend</span>
                  <span className="font-data-mono font-bold text-on-surface">{vendor.spend}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                  <span className={vendor.urgent ? 'text-status-warning font-bold' : 'text-on-surface-variant'}>
                    Renewal Date
                  </span>
                  <span className={`font-data-mono font-bold ${vendor.urgent ? 'text-status-warning' : 'text-on-surface'}`}>
                    {vendor.renewalDate}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-surface-container-lowest flex justify-end gap-2 border-t border-border-subtle">
                <button
                  onClick={() => setActionModal({ type: 'sla', vendorName: vendor.name })}
                  className="px-3 py-1.5 border border-primary text-primary font-bold text-xs rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Review SLA
                </button>
                <button
                  onClick={() => setActionModal({ type: 'renew', vendorName: vendor.name })}
                  className="btn-primary-vibrant text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Renew Contract
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary">Add New Partner Vendor</h2>
              <button onClick={() => setShowAddModal(false)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddVendor} className="space-y-4">
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">
                  Vendor / Agency Name
                </label>
                <input
                  type="text"
                  required
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="e.g. Spine Health Media"
                  className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">
                  Category Type
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium cursor-pointer"
                >
                  <option value="Ad Agency">Ad Agency</option>
                  <option value="SaaS Platform">SaaS Platform</option>
                  <option value="SEO Agency">SEO Agency</option>
                  <option value="Call Center & Telephony">Call Center & Telephony</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary">Add Primary Contact</h2>
              <button onClick={() => setShowAddContactModal(false)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Select Vendor</label>
                <select
                  required
                  value={contactVendorId}
                  onChange={(e) => setContactVendorId(e.target.value)}
                  className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="">-- Choose Partner Vendor --</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Contact Name</label>
                <input required type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. John Doe" className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Contact Email</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@agency.com" className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Phone Number</label>
                <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="e.g. +1 555 123 4567" className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                <button type="button" onClick={() => setShowAddContactModal(false)} className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer">Cancel</button>
                <button
                  type="submit"
                  disabled={isSavingContact}
                  className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSavingContact ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Contract Modal */}
      {showAddContractModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary">Execute Contract Agreement</h2>
              <button onClick={() => setShowAddContractModal(false)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddContract} className="space-y-4">
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Select Vendor</label>
                <select
                  required
                  value={contractVendorId}
                  onChange={(e) => setContactContractId(e.target.value)}
                  className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="">-- Choose Partner Vendor --</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Contract Value ($)</label>
                <input required type="number" step="0.01" value={contractValue} onChange={(e) => setContractValue(e.target.value)} placeholder="e.g. 50000" className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Start Date</label>
                  <input required type="date" value={contractStartDate} onChange={(e) => setContractStartDate(e.target.value)} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Renewal Date</label>
                  <input required type="date" value={contractRenewalDate} onChange={(e) => setContractRenewalDate(e.target.value)} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Document URL</label>
                <input type="url" value={contractDocUrl} onChange={(e) => setContractDocUrl(e.target.value)} placeholder="https://example.com/agreement.pdf" className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                <button type="button" onClick={() => setShowAddContractModal(false)} className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer">Cancel</button>
                <button
                  type="submit"
                  disabled={isSavingContract}
                  className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSavingContract ? 'Saving...' : 'Save Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Invoice Modal */}
      {showAddInvoiceModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary">Record Partner Invoice</h2>
              <button onClick={() => setShowAddInvoiceModal(false)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Select Vendor</label>
                <select
                  required
                  value={invoiceVendorId}
                  onChange={(e) => setInvoiceVendorId(e.target.value)}
                  className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="">-- Choose Partner Vendor --</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Invoice Amount ($)</label>
                  <input required type="number" step="0.01" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} placeholder="e.g. 4500" className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Status</label>
                  <select
                    value={invoiceStatus}
                    onChange={(e) => setInvoiceStatus(e.target.value as any)}
                    className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Due Date</label>
                <input required type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">Document Invoice URL</label>
                <input type="url" value={invoiceDocUrl} onChange={(e) => setInvoiceDocUrl(e.target.value)} placeholder="https://example.com/invoice.pdf" className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                <button type="button" onClick={() => setShowAddInvoiceModal(false)} className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer">Cancel</button>
                <button
                  type="submit"
                  disabled={isSavingInvoice}
                  className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSavingInvoice ? 'Saving...' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Action Modal */}
      {actionModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-sm w-full p-5 sm:p-6 animate-in fade-in duration-150">
            <h2 className="font-headline-sm text-lg font-bold text-primary mb-2">
              {actionModal.type === 'sla' ? 'SLA Review Audit' : actionModal.type === 'renew' ? 'Contract Renewal' : 'Initiate Renewal'}
            </h2>
            <p className="text-sm text-on-surface-variant mb-4">
              {actionModal.type === 'sla' 
                ? `You are about to generate a performance and SLA audit report for ${actionModal.vendorName}.` 
                : `You are initiating the contract renewal workflow for ${actionModal.vendorName}. This action will flag standard notifications.`}
            </p>
            {actionModal.details && (
              <div className="p-3 border border-border-subtle rounded-xl bg-surface-muted text-xs text-on-surface mb-6 font-medium">
                {actionModal.details}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showSuccess(`Successfully processed action for ${actionModal.vendorName} (Informational Workflow completed)`);
                  setActionModal(null);
                }}
                className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
