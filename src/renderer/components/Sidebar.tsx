import React from 'react';
import {
  LayoutDashboard,
  Smartphone,
  ShieldCheck,
  ShieldBan,
  History,
  Router,
  Settings,
  Shield,
  Wifi,
  X,
  HelpCircle,
  Gauge
} from 'lucide-react';
import { useAppStore, ViewName } from '../stores/useAppStore';

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    devices,
    routerStatus,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen
  } = useAppStore();

  const totalDevices = devices.length;
  const unknownDevices = devices.filter(d => !d.trusted && d.status === 'ONLINE').length;
  const trustedDevices = devices.filter(d => d.trusted).length;
  const blockedDevices = devices.filter(d => d.blocked).length;

  const navItems: { id: ViewName; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
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
      badgeColor: 'bg-slate-700 text-slate-200'
    },
    {
      id: 'speedtest',
      label: 'Speed Test',
      icon: <Gauge className="w-5 h-5" />
    },
    {
      id: 'trusted',
      label: 'Trusted',
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: trustedDevices,
      badgeColor: 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
    },
    {
      id: 'blocked',
      label: 'Blocked',
      icon: <ShieldBan className="w-5 h-5" />,
      badge: blockedDevices > 0 ? blockedDevices : undefined,
      badgeColor: 'bg-rose-950 text-rose-400 border border-rose-800/40'
    },
    {
      id: 'history',
      label: 'Activity Logs',
      icon: <History className="w-5 h-5" />
    },
    {
      id: 'router',
      label: 'Router & Network',
      icon: <Router className="w-5 h-5" />
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />
    },
    {
      id: 'tutorial',
      label: 'Panduan & Tutorial',
      icon: <HelpCircle className="w-5 h-5" />
    }
  ];

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-slate-900 select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
              WIFI GUARD
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Access & Device Shield</p>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Unknown Alert Callout */}
      {unknownDevices > 0 && (
        <div className="mx-3 mt-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-xs text-amber-200 font-medium">{unknownDevices} New / Unknown</span>
          </div>
          <button
            onClick={() => {
              useAppStore.getState().setFilterTab('unknown');
              setCurrentView('devices');
              if (isMobile) setIsMobileDrawerOpen(false);
            }}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline"
          >
            Review
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                if (isMobile) setIsMobileDrawerOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-sky-600/15 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-sky-400' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Router Health */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${routerStatus?.connected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {routerStatus?.routerInfo?.model || 'FiberHome HG6145D2'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {routerStatus?.routerInfo?.ipAddress || '192.168.1.1'}
              </div>
            </div>
          </div>
          <Wifi className={`w-4 h-4 ${routerStatus?.connected ? 'text-emerald-400' : 'text-slate-500'}`} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden md:flex md:w-64 border-r border-slate-800/80 flex-col h-screen select-none">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[80vw] border-r border-slate-800 z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
