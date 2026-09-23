import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  ShieldCheck,
  ShieldBan,
  Edit2,
  Check,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { DeviceEvent } from '../../shared/types/device';

export const DeviceDetailDrawer: React.FC = () => {
  const {
    selectedDevice,
    setSelectedDevice,
    setDeviceToBlock,
    trustDevice,
    unblockDevice,
    renameDevice,
    hostMacs
  } = useAppStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');
  const [deviceHistory, setDeviceHistory] = useState<DeviceEvent[]>([]);

  useEffect(() => {
    if (selectedDevice) {
      setCustomNameInput(selectedDevice.customName || '');
      window.wifiGuard.devices.getHistory(selectedDevice.id).then(setDeviceHistory);
    }
  }, [selectedDevice]);

  if (!selectedDevice) return null;

  const isHost = hostMacs.includes(selectedDevice.macAddress);

  const handleSaveName = () => {
    renameDevice(selectedDevice.id, customNameInput.trim());
    setIsEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200 select-none">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              {isHost ? <Laptop className="w-5 h-5 text-sky-400" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Device Details</h3>
              <p className="text-xs text-slate-400 font-mono">{selectedDevice.macAddress}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedDevice(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Custom Name / Hostname Editor */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Device Name</span>
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  placeholder={selectedDevice.hostname || 'e.g. My Phone'}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-white">
                  {selectedDevice.customName || selectedDevice.hostname || 'Unnamed Device'}
                </div>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Rename</span>
                </button>
              </div>
            )}
            {selectedDevice.hostname && (
              <div className="text-xs text-slate-400">
                Network Hostname: <span className="text-slate-300 font-medium">{selectedDevice.hostname}</span>
              </div>
            )}
          </div>

          {/* Quick Security Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Trust State</span>
              <div className="mt-1 flex items-center gap-2">
                {selectedDevice.trusted ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    Trusted
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Untrusted / New
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Access State</span>
              <div className="mt-1 flex items-center gap-2">
                {selectedDevice.blocked ? (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                      <ShieldBan className="w-4 h-4" />
                      Blacklisted
                    </span>
                    {selectedDevice.unblockAt && (
                      <div className="text-[10px] text-amber-400 font-medium">
                        ⏱ Buka otomatis: {new Date(selectedDevice.unblockAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    {selectedDevice.blockSchedule && !selectedDevice.unblockAt && (
                      <div className="text-[10px] text-sky-400 font-medium">
                        📅 Jadwal: {selectedDevice.blockSchedule.timeStart} – {selectedDevice.blockSchedule.timeStop}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    Allowed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Network Properties</h4>
            <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 divide-y divide-slate-800/60 text-xs">
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400">IP Address</span>
                <span className="font-mono text-slate-200 font-medium">{selectedDevice.ipAddress || '—'}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400">MAC Address</span>
                <span className="font-mono text-slate-200 font-medium">{selectedDevice.macAddress}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400">Manufacturer / Vendor</span>
                <span className="text-slate-200 font-medium truncate max-w-[200px]">{selectedDevice.vendor}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400">Frequency Band</span>
                <span className="font-mono text-sky-400 font-semibold">{selectedDevice.band}</span>
              </div>
              {selectedDevice.ssid && (
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-400">Connected SSID</span>
                  <span className="text-slate-200 font-medium">{selectedDevice.ssid}</span>
                </div>
              )}
              {selectedDevice.receivingRate && (
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-400">Receiving Rate</span>
                  <span className="font-mono text-slate-200">{selectedDevice.receivingRate}bps</span>
                </div>
              )}
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400">First Seen</span>
                <span className="text-slate-400 font-mono">
                  {new Date(selectedDevice.firstSeen).toLocaleDateString()} {new Date(selectedDevice.firstSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400">Last Seen</span>
                <span className="text-slate-400 font-mono">
                  {new Date(selectedDevice.lastSeen).toLocaleDateString()} {new Date(selectedDevice.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Device Event Log</h4>
            <div className="space-y-2">
              {deviceHistory.slice(0, 5).map((evt) => (
                <div key={evt.id} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/50 text-xs flex items-center justify-between">
                  <span className="font-semibold text-slate-300">{evt.eventType.replace(/_/g, ' ')}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {deviceHistory.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-2">No historical events recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 space-y-2">
          {/* Trust Toggle */}
          <button
            onClick={() => trustDevice(selectedDevice.id, !selectedDevice.trusted)}
            className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
              selectedDevice.trusted
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{selectedDevice.trusted ? 'Revoke Trust' : 'Trust This Device'}</span>
          </button>

          {/* Block / Unblock Toggle */}
          {selectedDevice.blocked ? (
            <button
              onClick={() => unblockDevice(selectedDevice.id)}
              className="w-full py-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all"
            >
              Unblock (Remove from Router Blacklist)
            </button>
          ) : (
            <button
              onClick={() => setDeviceToBlock(selectedDevice)}
              disabled={isHost}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                isHost
                  ? 'opacity-30 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700'
                  : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border-rose-500/40'
              }`}
            >
              <ShieldBan className="w-4 h-4" />
              <span>{isHost ? 'Cannot Block Current Computer' : 'Block Device (Add to MAC Blacklist)'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
