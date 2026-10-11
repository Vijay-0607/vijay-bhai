import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import DashboardPage from '../pages/DashboardPage';
import SellPage from '../pages/SellPage';
import BuyPage from '../pages/BuyPage';
import MatchesPage from '../pages/MatchesPage';
import PricesPage from '../pages/PricesPage';
import ProfilePage from '../pages/ProfilePage';
import NotificationsPage from '../pages/NotificationsPage';
import SupportPage from '../pages/SupportPage';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { MobileNav } from '../components/common/MobileNav';
import { DemoDisclaimerBanner } from '../components/common/DemoDisclaimerBanner';
import { ProtectedRoute } from './ProtectedRoute';

function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <DemoDisclaimerBanner />
        <div className="mx-auto flex max-w-7xl">
          <Sidebar />
          <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6 lg:pb-8">{children}</main>
        </div>
        <MobileNav />
      </div>
    </ProtectedRoute>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<><Navbar /><LandingPage /></>} />
      <Route path="/login" element={<><Navbar /><LoginPage /></>} />
      <Route path="/signup" element={<><Navbar /><SignupPage /></>} />
      <Route path="/forgot-password" element={<><Navbar /><ForgotPasswordPage /></>} />
      <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
      <Route path="/sell" element={<ProtectedLayout><SellPage /></ProtectedLayout>} />
      <Route path="/buy" element={<ProtectedLayout><BuyPage /></ProtectedLayout>} />
      <Route path="/matches" element={<ProtectedLayout><MatchesPage /></ProtectedLayout>} />
      <Route path="/prices" element={<ProtectedLayout><PricesPage /></ProtectedLayout>} />
      <Route path="/profile" element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />
      <Route path="/notifications" element={<ProtectedLayout><NotificationsPage /></ProtectedLayout>} />
      <Route path="/support" element={<ProtectedLayout><SupportPage /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
