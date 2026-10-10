import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, users, isAuthenticated, logout, loginAsDemo, switchDemoAccount } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { unreadCount } = useNotificationStore();

  const unread = currentUser ? unreadCount(currentUser.id) : 0;

  const handleDemoSwitch = (role: UserRole) => {
    loginAsDemo(role);
    navigate('/dashboard');
  };

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
                MandiMatch
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                Direct APMC
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
                Dashboard
              </Link>
              <Link
                to="/matches"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-zinc-800/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <span>Smart Matches</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </Link>
              <Link
                to="/sell"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-zinc-800/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                Sell Harvest
              </Link>
              <Link
                to="/buy"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-zinc-800/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                Buy Produce
              </Link>
              <Link
                to="/prices"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-zinc-800/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>Mandi Prices</span>
              </Link>
            </nav>
          )}

          {/* Right Action Icons: Demo switcher, Language, Theme, User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Switcher */}
            <div className="hidden lg:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-lg text-xs font-medium">
              <span className="text-zinc-500 dark:text-zinc-400 px-1.5">Demo:</span>
              <button
                onClick={() => handleDemoSwitch('farmer')}
                className={`px-2 py-1 rounded transition-colors ${
                  currentUser?.role === 'farmer'
                    ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-semibold'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
                }`}
                title="Switch to Lakshmi Devi (Farmer)"
              >
                Farmer
              </button>
              <button
                onClick={() => handleDemoSwitch('buyer')}
                className={`px-2 py-1 rounded transition-colors ${
                  currentUser?.role === 'buyer'
                    ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-semibold'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
                }`}
                title="Switch to Hotel Naveen (Buyer)"
              >
                Buyer
              </button>
              <button
                onClick={() => handleDemoSwitch('fpo')}
                className={`px-2 py-1 rounded transition-colors ${
                  currentUser?.role === 'fpo'
                    ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-semibold'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
                }`}
                title="Switch to Basavaraj FPO"
              >
                FPO
              </button>
              <select
                aria-label="Switch demo account"
                title="Switch to another demo account"
                value={currentUser?.id ?? ''}
                onChange={(event) => {
                  switchDemoAccount(event.target.value);
                  navigate('/dashboard');
                }}
                className="ml-1 max-w-36 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <option value="" disabled>All accounts</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </div>

            {/* Language Selector */}
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-zinc-500 dark:text-zinc-400 absolute left-2 pointer-events-none" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                aria-label="Select preferred language"
                className="pl-7 pr-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg border border-transparent focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="en">EN</option>
                <option value="hi">हिन्दी</option>
                <option value="kn">ಕನ್ನಡ</option>
              </select>
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Icon (Authenticated) */}
            {isAuthenticated && (
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Notifications"
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
                  title="Logout"
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
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
