import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldBan,
  Wifi,
  Radio,
  Activity,
  ArrowUpRight,
  Laptop,
  Smartphone,
  AlertTriangle,
  Gauge,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const DashboardView: React.FC = () => {
  const {
    devices,
    routerStatus,
    setCurrentView,
    setFilterTab,
    setSelectedDevice,
    setDeviceToBlock,
    trustDevice
  } = useAppStore();

  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'ONLINE');
  const unknownDevices = devices.filter(d => !d.trusted && d.status === 'ONLINE');
  const trustedDevices = devices.filter(d => d.trusted && d.status === 'ONLINE');
  const blockedDevices = devices.filter(d => d.blocked);

  const clients24 = onlineDevices.filter(d => d.band === '2.4GHz');
  const clients5G = onlineDevices.filter(d => d.band === '5GHz');
  const clientsEthernet = onlineDevices.filter(d => d.band === 'ETHERNET');

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 max-w-7xl mx-auto overflow-y-auto h-full pb-8">
      {/* Alert Banner if New/Unknown devices are active */}
      {unknownDevices.length > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-slate-900 border border-amber-500/40 p-4 sm:p-5 shadow-lg shadow-amber-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-amber-200 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span>{unknownDevices.length} Untrusted Device{unknownDevices.length > 1 ? 's' : ''}</span>
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Needs Review
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                  Unrecognized devices connected to your Wi-Fi. Mark them as Trusted or Block via router blacklist.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFilterTab('unknown');
                setCurrentView('devices');
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shrink-0 text-center"
            >
              Review Devices ({unknownDevices.length})
            </button>
          </div>

          {/* Quick preview of the first unknown device */}
          {unknownDevices[0] && (
            <div className="mt-3.5 pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-white truncate">
                    {unknownDevices[0].hostname || unknownDevices[0].vendor || 'Unknown Host'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    {unknownDevices[0].ipAddress} • {unknownDevices[0].macAddress}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => trustDevice(unknownDevices[0].id, true)}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold"
                >
                  Trust
                </button>
                <button
                  onClick={() => setDeviceToBlock(unknownDevices[0])}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold"
                >
                  Block
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Primary Metrics Grid (2 columns on mobile, 4 columns on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
        {/* Total Connected Devices */}
        <div
          onClick={() => {
            setFilterTab('all');
            setCurrentView('devices');
          }}
          className="p-3.5 sm:p-5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Online</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{onlineDevices.length}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-0.5 group-hover:text-sky-400 transition-colors">
              <span className="hidden sm:inline">View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 truncate">
            {totalDevices} in history
          </div>
        </div>

        {/* Trusted Devices */}
        <div
          onClick={() => {
            setFilterTab('trusted');
            setCurrentView('devices');
          }}
          className="p-3.5 sm:p-5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Trusted</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{trustedDevices.length}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-0.5 group-hover:text-emerald-400 transition-colors">
              <span className="hidden sm:inline">View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 truncate">
            Safe members
          </div>
        </div>

        {/* Unknown / Needs Review */}
        <div
          onClick={() => {
            setFilterTab('unknown');
            setCurrentView('devices');
          }}
          className="p-3.5 sm:p-5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Unknown</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <div className={`text-2xl sm:text-3xl font-extrabold ${unknownDevices.length > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {unknownDevices.length}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-0.5 group-hover:text-amber-400 transition-colors">
              <span className="hidden sm:inline">Filter</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 truncate">
            {unknownDevices.length > 0 ? 'Action needed' : 'None detected'}
          </div>
        </div>

        {/* Blocked Devices */}
        <div
          onClick={() => setCurrentView('blocked')}
          className="p-3.5 sm:p-5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Blacklisted</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldBan className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400">{blockedDevices.length}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-0.5 group-hover:text-rose-400 transition-colors">
              <span className="hidden sm:inline">Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 truncate">
            In router MAC filter
          </div>
        </div>
      </div>

      {/* Quick Speed Test Banner */}
      <div
        onClick={() => setCurrentView('speedtest')}
        className="rounded-xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-slate-900 border border-sky-500/30 p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:border-sky-400/60 transition-all group shadow-lg shadow-sky-950/20"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                Uji Kecepatan Jaringan (Speed Test)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                Baru
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cek real-time throughput unduh/unggah, ping gaming, dan stabilitas jitter Wi-Fi Anda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 shrink-0 ml-2 group-hover:translate-x-1 transition-transform">
          <span className="hidden sm:inline">Uji Sekarang</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* Network & Frequency Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Frequency Band Breakdown */}
        <div className="p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800/80 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-400" />
              Band Allocation
            </h3>
            <span className="text-xs text-slate-400">{onlineDevices.length} Active</span>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {/* 5 GHz */}
            <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                  5G
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">5 GHz High-Speed</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400">Fast connection, low latency</div>
                </div>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white shrink-0">{clients5G.length} dev</div>
            </div>

            {/* 2.4 GHz */}
            <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                  2.4G
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">2.4 GHz Long-Range</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400">Broad coverage, IoT/mobile</div>
                </div>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white shrink-0">{clients24.length} dev</div>
            </div>

            {/* Wired */}
            {clientsEthernet.length > 0 && (
              <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 sm:space-x-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    LAN
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Ethernet / LAN</div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400">Direct cable connection</div>
                  </div>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white shrink-0">{clientsEthernet.length} dev</div>
              </div>
            )}
          </div>
        </div>

        {/* Router Hardware Information Card */}
        <div className="p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800/80 space-y-3 sm:space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Router Diagnostics
            </h3>
            <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {routerStatus?.routerInfo?.ipAddress || '192.168.1.1'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-semibold">Model</span>
              <div className="text-xs sm:text-sm font-bold text-slate-100 mt-0.5 truncate">
                {routerStatus?.routerInfo?.model || 'HG6145D2'}
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-semibold">Vendor</span>
              <div className="text-xs sm:text-sm font-bold text-slate-100 mt-0.5">
                {routerStatus?.routerInfo?.vendor || 'FiberHome'}
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-semibold">Firmware</span>
              <div className="text-xs sm:text-sm font-bold text-slate-100 mt-0.5 truncate">
                {routerStatus?.routerInfo?.firmware || 'RP3478'}
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-semibold">Operator</span>
              <div className="text-xs sm:text-sm font-bold text-slate-100 mt-0.5 truncate">
                {routerStatus?.routerInfo?.operatorName || 'IDN_IMI'}
              </div>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">MAC Filter:</span>
              <span className="font-semibold text-slate-200">Blacklist Active</span>
            </div>
            <button
              onClick={() => setCurrentView('router')}
              className="text-sky-400 hover:text-sky-300 font-semibold"
            >
              Details →
            </button>
          </div>
        </div>
      </div>

      {/* Active Device Quick Table */}
      <div className="p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800/80 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white">Active Devices Online</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Currently on network</p>
          </div>
          <button
            onClick={() => {
              setFilterTab('all');
              setCurrentView('devices');
            }}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            <span>All Devices</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {onlineDevices.slice(0, 6).map(d => (
            <div
              key={d.id}
              onClick={() => setSelectedDevice(d)}
              className="py-2.5 sm:py-3 flex items-center justify-between hover:bg-slate-800/40 px-1 sm:px-2 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
                  {d.customName === 'This Computer' ? (
                    <Laptop className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                  ) : (
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5 truncate">
                    <span className="truncate">{d.customName || d.hostname || d.vendor || 'Unknown'}</span>
                    {d.trusted ? (
                      <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-semibold shrink-0">
                        Trusted
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800/40 font-semibold shrink-0">
                        Unknown
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-mono mt-0.5 truncate">
                    {d.ipAddress} • {d.macAddress}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-300 px-1.5 sm:px-2 py-0.5 rounded bg-slate-800 font-mono">
                    {d.band}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {onlineDevices.length === 0 && (
            <div className="py-8 text-center text-xs sm:text-sm text-slate-400">
              No devices currently online. Tap "Sync Devices" above to scan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
