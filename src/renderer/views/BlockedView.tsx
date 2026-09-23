import React from 'react';
import { ShieldBan, CheckCircle, Smartphone } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const BlockedView: React.FC = () => {
  const { devices, unblockDevice, setSelectedDevice } = useAppStore();

  const blockedDevices = devices.filter(d => d.blocked);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full pb-8 select-none">
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <ShieldBan className="w-5 h-5 text-rose-400" />
          Blacklisted Devices
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Devices blocked from associating with your Wi-Fi via router MAC Filtering Black List
        </p>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">MAC Address</th>
                <th className="py-3 px-4">Last Known IP</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Last Seen</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {blockedDevices.map((device) => (
                <tr
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-950/30 border border-rose-800/50 flex items-center justify-center text-rose-400">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-white">
                          {device.customName || device.hostname || 'Blacklisted Device'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {device.hostname ? `Hostname: ${device.hostname}` : 'No hostname'}
                        </div>
                        {device.unblockAt && (
                          <div className="mt-1 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <span>⏱ Buka otomatis:</span>
                            <span>{new Date(device.unblockAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>({Math.max(1, Math.round((new Date(device.unblockAt).getTime() - Date.now()) / 60000))} mnt lagi)</span>
                          </div>
                        )}
                        {device.blockSchedule && !device.unblockAt && (
                          <div className="mt-1 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            <span>📅 Jadwal: {device.blockSchedule.timeStart} – {device.blockSchedule.timeStop}</span>
                          </div>
                        )}
                        {!device.unblockAt && !device.blockSchedule && (
                          <div className="mt-1 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <span>⛔ Permanen (24 Jam)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-rose-300 font-semibold">{device.macAddress}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{device.ipAddress || '—'}</td>
                  <td className="py-3.5 px-4 text-slate-300">{device.vendor}</td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {device.unblockAt
                      ? new Date(device.unblockAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(device.lastSeen).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => unblockDevice(device.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
                    >
                      Unblock Device
                    </button>
                  </td>
                </tr>
              ))}

              {blockedDevices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CheckCircle className="w-8 h-8 text-emerald-500/60" />
                      <div className="text-sm font-semibold text-slate-200">No Blocked Devices</div>
                      <div className="text-xs text-slate-500 max-w-sm">
                        All recognized and connected devices are currently permitted on your network.
                      </div>
                    </div>
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
