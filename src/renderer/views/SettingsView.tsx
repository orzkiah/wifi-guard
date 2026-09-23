import React, { useState, useEffect } from 'react';
import { Settings, Sliders, Bell, Shield, Save, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useAppStore();

  const [interval, setInterval] = useState(5);
  const [notifications, setNotifications] = useState(true);
  const [unknownAlert, setUnknownAlert] = useState(true);
  const [routerIp, setRouterIp] = useState('192.168.1.1');
  const [useMock, setUseMock] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setInterval(settings.autoRefreshInterval);
      setNotifications(settings.notificationsEnabled);
      setUnknownAlert(settings.unknownDeviceAlert);
      setRouterIp(settings.routerIp);
      setUseMock(settings.useMockAdapter);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      autoRefreshInterval: Number(interval),
      notificationsEnabled: notifications,
      unknownDeviceAlert: unknownAlert,
      routerIp: routerIp.trim(),
      useMockAdapter: useMock
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto overflow-y-auto h-full pb-8 select-none">
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-400" />
          Application Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize discovery polling frequencies, system alerts, and router connectivity modes
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Polling & Refresh Section */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            Device Polling & Scan Interval
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Auto-Refresh Frequency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { val: 5, label: '5 Seconds' },
                { val: 10, label: '10 Seconds' },
                { val: 30, label: '30 Seconds' },
                { val: 60, label: '60 Seconds' },
                { val: 0, label: 'Manual Only' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setInterval(opt.val)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    interval === opt.val
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              WiFi Guard queries the router in a controlled, non-overlapping loop with exponential backoff if the router is busy.
            </p>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Desktop Notifications
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-slate-200">Enable Desktop Notifications</div>
                <div className="text-[11px] text-slate-400">Show native OS toasts for important events</div>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-slate-200">New / Unknown Device Alert</div>
                <div className="text-[11px] text-slate-400">Alert immediately when an unrecognized device associates with Wi-Fi</div>
              </div>
              <input
                type="checkbox"
                checked={unknownAlert}
                onChange={(e) => setUnknownAlert(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Router & Adapter Engine Section */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Router Connection & Adapter Architecture
          </h3>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Default Router IP</label>
              <input
                type="text"
                value={routerIp}
                onChange={(e) => setRouterIp(e.target.value)}
                placeholder="192.168.1.1"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 text-xs text-white font-mono outline-none"
              />
            </div>

            <label className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/60 cursor-pointer">
              <div>
                <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <span>Enable Mock Router Adapter (Demo / Offline Mode)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Simulates FiberHome HG6145D2 with sample 2.4 GHz and 5 GHz devices for testing without altering physical router configuration.
                </div>
              </div>
              <input
                type="checkbox"
                checked={useMock}
                onChange={(e) => setUseMock(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-sky-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
