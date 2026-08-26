import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopAppBar } from './TopAppBar';
import { Sidebar } from './Sidebar';
import { BottomNavBar } from './BottomNavBar';

export const AppShell: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col font-body-md text-on-surface">
      <TopAppBar onToggleMobileDrawer={() => setIsMobileOpen((prev) => !prev)} />

      <Sidebar isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />

      {/* Main Content View Container */}
      <main className="flex-1 pt-20 pb-24 md:pb-8 px-4 sm:px-6 md:pl-64 max-w-container-max w-full mx-auto space-y-6 overflow-x-hidden">
        <Outlet />
      </main>

      <BottomNavBar />
    </div>
  );
};
