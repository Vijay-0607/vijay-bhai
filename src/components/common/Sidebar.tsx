import { translateUi } from '../../locales/translateUi';
import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useMarketplaceStore } from '../../stores/marketplaceStore';
import { isBackendAccount } from '../../lib/api';
import {
  LayoutDashboard,
  Sprout,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  User,
  Bell,
  Scale,
  LifeBuoy,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { offers } = useMarketplaceStore();
  const refreshBackend = useMarketplaceStore((s) => s.refreshBackend);

  useEffect(() => {
    if (!currentUser || !isBackendAccount(currentUser.id)) return;
    const refresh = () => { void refreshBackend().catch(() => undefined); };
    refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => window.clearInterval(timer);
  }, [currentUser?.id, refreshBackend]);

  const userPendingOffers = currentUser
    ? offers.filter(
        (o) =>
          (o.farmerId === currentUser.id || o.buyerId === currentUser.id) &&
          (o.status === 'pending' || o.status === 'negotiating')
      ).length
    : 0;

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/matches', label: 'Smart Matches', icon: Sparkles, badge: 'AI' },
    { to: '/sell', label: 'Sell Harvest', icon: Sprout },
    { to: '/buy', label: 'Buy Produce', icon: ShoppingBag },
    { to: '/prices', label: 'Mandi Prices', icon: TrendingUp },
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/support', label: 'Report a problem', icon: LifeBuoy },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* User Quick Info */}
      {currentUser && (
        <div className="p-3.5 mb-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-[#1E5E3A]/5 border border-emerald-500/20">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 capitalize">
            {translateUi(currentUser.role === 'fpo' ? 'FPO' : currentUser.role === 'buyer' ? 'Buyer' : 'Farmer')} {translateUi('Account')}
          </p>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {currentUser.name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            📍 {currentUser.district} {translateUi('APMC cluster')}
          </p>
        </div>
      )}

      {/* Nav List */}
      <nav className="space-y-1 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1E5E3A] text-white shadow-md shadow-emerald-900/20 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{translateUi(link.label)}</span>
              </div>
              {link.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 font-bold uppercase tracking-wider">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Active Negotiation Counter Card */}
      {userPendingOffers > 0 && (
        <NavLink to="/dashboard#offers" aria-label={`${userPendingOffers} active deal offers. Open negotiations`} className="mt-auto block rounded-xl bg-amber-50 p-3 text-left text-xs transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 border border-amber-300 dark:border-amber-800/40">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold mb-1">
            <Scale className="w-4 h-4 text-amber-600" />
            <span>{translateUi("Active Negotiations")}</span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            {translateUi("You have")} <span className="font-bold text-amber-600 dark:text-amber-400">{userPendingOffers}</span> {translateUi(userPendingOffers === 1 ? 'deal offer in negotiation.' : 'deal offers in negotiation.')}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300">{translateUi('View offers')} <span aria-hidden="true">→</span></span>
        </NavLink>
      )}
    </aside>
  );
};

export default Sidebar;
