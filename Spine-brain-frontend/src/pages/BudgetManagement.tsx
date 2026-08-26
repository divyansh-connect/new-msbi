import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

const subViewTitles: Record<string, { title: string; subtitle: string }> = {
  'overview': { title: 'Budget Overview & Utilization', subtitle: 'Annual marketing fund allocation and department spending utilization.' },
  'planned-vs-actual': { title: 'Planned vs Actual Ledger Variance', subtitle: 'Q3 fiscal category budget planning vs actual spend ledger.' },
  'vendor-spending': { title: 'Vendor & Agency Spending Breakdown', subtitle: 'Donut chart visualization of vendor retainers and ad channel spend.' },
  'monthly': { title: 'Monthly Budget Breakdown & Trend', subtitle: 'Monthly spend allocation vs actual utilization timeline.' },
  'annual': { title: 'Annual Master Budget Plan 2026', subtitle: 'Quarterly approved master allocations and future fiscal commitments.' },
  'cost-breakdown': { title: 'Detailed Cost Unit Breakdown', subtitle: 'Unit cost breakdown across ad purchases, retainers, and software.' },
};

export const BudgetManagement: React.FC = () => {
  const { subview } = useParams<{ subview?: string }>();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [newPlannedAmount, setNewPlannedAmount] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Expense creation modal form states
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseBudgetId, setExpenseBudgetId] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseVendorId, setExpenseVendorId] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  const activeSubViewKey = subview || 'overview';
  const meta = subViewTitles[activeSubViewKey] || subViewTitles['overview'];

  // Fetch vendors to populate dropdown selection
  const { data: vendorsList = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/vendors');
      return res.data;
    }
  });

  const { data: vendorSpendData = [], isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor-spending'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/budget/vendor-spending');
      const colors = ['#244B59', '#045CB4', '#10B981', '#F59E0B', '#99CAD9'];
      return res.data.map((item, index) => ({
        name: item.vendor,
        value: item.totalSpend,
        color: colors[index % colors.length]
      }));
    }
  });

  const { data: monthlyBudgetData = [], isLoading: monthlyLoading } = useQuery({
    queryKey: ['planned-vs-actual'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/budget/planned-vs-actual');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return res.data.map((item) => {
        let totalAdSpend = 0;
        if (item.adSpendCurrencies) {
          Object.values(item.adSpendCurrencies).forEach((c: any) => {
             totalAdSpend += c.googleAdsSpend + c.metaAdsSpend;
          });
        }
        const actualSpent = (item.manualExpenses || 0) + totalAdSpend;
        
        return {
          month: item.month ? monthNames[item.month - 1] : 'Annual',
          Budget: item.planned,
          Spent: actualSpent,
          manualExpenses: item.manualExpenses || 0,
          adSpendCurrencies: item.adSpendCurrencies || {},
          totalAdSpend,
          variance: item.planned - actualSpent
        };
      });
    }
  });

  const { data: budgetOverview = [], isLoading: overviewLoading } = useQuery({
    queryKey: ['budget-overview'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/budget/overview');
      return res.data;
    }
  });

  const handleAdjustBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudgetId || !newPlannedAmount || isAdjusting) return;

    setIsAdjusting(true);
    try {
      await apiClient('/budget/adjust', {
        method: 'PUT',
        body: JSON.stringify({
          budgetId: selectedBudgetId,
          totalPlanned: parseFloat(newPlannedAmount)
        })
      });
      showSuccess('Budget allocation updated successfully!');
      setShowAdjustModal(false);
      setNewPlannedAmount('');
      queryClient.invalidateQueries({ queryKey: ['budget-overview'] });
      queryClient.invalidateQueries({ queryKey: ['planned-vs-actual'] });
    } catch (err: any) {
      showError('Failed to adjust budget: ' + err.message);
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseBudgetId || !expenseCategory || !expenseAmount || !expenseDate || isSavingExpense) return;

    setIsSavingExpense(true);
    try {
      await apiClient('/budget/expenses', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: expenseBudgetId,
          category: expenseCategory,
          amount: parseFloat(expenseAmount),
          vendorId: expenseVendorId || undefined,
          date: new Date(expenseDate).toISOString(),
          description: expenseDescription || undefined
        })
      });
      showSuccess('Expense added successfully!');
      setShowAddExpenseModal(false);
      setExpenseBudgetId('');
      setExpenseCategory('');
      setExpenseAmount('');
      setExpenseVendorId('');
      setExpenseDate('');
      setExpenseDescription('');
      
      // Invalidate related query keys to refresh all screens
      queryClient.invalidateQueries({ queryKey: ['budget-overview'] });
      queryClient.invalidateQueries({ queryKey: ['planned-vs-actual'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-spending'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    } catch (err: any) {
      showError('Failed to add expense: ' + err.message);
    } finally {
      setIsSavingExpense(false);
    }
  };

  // Group expenses by category from budgetOverview dynamically
  const getCategorySpend = () => {
    const categoryMap: Record<string, number> = {};
    budgetOverview.forEach(b => {
      if (b.expenses) {
        b.expenses.forEach((e: any) => {
          categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
        });
      }
    });
    return Object.entries(categoryMap).map(([category, amount]) => ({ category, amount }));
  };

  const categorySpend = getCategorySpend();

  // Sum monthly budgets if they exist, or use annual budgets
  const monthlyBudgets = budgetOverview.filter(b => b.month !== null);
  const annualBudgets = budgetOverview.filter(b => b.month === null);

  const totalAnnualBudget = annualBudgets.length > 0 
    ? annualBudgets.reduce((sum, b) => sum + Number(b.totalPlanned), 0)
    : monthlyBudgets.reduce((sum, b) => sum + Number(b.totalPlanned), 0);

  const totalAnnualSpent = annualBudgets.length > 0
    ? annualBudgets.reduce((sum, b) => sum + Number(b.totalActual), 0)
    : monthlyBudgets.reduce((sum, b) => sum + Number(b.totalActual), 0);

  const percentUtilized = totalAnnualBudget ? (totalAnnualSpent / totalAnnualBudget) * 100 : 0;
  const remainingBudget = totalAnnualBudget - totalAnnualSpent;
  const avgMonthlySpend = monthlyBudgets.length ? totalAnnualSpent / monthlyBudgets.length : totalAnnualSpent;

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
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="btn-primary-vibrant font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">add_shopping_cart</span>
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="btn-primary-vibrant font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">add_card</span>
            <span>Adjust Allocations</span>
          </button>
        </div>
      </div>

      {/* Top KPI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <span className="font-label-md text-xs uppercase text-on-surface-variant font-bold">Total Master Budget</span>
          <div className="my-2">
            <span className="font-headline-md text-2xl sm:text-3xl font-bold text-primary">${totalAnnualBudget.toLocaleString()}</span>
          </div>
          <div>
            <div className="w-full bg-surface-container-highest rounded-full h-2.5 mt-2">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${Math.min(100, percentUtilized)}%` }}></div>
            </div>
            <span className="font-body-sm text-xs text-on-surface-variant block text-right mt-1.5 font-bold">
              {percentUtilized.toFixed(1)}% Utilized (${totalAnnualSpent.toLocaleString()} spent)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-2">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
            <span className="font-label-md text-[10px] sm:text-xs uppercase text-on-surface-variant font-bold">Remaining Budget</span>
            <span className="font-headline-sm text-xl sm:text-2xl font-bold text-status-success my-1">${remainingBudget.toLocaleString()}</span>
            <span className="text-[10px] sm:text-[11px] text-on-surface-variant font-medium">On track for active operations</span>
          </div>

          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
            <span className="font-label-md text-[10px] sm:text-xs uppercase text-on-surface-variant font-bold">Avg. Monthly Spend</span>
            <span className="font-headline-sm text-xl sm:text-2xl font-bold text-status-warning my-1">${Math.round(avgMonthlySpend).toLocaleString()}</span>
            <span className="text-[10px] sm:text-[11px] text-on-surface-variant font-medium">Calculated from actual transactions</span>
          </div>
        </div>
      </div>

      {/* Render Dedicated Submenu Content View */}
      {activeSubViewKey === 'vendor-spending' ? (
        /* Recharts Vendor Spend Visualizer */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h3 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Vendor & Agency Spend Breakdown (Recharts Donut)
          </h3>
          {vendorSpendData.length > 0 ? (
            <div className="h-72 w-full flex flex-col sm:flex-row items-center gap-6">
              <div className="h-56 sm:h-64 w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vendorSpendData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={true}
                    >
                      {vendorSpendData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 overflow-y-auto max-h-56 text-xs space-y-1 pr-2">
                <p className="font-bold text-primary mb-2">Vendors Spend Ledger</p>
                {vendorSpendData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span>{item.name}</span>
                    </div>
                    <span className="font-mono font-bold">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-on-surface-variant text-xs font-medium">
              No vendor spending data available
            </div>
          )}
        </div>
      ) : activeSubViewKey === 'monthly' ? (
        /* Monthly Budget Breakdown View */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h3 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Monthly Spend vs Allocation Trend
          </h3>
          {monthlyBudgetData.length > 0 ? (
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBudgetData}>
                  <XAxis dataKey="month" stroke="#71787b" fontSize={11} />
                  <YAxis stroke="#71787b" fontSize={11} />
                  <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                  <Bar dataKey="Budget" fill="#CDE4E8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="#244B59" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center text-on-surface-variant text-xs font-medium">
              No monthly budget data available
            </div>
          )}
        </div>
      ) : activeSubViewKey === 'cost-breakdown' ? (
        /* Cost Breakdown View */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h3 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Detailed Cost Unit Breakdown
          </h3>
          {categorySpend.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
              {[...categorySpend].sort((a, b) => b.amount - a.amount).map((item, idx) => (
                <div key={idx} className="p-3.5 border border-border-subtle rounded-xl bg-surface-muted flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-primary">{item.category}</span>
                    <p className="text-lg sm:text-xl font-bold text-primary mt-1">${item.amount.toLocaleString()}</p>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-2 font-medium">Aggregated category spend</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-on-surface-variant text-xs font-medium">
              No cost breakdown data available
            </div>
          )}
        </div>
      ) : activeSubViewKey === 'annual' ? (
        /* Annual Budget Summary */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h3 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            2026 Annual Fiscal Master Budget Plan
          </h3>
          {budgetOverview.filter(b => b.month !== null).length > 0 ? (
            <div className="space-y-2.5 text-xs font-medium">
              {[1, 2, 3, 4].map(q => {
                const qMonths = q === 1 ? [1, 2, 3] : q === 2 ? [4, 5, 6] : q === 3 ? [7, 8, 9] : [10, 11, 12];
                const qPlanned = budgetOverview
                  .filter(b => b.month !== null && b.year === 2026 && qMonths.includes(b.month))
                  .reduce((sum, b) => sum + Number(b.totalPlanned), 0);
                
                return (
                  <div key={q} className="flex justify-between items-center p-3 border border-border-subtle rounded-xl bg-surface-muted/30">
                    <span className="font-bold text-primary">Q{q} Master Planned Allocation</span>
                    <span className="font-mono font-bold">${qPlanned.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-on-surface-variant text-xs font-medium">
              No quarterly budget data available
            </div>
          )}
        </div>
      ) : activeSubViewKey === 'planned-vs-actual' ? (
        /* Planned vs Actual Table View */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-border-subtle flex justify-between items-center">
            <h3 className="font-headline-sm text-sm sm:text-base font-bold text-primary">Planned vs Actual Ledger</h3>
            <span className="text-xs text-on-surface-variant font-bold">Ledger Variance Summary</span>
          </div>
          <div className="overflow-x-auto w-full no-scrollbar">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                <tr>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Period</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Planned Budget</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Actual Spent</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Variance</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {monthlyBudgetData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-on-surface-variant">No budget data available</td>
                  </tr>
                ) : (
                  monthlyBudgetData.map((row: any, i: number) => {
                    const isOver = row.variance < 0;
                    const formattedVar = (isOver ? '-$' : '+$') + Math.abs(row.variance).toLocaleString();
                    const status = isOver ? 'Over Budget' : row.variance === 0 ? 'On Track' : 'Under Budget';
                    return (
                      <tr key={i} className="hover:bg-surface-muted transition-colors">
                        <td className="py-3 px-3 sm:px-4 font-bold text-primary whitespace-nowrap">{row.month}</td>
                        <td className="py-3 px-3 sm:px-4 font-data-mono whitespace-nowrap">${row.Budget.toLocaleString()}</td>
                        <td className="py-3 px-3 sm:px-4 font-data-mono whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {Object.entries(row.adSpendCurrencies || {}).map(([cur, spend]: [string, any]) => (
                              <span key={cur} className="text-[10px]">
                                {cur} Ad Spend: ${spend.googleAdsSpend.toLocaleString()} (Google), ${spend.metaAdsSpend.toLocaleString()} (Meta)
                              </span>
                            ))}
                            <span className="text-on-surface-variant text-[10px]">Expenses: ${row.manualExpenses.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className={`py-3 px-3 sm:px-4 font-data-mono font-bold whitespace-nowrap ${isOver ? 'text-status-error' : 'text-status-success'}`}>
                          {formattedVar}
                        </td>
                        <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            status === 'Under Budget' ? 'bg-status-success/20 text-status-success' : status === 'Over Budget' ? 'bg-status-error/20 text-status-error' : 'bg-surface-container text-primary'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Default Budget Overview */
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h3 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            Category Budget Spend Utilization
          </h3>
          {categorySpend.length > 0 ? (
            <div className="space-y-4">
              {categorySpend.map((c, idx) => {
                const categoryPercent = totalAnnualBudget ? (c.amount / totalAnnualBudget) * 100 : 0;
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-on-surface">{c.category}</span>
                      <span className="font-data-mono text-primary">${c.amount.toLocaleString()} spent</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${Math.min(100, categoryPercent)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-on-surface-variant text-xs font-medium">
              No category allocation data available
            </div>
          )}
        </div>
      )}

      {/* Adjust Allocations Modal */}
      {showAdjustModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h2 className="font-headline-sm text-lg font-bold text-primary">Adjust Budget Allocation</h2>
              <button onClick={() => setShowAdjustModal(false)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAdjustBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">
                  Select Budget Period
                </label>
                <select
                  required
                  value={selectedBudgetId}
                  onChange={(e) => setSelectedBudgetId(e.target.value)}
                  className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="">-- Choose Period --</option>
                  {budgetOverview.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.year} - {b.month ? `Month ${b.month}` : 'Annual Master Plan'} (Current: ${Number(b.totalPlanned).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">
                  New Planned Budget Amount ($)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={newPlannedAmount}
                  onChange={(e) => setNewPlannedAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isAdjusting ? 'Saving...' : 'Save Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* Add Expense Modal */}
      {showAddExpenseModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h2 className="font-headline-sm text-lg font-bold text-primary">Record New Expense</h2>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">
                  Select Budget Period
                </label>
                <select
                  required
                  value={expenseBudgetId}
                  onChange={(e) => setExpenseBudgetId(e.target.value)}
                  className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="">-- Choose Period --</option>
                  {budgetOverview.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.year} - {b.month ? `Month ${b.month}` : 'Annual Master Plan'} (Planned: ${Number(b.totalPlanned).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  placeholder="e.g. PPC, SEO, Software"
                  className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="2000"
                    className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">
                  Select Associated Vendor
                </label>
                <select
                  value={expenseVendorId}
                  onChange={(e) => setExpenseVendorId(e.target.value)}
                  className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="">-- Choose Vendor (Optional) --</option>
                  {vendorsList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-label-md uppercase text-on-surface-variant mb-1 font-bold">
                  Description
                </label>
                <textarea
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Additional transaction info"
                  rows={2}
                  className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingExpense}
                  className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSavingExpense ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
};
