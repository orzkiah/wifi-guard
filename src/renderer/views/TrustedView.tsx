import React from 'react';
import { ShieldCheck, Smartphone, Laptop } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const TrustedView: React.FC = () => {
  const { devices, trustDevice, setSelectedDevice, hostMacs } = useAppStore();

  const trustedDevices = devices.filter(d => d.trusted && !d.blocked);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full pb-8 select-none">
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Trusted Devices
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Whitelisted and verified devices belonging to you, family, or approved guests
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {trustedDevices.map((device) => {
          const isHost = hostMacs.includes(device.macAddress);
          return (
            <div
              key={device.id}
              onClick={() => setSelectedDevice(device)}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                    {isHost ? <Laptop className="w-5 h-5 text-sky-400" /> : <Smartphone className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{device.customName || device.hostname || 'Trusted Device'}</span>
                      {isHost && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800 font-semibold">
                          Host
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{device.macAddress}</div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    device.status === 'ONLINE'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {device.status}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">IP Address</span>
                  <span className="font-mono text-slate-300">{device.ipAddress || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Band / Rate</span>
                  <span className="text-slate-300 font-mono">{device.band} {device.receivingRate ? `(${device.receivingRate}bps)` : ''}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] text-slate-500">
                  Seen: {new Date(device.lastSeen).toLocaleDateString()}
                </span>
                <button
                  onClick={() => trustDevice(device.id, false)}
                  className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
                >
                  Revoke Trust
                </button>
              </div>
            </div>
          );
        })}

        {trustedDevices.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400">
            No trusted devices yet. Open the "All Devices" tab and click the trust icon to whitelist a device.
          </div>
        )}
      </div>
    </div>
  );
};
