import React, { useState } from 'react';
import { AlertTriangle, ShieldBan, X, Smartphone, Laptop, Clock } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { BlockOptions } from '../../shared/types/ipc';

export const BlockConfirmModal: React.FC = () => {
  const { deviceToBlock, setDeviceToBlock, blockDevice, hostMacs } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Time / Schedule Options
  const [blockMode, setBlockMode] = useState<'PERMANENT' | 'DURATION' | 'SCHEDULE'>('DURATION');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [customMinutes, setCustomMinutes] = useState<string>('45');
  const [timeStart, setTimeStart] = useState<string>('22:00');
  const [timeStop, setTimeStop] = useState<string>('06:00');

  if (!deviceToBlock) return null;

  const isHost = hostMacs.includes(deviceToBlock.macAddress);

  const getEffectiveMinutes = (): number => {
    if (durationMinutes === -1) {
      const parsed = parseInt(customMinutes, 10);
      return isNaN(parsed) || parsed <= 0 ? 30 : parsed;
    }
    return durationMinutes;
  };

  const handleConfirmBlock = async () => {
    if (isHost) {
      setErrorMessage('You cannot block the device currently running WiFi Guard.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const options: BlockOptions = {
        mode: blockMode,
        durationMinutes: blockMode === 'DURATION' ? getEffectiveMinutes() : undefined,
        timeStart: blockMode === 'SCHEDULE' ? timeStart : undefined,
        timeStop: blockMode === 'SCHEDULE' ? timeStop : undefined
      };

      await blockDevice(deviceToBlock.id, options);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to apply MAC filter on router.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 select-none">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-3 text-rose-400">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <ShieldBan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Block Device</h3>
              <p className="text-xs text-slate-400">Add device to router MAC Blacklist</p>
            </div>
          </div>
          <button
            onClick={() => setDeviceToBlock(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Device Summary Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800/80">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                {isHost ? <Laptop className="w-5 h-5 text-sky-400" /> : <Smartphone className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-bold text-sm text-white">
                  {deviceToBlock.customName || deviceToBlock.hostname || 'Unknown Device'}
                </div>
                <div className="text-slate-400 font-mono text-[11px]">{deviceToBlock.vendor}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">IP Address</span>
                <span className="font-mono">{deviceToBlock.ipAddress || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">MAC Address</span>
                <span className="font-mono">{deviceToBlock.macAddress}</span>
              </div>
            </div>
          </div>

          {/* Time & Duration Selector */}
          {!isHost && (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Waktu & Durasi Pemblokiran</span>
                </span>
              </div>

              {/* Mode Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setBlockMode('DURATION')}
                  className={`py-1.5 px-2 rounded-md font-medium transition-all ${
                    blockMode === 'DURATION'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⏱ Hitung Mundur
                </button>
                <button
                  type="button"
                  onClick={() => setBlockMode('SCHEDULE')}
                  className={`py-1.5 px-2 rounded-md font-medium transition-all ${
                    blockMode === 'SCHEDULE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📅 Jadwal Jam
                </button>
                <button
                  type="button"
                  onClick={() => setBlockMode('PERMANENT')}
                  className={`py-1.5 px-2 rounded-md font-medium transition-all ${
                    blockMode === 'PERMANENT'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⛔ Permanen
                </button>
              </div>

              {/* DURATION Content */}
              {blockMode === 'DURATION' && (
                <div className="space-y-2 pt-1 text-xs">
                  <div className="text-slate-400 text-[11px]">Pilih durasi blokir sementara:</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: '15 Mnt', val: 15 },
                      { label: '30 Mnt', val: 30 },
                      { label: '1 Jam', val: 60 },
                      { label: '2 Jam', val: 120 },
                      { label: '4 Jam', val: 240 },
                      { label: '8 Jam', val: 480 },
                      { label: '24 Jam', val: 1440 },
                      { label: 'Kustom', val: -1 }
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setDurationMinutes(preset.val)}
                        className={`py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                          durationMinutes === preset.val
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {durationMinutes === -1 && (
                    <div className="flex items-center space-x-2 pt-2">
                      <span className="text-slate-400 text-xs">Durasi kustom:</span>
                      <input
                        type="number"
                        min="1"
                        max="10080"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        className="w-20 px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-slate-400 text-xs">menit</span>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center justify-between">
                    <span>Otomatis dibuka kembali:</span>
                    <span className="font-bold">
                      {new Date(Date.now() + getEffectiveMinutes() * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' '}({getEffectiveMinutes()} menit lagi)
                    </span>
                  </div>
                </div>
              )}

              {/* SCHEDULE Content */}
              {blockMode === 'SCHEDULE' && (
                <div className="space-y-2 pt-1 text-xs">
                  <div className="text-slate-400 text-[11px]">
                    Atur jam blokir harian (otomatis aktif di router fisik):
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1">JAM MULAI BLOKIR</label>
                      <input
                        type="time"
                        value={timeStart}
                        onChange={(e) => setTimeStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1">JAM BUKA BLOKIR</label>
                      <input
                        type="time"
                        value={timeStop}
                        onChange={(e) => setTimeStop(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px]">
                    💡 <strong>Jadwal Mandiri:</strong> Router FiberHome akan otomatis memblokir dari jam {timeStart} s/d {timeStop} setiap hari bahkan jika laptop Anda mati.
                  </div>
                </div>
              )}

              {/* PERMANENT Content */}
              {blockMode === 'PERMANENT' && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                  ⛔ Perangkat akan diblokir selama 24 jam penuh tanpa batas waktu sampai Anda membukanya secara manual.
                </div>
              )}
            </div>
          )}

          {/* Self-Lockout Error Warning */}
          {isHost ? (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start space-x-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-rose-200">Self-Lockout Protection</div>
                <div>You cannot block the computer currently running WiFi Guard. Blocking yourself would sever your own network connection.</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5 pt-1">
              <input
                type="checkbox"
                id="ackChanges"
                checked={hasAcknowledged}
                onChange={(e) => setHasAcknowledged(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="ackChanges" className="text-xs text-slate-300 font-medium cursor-pointer select-none">
                Saya mengerti tindakan ini mengubah aturan MAC Blacklist di router.
              </label>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/50 flex items-center justify-end space-x-3">
          <button
            onClick={() => {
              setHasAcknowledged(false);
              setDeviceToBlock(null);
            }}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmBlock}
            disabled={isHost || isSubmitting || !hasAcknowledged}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
              isHost || !hasAcknowledged
                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            {isSubmitting ? 'Applying MAC Filter...' : 'Block Device'}
          </button>
        </div>
      </div>
    </div>
  );
};
