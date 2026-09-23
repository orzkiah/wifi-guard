import React from 'react';
import {
  Search,
  Smartphone,
  Laptop,
  ShieldCheck,
  ShieldBan,
  ExternalLink
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const DevicesView: React.FC = () => {
  const {
    devices,
    searchQuery,
    setSearchQuery,
    filterTab,
    setFilterTab,
    setSelectedDevice,
    setDeviceToBlock,
    trustDevice,
    unblockDevice,
    hostMacs
  } = useAppStore();

  // Filtering
  const filteredDevices = devices.filter((d) => {
    // Tab filter
    if (filterTab === '2.4GHz' && d.band !== '2.4GHz') return false;
    if (filterTab === '5GHz' && d.band !== '5GHz') return false;
    if (filterTab === 'trusted' && (!d.trusted || d.blocked)) return false;
    if (filterTab === 'unknown' && (d.trusted || d.blocked)) return false;
    if (filterTab === 'blocked' && !d.blocked) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchHost = d.hostname?.toLowerCase().includes(q);
      const matchName = d.customName?.toLowerCase().includes(q);
      const matchIp = d.ipAddress?.toLowerCase().includes(q);
      const matchMac = d.macAddress?.toLowerCase().includes(q);
      const matchVendor = d.vendor?.toLowerCase().includes(q);
      return matchHost || matchName || matchIp || matchMac || matchVendor;
    }

    return true;
  });

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto overflow-y-auto h-full pb-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">Network Devices</h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Active stations on FiberHome Wi-Fi (2.4G & 5G) and DHCP leases
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hostname, IP, MAC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 border-b border-slate-800 pb-2.5 overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'all', label: 'All', count: devices.length },
            { id: '5GHz', label: '5 GHz', count: devices.filter(d => d.band === '5GHz').length },
            { id: '2.4GHz', label: '2.4 GHz', count: devices.filter(d => d.band === '2.4GHz').length },
            { id: 'trusted', label: 'Trusted', count: devices.filter(d => d.trusted && !d.blocked).length },
            { id: 'unknown', label: 'Unknown', count: devices.filter(d => !d.trusted && !d.blocked && d.status === 'ONLINE').length },
            { id: 'blocked', label: 'Blocked', count: devices.filter(d => d.blocked).length },
          ] as const
        ).map((tab) => {
          const isActive = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-sky-800 text-sky-200' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Card List (Visible on smartphone screens) */}
      <div className="md:hidden space-y-2.5">
        {filteredDevices.map((device) => {
          const isHost = hostMacs.includes(device.macAddress);
          return (
            <div
              key={device.id}
              onClick={() => setSelectedDevice(device)}
              className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/90 active:bg-slate-850 space-y-3 cursor-pointer shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
                    {isHost ? (
                      <Laptop className="w-5 h-5 text-sky-400" />
                    ) : (
                      <Smartphone className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                      <span className="truncate">{device.customName || device.hostname || 'Unknown'}</span>
                      {isHost && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800 font-semibold shrink-0">
                          Host PC
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {device.vendor || 'Network Device'}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {device.blocked ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                      BLOCKED
                    </span>
                  ) : device.trusted ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      TRUSTED
                    </span>
                  ) : device.status === 'ONLINE' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                      UNKNOWN
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                      OFFLINE
                    </span>
                  )}
                </div>
              </div>

              {/* Network Details */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                <div>
                  <span className="text-slate-500 block text-[10px]">IP ADDRESS</span>
                  <span className="font-mono text-slate-200">{device.ipAddress || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">FREQUENCY BAND</span>
                  <span className="font-mono text-sky-400 font-semibold">{device.band}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px]">MAC ADDRESS</span>
                  <span className="font-mono text-slate-300 text-[10px]">{device.macAddress}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => trustDevice(device.id, !device.trusted)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    device.trusted
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{device.trusted ? 'Trusted' : 'Trust'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  {device.blocked ? (
                    <button
                      onClick={() => unblockDevice(device.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeviceToBlock(device)}
                      disabled={isHost}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isHost
                          ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600'
                          : 'bg-rose-950/60 text-rose-400 border-rose-800 hover:bg-rose-900/60'
                      }`}
                    >
                      <ShieldBan className="w-3.5 h-3.5" />
                      <span>Block</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedDevice(device)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredDevices.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-900 rounded-xl border border-slate-800 p-6">
            No devices match the current filter.
          </div>
        )}
      </div>

      {/* Desktop Table (Hidden on small screens, shown on md and above) */}
      <div className="hidden md:block rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">MAC Address</th>
                <th className="py-3 px-4">Band</th>
                <th className="py-3 px-4">Rate</th>
                <th className="py-3 px-4">Last Seen</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredDevices.map((device) => {
                const isHost = hostMacs.includes(device.macAddress);
                return (
                  <tr
                    key={device.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedDevice(device)}
                  >
                    {/* Device & Vendor */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300">
                          {isHost ? (
                            <Laptop className="w-5 h-5 text-sky-400" />
                          ) : (
                            <Smartphone className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{device.customName || device.hostname || 'Unknown Device'}</span>
                            {isHost && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800 font-semibold">
                                Host PC
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {device.vendor}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {device.blocked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                          BLOCKED
                        </span>
                      ) : device.trusted ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          TRUSTED
                        </span>
                      ) : device.status === 'ONLINE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          UNKNOWN
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                          OFFLINE
                        </span>
                      )}
                    </td>

                    {/* IP */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {device.ipAddress || '—'}
                    </td>

                    {/* MAC */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {device.macAddress}
                    </td>

                    {/* Band */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-medium">
                        {device.band}
                      </span>
                    </td>

                    {/* Receiving Rate */}
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {device.receivingRate ? `${device.receivingRate}bps` : '—'}
                    </td>

                    {/* Last Seen */}
                    <td className="py-3 px-4 text-slate-400">
                      {device.status === 'ONLINE' ? (
                        <span className="text-emerald-400 font-medium">Now</span>
                      ) : (
                        new Date(device.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        {/* Trust / Untrust Button */}
                        <button
                          onClick={() => trustDevice(device.id, !device.trusted)}
                          title={device.trusted ? 'Mark Untrusted' : 'Mark Trusted'}
                          className={`p-1.5 rounded-lg border text-xs transition-all ${
                            device.trusted
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 hover:bg-emerald-900/50'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-emerald-400'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>

                        {/* Block / Unblock Button */}
                        {device.blocked ? (
                          <button
                            onClick={() => unblockDevice(device.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px]"
                          >
                            Unblock
                          </button>
                        ) : (
                          <button
                            onClick={() => setDeviceToBlock(device)}
                            disabled={isHost}
                            title={isHost ? 'Cannot block host computer' : 'Block via MAC blacklist'}
                            className={`p-1.5 rounded-lg border text-xs transition-all ${
                              isHost
                                ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600'
                                : 'bg-rose-950/40 text-rose-400 border-rose-800/60 hover:bg-rose-900/60'
                            }`}
                          >
                            <ShieldBan className="w-4 h-4" />
                          </button>
                        )}

                        {/* Detail Drawer Opener */}
                        <button
                          onClick={() => setSelectedDevice(device)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    No devices match the current filter or search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
