import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types/crm';

interface TopAppBarProps {
  onToggleMobileDrawer: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ onToggleMobileDrawer }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-surface-muted fixed top-0 right-0 z-40 w-full border-b border-border-subtle shadow-sm">
      <div className="flex justify-between items-center h-16 w-full px-3 sm:px-6 md:pl-64 max-w-container-max mx-auto">
        {/* Left Hamburger Mobile Menu Button */}
        <div className="flex items-center gap-2">
          <button
            className="md:hidden text-primary cursor-pointer p-1.5 rounded hover:bg-surface-container"
            onClick={onToggleMobileDrawer}
            aria-label="Toggle Navigation Drawer"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>

        {/* Right Header User & Prominent Role Switcher */}
        <div className="relative flex items-center gap-2 sm:gap-3">
          {/* Prominent Active Role Switcher Pill */}
          <div className="flex items-center gap-1.5 bg-surface-container border border-border-subtle rounded-xl px-2.5 py-1 text-xs">
            <span className="material-symbols-outlined text-sm text-primary hidden xs:inline">shield_person</span>
            <span className="font-bold text-[11px] text-on-surface-variant hidden sm:inline">Role:</span>
            <span className="bg-transparent text-xs font-bold text-primary focus:outline-none pr-1">
              {user?.role}
            </span>
          </div>

          {/* User Profile Avatar & Name */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-headline-sm text-xs sm:text-sm font-bold text-primary truncate max-w-[120px] sm:max-w-none">{user?.name}</span>
          </div>

          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs sm:text-sm shadow hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shrink-0"
            aria-label="User Account Menu"
          >
            {user?.avatar}
          </button>

          {/* Profile Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-12 w-60 bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-150">
              <div className="px-4 py-2 border-b border-border-subtle">
                <p className="font-bold text-primary text-sm">{user?.name}</p>
                <p className="text-xs text-on-surface-variant">{user?.email}</p>
                <span className="inline-block bg-primary-container text-on-primary-container text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                  Active Role: {user?.role}
                </span>
              </div>



              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-status-error hover:bg-error-container/20 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
