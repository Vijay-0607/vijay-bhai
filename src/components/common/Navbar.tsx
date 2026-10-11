import { translateUi } from '../../locales/translateUi';
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useThemeStore } from '../../stores/themeStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Badge } from './Badge';
import {
  Sprout,
  Sun,
  Moon,
  Globe,
  Bell,
  LogOut,
  User as UserIcon,
  LogIn,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, isAuthenticated, logout } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { unreadCount } = useNotificationStore();

  const unread = currentUser ? unreadCount(currentUser.id) : 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/10 dark:border-emerald-500/20 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E5E3A] to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#1E5E3A] to-emerald-600 dark:from-emerald-400 dark:to-emerald-200 bg-clip-text text-transparent">
                {translateUi("MandiMatch")}
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                {translateUi("Direct APMC")}
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (desktop) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <Link
                to="/dashboard"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-zinc-800/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                {translateUi("Dashboard")}
              </Link>
              <Link
                to="/matches"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-zinc-800/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <span>{translateUi("Smart Matches")}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </Link>
              <Link
                to="/sell"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-zinc-800/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                {translateUi("Sell Harvest")}
              </Link>
              <Link
                to="/buy"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-zinc-800/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                {translateUi("Buy Produce")}
              </Link>
              <Link
                to="/prices"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-zinc-800/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>{translateUi("Mandi Prices")}</span>
              </Link>
            </nav>
          )}

          {/* Right Action Icons: Language, Theme, User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-zinc-500 dark:text-zinc-400 absolute left-2 pointer-events-none" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                aria-label={translateUi("Select preferred language")}
                className="pl-7 pr-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg border border-transparent focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="en">{translateUi("EN")}</option>
                <option value="hi">हिन्दी</option>
                <option value="kn">ಕನ್ನಡ</option>
              </select>
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={translateUi("Toggle theme")}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Icon (Authenticated) */}
            {isAuthenticated && (
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title={translateUi("Notifications")}
              >
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unread}
                  </span>
                )}
              </Link>
            )}

            {/* User Profile or Login */}
            {isAuthenticated && currentUser ? (
              <div className="flex items-center gap-2 pl-1 border-l border-zinc-200 dark:border-zinc-800">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-semibold flex items-center justify-center text-xs shadow">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
                      {currentUser.role} • {currentUser.district}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                  title={translateUi("Logout")}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1E5E3A] hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{translateUi("Login")}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
