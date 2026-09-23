import React, { useState, useEffect } from 'react';
import { Router, Cpu, Shield, KeyRound, Wifi, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { MacFilterConfig } from '../../shared/types/router';

export const RouterView: React.FC = () => {
  const { routerStatus, setIsLoginModalOpen, devices } = useAppStore();

  const [macConfig, setMacConfig] = useState<MacFilterConfig | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    window.wifiGuard.router.getMacFilterConfig().then(setMacConfig).catch(() => {});
  }, [routerStatus]);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await window.wifiGuard.router.testConnection();
      setTestResult({ success: res.success, message: res.message });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const clients24 = devices.filter(d => d.band === '2.4GHz' && d.status === 'ONLINE');
  const clients5G = devices.filter(d => d.band === '5GHz' && d.status === 'ONLINE');

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full pb-8 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Router className="w-5 h-5 text-sky-400" />
            Router Hardware & Status
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            FiberHome GPON ONT Gateway Diagnostics and MAC Filter Control
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>{isTesting ? 'Pinging...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-sky-600/20"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Re-Authenticate</span>
          </button>
        </div>
      </div>

      {testResult && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center space-x-2.5 ${
            testResult.success
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
              : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Device Information */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            Device Information
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Vendor</span>
              <span className="font-semibold text-white">FiberHome</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Model</span>
              <span className="font-semibold text-white">HG6145D2</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Firmware</span>
              <span className="font-mono text-slate-200">RP3478</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Hardware Version</span>
              <span className="font-mono text-slate-200">WKE2.094.443A11</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Operator Profile</span>
              <span className="font-semibold text-slate-200">IDN_IMI (Indonesia)</span>
            </div>
          </div>
        </div>

        {/* IP & Gateway */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Network Topology
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Gateway IP</span>
              <span className="font-mono font-bold text-sky-400">192.168.1.1</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Subnet Mask</span>
              <span className="font-mono text-slate-200">255.255.255.0 (/24)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Web Administration</span>
              <span className="font-mono text-slate-200">http://192.168.1.1/</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Connection State</span>
              <span className="font-semibold text-emerald-400">Online & Synchronized</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Last Latency</span>
              <span className="font-mono text-slate-200">{routerStatus?.latencyMs || 15} ms</span>
            </div>
          </div>
        </div>

        {/* Security & MAC Filtering */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            MAC Filtering Security
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">MAC Filtering Status</span>
              <span className="font-bold text-amber-400">
                {macConfig?.enabled ? 'ENABLED' : 'DISABLED (Ready)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Filter Mode</span>
              <span className="font-semibold text-slate-200">Black List</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Blacklisted Entries</span>
              <span className="font-mono font-bold text-rose-400">
                {macConfig?.entries?.length || 0} rules active
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Self-Lockout Guard</span>
              <span className="font-semibold text-emerald-400">Active (Host Protected)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wireless Bands Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Wifi className="w-4 h-4" />
              <h4 className="text-sm font-bold text-white">5 GHz High-Speed Wireless</h4>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400">{clients5G.length} Stations Connected</span>
          </div>
          <p className="text-xs text-slate-400">
            Provides maximum throughput and lowest interference for 802.11ac/ax devices.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Wifi className="w-4 h-4" />
              <h4 className="text-sm font-bold text-white">2.4 GHz Long-Range Wireless</h4>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">{clients24.length} Stations Connected</span>
          </div>
          <p className="text-xs text-slate-400">
            Extended range suitable for smart home, IoT, and long-distance mobile devices.
          </p>
        </div>
      </div>
    </div>
  );
};
