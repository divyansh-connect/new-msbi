import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RBACProvider, useRBAC } from './context/RBACContext';
import { AppShell } from './components/layout/AppShell';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MarketingAnalytics } from './pages/MarketingAnalytics';
import { CampaignManagement } from './pages/CampaignManagement';
import { BudgetManagement } from './pages/BudgetManagement';
import { ReputationManagement } from './pages/ReputationManagement';
import { VendorManagement } from './pages/VendorManagement';
import { Reports } from './pages/Reports';
import { Integrations } from './pages/Integrations';
import { UsersAndRoles } from './pages/UsersAndRoles';
import { ClinicalIntelligenceSystem } from './pages/ClinicalIntelligenceSystem';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { loading: isRBACLoading } = useRBAC();
  
  if (isAuthLoading || isRBACLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <RBACProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Marketing Analytics with Sub-routes */}
            <Route path="marketing-analytics" element={<MarketingAnalytics />} />
            <Route path="marketing-analytics/:subview" element={<MarketingAnalytics />} />

            {/* Campaign Management with Sub-routes */}
            <Route path="campaigns" element={<CampaignManagement />} />
            <Route path="campaigns/:subview" element={<CampaignManagement />} />

            {/* Budget Management with Sub-routes */}
            <Route path="budget" element={<BudgetManagement />} />
            <Route path="budget/:subview" element={<BudgetManagement />} />

            {/* Reputation Management with Sub-routes */}
            <Route path="reputation" element={<ReputationManagement />} />
            <Route path="reputation/:subview" element={<ReputationManagement />} />

            {/* Vendor Management with Sub-routes */}
            <Route path="vendors" element={<VendorManagement />} />
            <Route path="vendors/:subview" element={<VendorManagement />} />

            {/* Reports with Sub-routes */}
            <Route path="reports" element={<Reports />} />
            <Route path="reports/:subview" element={<Reports />} />

            {/* Integrations (Separate Main Menu) with Sub-routes */}
            <Route path="integrations" element={<Integrations />} />
            <Route path="integrations/:subview" element={<Integrations />} />

            {/* Users & Roles with Sub-routes */}
            <Route path="users-roles" element={<UsersAndRoles />} />
            <Route path="users-roles/:subview" element={<UsersAndRoles />} />

            {/* Settings (Separate Main Menu) with Sub-routes */}
            <Route path="settings" element={<Settings />} />
            <Route path="settings/:subview" element={<Settings />} />

            <Route path="clinical-intelligence" element={<ClinicalIntelligenceSystem />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RBACProvider>
    </AuthProvider>
  );
};
