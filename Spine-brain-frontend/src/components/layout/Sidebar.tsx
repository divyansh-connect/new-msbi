import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

import { navStructure } from '../../config/navigation';
import { useRBAC } from '../../context/RBACContext';

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { hasPermission } = useRBAC();
  
  const filteredNavStructure = navStructure.filter(item => hasPermission(user?.role || '', item.id));
  const navigate = useNavigate();
  const location = useLocation();

  // Track expanded menu state
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Auto-expand menu corresponding to current URL pathname
  useEffect(() => {
    const currentPath = location.pathname;
    const matchingMenu = filteredNavStructure.find((item) =>
      item.submenus
        ? item.submenus.some((sub) => currentPath.startsWith(sub.path) || currentPath.startsWith(item.path))
        : currentPath === item.path
    );

    if (matchingMenu && matchingMenu.submenus) {
      setExpandedMenus((prev) => ({
        ...prev,
        [matchingMenu.id]: true,
      }));
    }
  }, [location.pathname]);

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const handleLogout = () => {
    onCloseMobile();
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Dark Overlay Backdrop on Mobile Devices */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[55] md:hidden transition-opacity duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation Container */}
      <nav
        className={`bg-surface-muted h-screen w-60 fixed left-0 top-0 border-r border-border-subtle z-[60] transform ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out shadow-sm`}
      >
        <div className="flex flex-col h-full py-2">
          {/* Sidebar Header Logo */}
          <div className="px-3 py-2 mb-1 flex items-center bg-surface-muted relative">
            <div className="flex items-center justify-center p-2 mb-4 mt-2">
            <img 
              src="/dashboard-logo.png" 
              alt="Midwest Spine & Brain Institute Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>
            <button
              className="md:hidden text-on-surface-variant hover:text-primary p-1 rounded absolute right-2 top-2.5 cursor-pointer"
              onClick={onCloseMobile}
              aria-label="Close Navigation Drawer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Expandable Navigation List */}
          <ul className="flex-1 overflow-y-auto px-2 space-y-1 py-1 no-scrollbar">
            {filteredNavStructure.map((item) => {
              const hasSubmenu = item.submenus && item.submenus.length > 0;
              const isExpanded = !!expandedMenus[item.id];
              const isParentActive = location.pathname.startsWith(item.path);

              return (
                <li key={item.id}>
                  {hasSubmenu ? (
                    <div>
                      <button
                        onClick={() => toggleSubmenu(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] transition-all duration-150 active:scale-98 cursor-pointer ${
                          isParentActive
                            ? 'bg-primary-container/50 text-primary font-bold'
                            : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/60 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`material-symbols-outlined text-lg ${isParentActive ? 'icon-fill' : ''}`}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        <span className="material-symbols-outlined text-base transition-transform duration-200">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>

                      {/* Submenu Children Accordion */}
                      {isExpanded && item.submenus && (
                        <ul className="mt-0.5 ml-3 pl-2.5 border-l-2 border-border-subtle/80 space-y-0.5">
                          {item.submenus.map((sub) => (
                            <li key={sub.path}>
                              <NavLink
                                to={sub.path}
                                onClick={onCloseMobile}
                                className={({ isActive }) =>
                                  `block px-2.5 py-1.5 rounded-lg text-[10.5px] transition-all duration-150 ${
                                    isActive
                                      ? 'sidebar-active-tab font-bold shadow-xs'
                                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/50 font-medium'
                                  }`
                                }
                              >
                                {sub.label}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={onCloseMobile}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] transition-all duration-150 active:scale-95 ${
                          isActive
                            ? 'sidebar-active-tab font-bold shadow-sm'
                            : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/60 font-medium'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={`material-symbols-outlined text-lg ${isActive ? 'icon-fill' : ''}`}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Sidebar Footer Logout Button */}
          <div className="p-2 border-t border-border-subtle bg-surface-muted">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-surface-container-lowest hover:bg-error-container/20 border border-border-subtle text-status-error font-bold text-xs rounded-xl transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};
