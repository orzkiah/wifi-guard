import React from 'react';
import {
  LayoutDashboard,
  Smartphone,
  ShieldCheck,
  ShieldBan
} from 'lucide-react';
import { useAppStore, ViewName } from '../stores/useAppStore';

export const BottomNav: React.FC = () => {
  const { currentView, setCurrentView, devices } = useAppStore();

  const totalDevices = devices.length;
  const trustedCount = devices.filter(d => d.trusted).length;
  const blockedCount = devices.filter(d => d.blocked).length;

  const tabs: { id: ViewName; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'devices',
      label: 'All Devices',
      icon: <Smartphone className="w-5 h-5" />,
      badge: totalDevices,
      badgeColor: 'bg-sky-600 text-white border-sky-900'
    },
    {
      id: 'trusted',
      label: 'Trusted',
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: trustedCount > 0 ? trustedCount : undefined,
      badgeColor: 'bg-emerald-600 text-white border-emerald-900'
    },
    {
      id: 'blocked',
      label: 'Blocked',
      icon: <ShieldBan className="w-5 h-5" />,
      badge: blockedCount > 0 ? blockedCount : undefined,
      badgeColor: 'bg-rose-600 text-white border-rose-900'
    }
  ];

  return (
    <nav className="md:hidden shrink-0 h-14 bg-slate-900/95 backdrop-blur border-t border-slate-800/90 flex items-center justify-around px-2 py-1 select-none z-20">
      {tabs.map((tab) => {
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id)}
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 px-1 rounded-xl transition-all ${
              isActive
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`absolute -top-1 -right-2.5 px-1 min-w-[16px] h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center border ${
                    tab.badgeColor || 'bg-sky-600 text-white border-sky-900'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            {isActive && (
              <span className="absolute bottom-0.5 w-6 h-0.5 bg-sky-400 rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
