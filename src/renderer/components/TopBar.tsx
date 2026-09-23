import React from 'react';
import { RefreshCw, KeyRound, Wifi, Cpu, Menu, LogOut, HelpCircle } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const TopBar: React.FC = () => {
  const {
    routerStatus,
    isSyncing,
    syncDevices,
    setIsLoginModalOpen,
    setIsTutorialModalOpen,
    setIsMobileDrawerOpen,
    settings,
    logoutRouter
  } = useAppStore();

  const isConnected = routerStatus?.connected;
  const routerModel = routerStatus?.routerInfo?.model || 'HG6145D2';
  const latency = routerStatus?.latencyMs ? `${routerStatus.latencyMs} ms` : '15 ms';

  return (
    <header className="h-14 sm:h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between select-none">
      {/* Left: Mobile Menu & Router Status */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Router Info */}
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline text-xs text-slate-400 font-medium">Router:</span>
          <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span className="truncate max-w-[120px] sm:max-w-none">{routerModel}</span>
          </span>
        </div>

        <div className="hidden sm:block h-4 w-[1px] bg-slate-800" />

        {/* Connection status badge */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold ${
              isConnected
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                : 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                isConnected ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span className="hidden sm:inline">{isConnected ? 'Connected' : 'Offline'}</span>
            <span className="sm:hidden">{isConnected ? 'Online' : 'Offline'}</span>
          </span>

          {isConnected && (
            <span className="hidden md:inline text-[11px] text-slate-400 font-mono">({latency})</span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Polling Interval Indicator (Desktop only) */}
        <div className="hidden lg:flex text-xs text-slate-400 items-center space-x-1.5 mr-2">
          <Wifi className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh:</span>
          <span className="text-slate-300 font-medium">
            {settings?.autoRefreshInterval ? `${settings.autoRefreshInterval}s` : 'Manual'}
          </span>
        </div>

        {/* Manual Refresh / Scan Button */}
        <button
          onClick={() => syncDevices()}
          disabled={isSyncing}
          className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all disabled:opacity-50 border border-slate-700/60"
          title="Scan and Sync Devices from Router"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Scanning...' : 'Sync'}</span>
        </button>

        {/* Tutorial / Help Center Button */}
        <button
          onClick={() => setIsTutorialModalOpen(true)}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 text-xs font-semibold transition-all border border-slate-700/60 flex items-center space-x-1"
          title="Buka Panduan & Tutorial"
        >
          <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Bantuan</span>
        </button>

        {/* Router Login / Config / Logout Buttons */}
        {isConnected ? (
          <>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700/60"
              title="Router Authentication Settings"
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Config</span>
            </button>
            <button
              onClick={() => logoutRouter()}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-semibold transition-all shadow-sm"
              title="Keluar / Putus Sesi Router"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all shadow-md shadow-sky-600/20"
            title="Router Authentication Settings"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Router Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
