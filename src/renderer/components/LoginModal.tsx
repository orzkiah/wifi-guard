import React, { useState, useEffect } from 'react';
import { KeyRound, X, AlertCircle, CheckCircle2, Sparkles, LogOut } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, loginRouter, logoutRouter, routerStatus, settings } = useAppStore();

  const [ipAddress, setIpAddress] = useState('192.168.1.1');
  const [username, setUsername] = useState('user');
  const [password, setPassword] = useState('user1234');
  const [remember, setRemember] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoginModalOpen) {
      if (settings) {
        setIpAddress(settings.routerIp || '192.168.1.1');
        setUsername(settings.routerUsername || 'user');
        setRemember(settings.rememberCredentials);
      }
      // Auto detect gateway
      setIsDetecting(true);
      window.wifiGuard.router
        .detectGateway()
        .then((gw) => {
          if (gw) setIpAddress(gw);
        })
        .finally(() => setIsDetecting(false));
    }
  }, [isLoginModalOpen, settings]);

  if (!isLoginModalOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await window.wifiGuard.router.testConnection(ipAddress);
      setTestResult({
        success: res.success,
        message: res.message
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await loginRouter({
        ipAddress: ipAddress.trim(),
        username: username.trim(),
        password,
        remember
      });

      if (!res.success) {
        setLoginError(res.message || 'Unable to authenticate with router.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 select-none">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-3 text-sky-400">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Router Authentication</h3>
              <p className="text-xs text-slate-400">FiberHome HG6145D2 Gateway</p>
            </div>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {/* Active Session Status & Logout */}
          {routerStatus?.connected && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-200">Sesi Router Sedang Aktif</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await logoutRouter();
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 text-[11px] font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <LogOut className="w-3 h-3 text-rose-400" />
                <span>Logout Sesi</span>
              </button>
            </div>
          )}

          {/* Router IP & Auto Detect */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Router IP Address</label>
              {isDetecting ? (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-400 animate-spin" />
                  Detecting gateway...
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400 font-medium">Gateway Detected</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.1.1"
                required
                className="flex-1 px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-white font-mono outline-none"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all whitespace-nowrap"
              >
                {isTesting ? 'Testing...' : 'Test IP'}
              </button>
            </div>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
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

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-white outline-none"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-white outline-none"
            />
          </div>

          {/* Remember Credentials Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="rememberCreds"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="rememberCreds" className="text-xs text-slate-400 cursor-pointer">
              Remember credentials safely (encrypted with OS keychain)
            </label>
          </div>

          {/* Login Error Display */}
          {loginError && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 disabled:opacity-50"
            >
              {isLoggingIn ? 'Authenticating...' : 'Connect to Router'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
