import { translateUi } from '../../locales/translateUi';
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Sprout,
  ShoppingBag,
  TrendingUp,
  LifeBuoy,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const MobileNav: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 px-2 py-1.5 flex items-center justify-around">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-[#1E5E3A] dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-zinc-400'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>{translateUi("Dashboard")}</span>
      </NavLink>

      <NavLink
        to="/matches"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-[#1E5E3A] dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-zinc-400'
          }`
        }
      >
        <Sparkles className="w-5 h-5" />
        <span>{translateUi("Matches")}</span>
      </NavLink>

      <NavLink
        to="/sell"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-[#1E5E3A] dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-zinc-400'
          }`
        }
      >
        <Sprout className="w-5 h-5" />
        <span>{translateUi("Sell")}</span>
      </NavLink>

      <NavLink
        to="/buy"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-[#1E5E3A] dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-zinc-400'
          }`
        }
      >
        <ShoppingBag className="w-5 h-5" />
        <span>{translateUi("Buy")}</span>
      </NavLink>

      <NavLink
        to="/prices"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-[#1E5E3A] dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-zinc-400'
          }`
        }
      >
        <TrendingUp className="w-5 h-5" />
        <span>{translateUi("Prices")}</span>
      </NavLink>

      <NavLink
        to="/support"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-[#1E5E3A] dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-zinc-400'
          }`
        }
      >
        <LifeBuoy className="w-5 h-5" />
        <span>{translateUi("Help")}</span>
      </NavLink>
    </nav>
  );
};

export default MobileNav;
