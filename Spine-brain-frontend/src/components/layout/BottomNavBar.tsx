import React from 'react';
import { NavLink } from 'react-router-dom';

export const BottomNavBar: React.FC = () => {
  return (
    <nav className="bg-surface-container-lowest text-primary fixed bottom-0 w-full z-30 border-t border-border-subtle shadow-lg flex justify-around items-center h-16 px-4 md:hidden">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-2 rounded-full active:scale-90 transition-transform ${
            isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'
          }`
        }
      >
        <span className="material-symbols-outlined text-xl">dashboard</span>
      </NavLink>

      <NavLink
        to="/marketing-analytics"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-2 rounded-full active:scale-90 transition-transform ${
            isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'
          }`
        }
      >
        <span className="material-symbols-outlined text-xl">analytics</span>
      </NavLink>

      <NavLink
        to="/campaigns"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-2 rounded-full active:scale-90 transition-transform ${
            isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'
          }`
        }
      >
        <span className="material-symbols-outlined text-xl">campaign</span>
      </NavLink>

      <NavLink
        to="/reports"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-2 rounded-full active:scale-90 transition-transform ${
            isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'
          }`
        }
      >
        <span className="material-symbols-outlined text-xl">description</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-2 rounded-full active:scale-90 transition-transform ${
            isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'
          }`
        }
      >
        <span className="material-symbols-outlined text-xl">settings</span>
      </NavLink>
    </nav>
  );
};
