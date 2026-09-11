import React from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useClinicProfile } from '@/lib/useClinic';
import { LayoutDashboard, TrendingUp, TrendingDown, Settings as SettingsIcon, Stethoscope, UserRound, FileText } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/incomes', label: 'Incomes', icon: TrendingUp },
  { to: '/expenses', label: 'Expenses', icon: TrendingDown },
  { to: '/patients', label: 'Patients', icon: UserRound },
  { to: '/tax-receipts', label: 'Tax Receipts', icon: FileText },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Layout() {
  const { data: clinic, isLoading } = useClinicProfile();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F4F7F6]">
        <div className="w-8 h-8 border-4 border-teal-light border-t-teal rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!clinic) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-[#006D77] text-white flex-col z-30">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-base leading-tight truncate">{clinic.clinic_name}</div>
              <div className="text-[11px] text-white/70 leading-tight mt-0.5">Orthopedic Surgery & Clinic Financial Manager</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${
                  isActive
                    ? 'bg-white text-[#006D77] font-semibold shadow-sm'
                    : 'text-white/90 hover:bg-white/10'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-[11px] text-white/60">MedTrack · Clinic Finance</div>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:pl-64 pb-20 md:pb-0">
        {/* Mobile header */}
        <header className="md:hidden bg-[#006D77] text-white px-4 py-3 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm truncate leading-tight">{clinic.clinic_name}</div>
              <div className="text-[10px] text-white/70 truncate leading-tight">Orthopedic Surgery & Clinic Financial Manager</div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center py-2.5 transition ${active ? 'text-[#006D77]' : 'text-gray-500'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
