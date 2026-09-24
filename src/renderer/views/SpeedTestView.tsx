import React, { useState, useEffect } from 'react';
import {
  Gauge,
  ArrowDown,
  ArrowUp,
  Activity,
  Wifi,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Tv,
  Gamepad2,
  Video,
  AlertCircle,
  Play,
  Square,
  Check
} from 'lucide-react';
import {
  speedTestService,
  SpeedTestProgress,
  SpeedTestResult,
  SpeedTestStage
} from '../services/SpeedTestService';
import { useAppStore } from '../stores/useAppStore';

export const SpeedTestView: React.FC = () => {
  const { routerStatus } = useAppStore();
  const [testing, setTesting] = useState(false);
  const [stage, setStage] = useState<SpeedTestStage>('idle');
  const [progressPercent, setProgressPercent] = useState(0);

  const [ping, setPing] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [liveGaugeSpeed, setLiveGaugeSpeed] = useState(0);
  const [serverInfo, setServerInfo] = useState<{ ip: string; city: string; country: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedGateway, setDetectedGateway] = useState<string>('192.168.1.1');

  const [history, setHistory] = useState<SpeedTestResult[]>([]);

  useEffect(() => {
    setHistory(speedTestService.getHistory());

    // Auto-detect connected Wi-Fi Gateway
    if (window.wifiGuard?.router?.detectGateway) {
      window.wifiGuard.router
        .detectGateway()
        .then((gw) => {
          if (gw) setDetectedGateway(gw);
        })
        .catch(() => {});
    }
  }, []);

  const handleStartTest = async () => {
    setTesting(true);
    setStage('ping');
    setProgressPercent(0);
    setPing(0);
    setJitter(0);
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setLiveGaugeSpeed(0);
    setErrorMessage(null);

    try {
      await speedTestService.runTest((p: SpeedTestProgress) => {
        setStage(p.stage);
        setProgressPercent(p.percent);
        setPing(p.currentPing);
        setJitter(p.currentJitter);
        setDownloadSpeed(p.currentDownload);
        setUploadSpeed(p.currentUpload);
        setLiveGaugeSpeed(p.instantSpeed || (p.stage === 'download' ? p.currentDownload : p.currentUpload));
        if (p.serverInfo) {
          setServerInfo(p.serverInfo);
        }
        if (p.error) {
          setErrorMessage(p.error);
        }
      });

      setStage('completed');
      setHistory(speedTestService.getHistory());
    } catch (err: any) {
      if (err?.message !== 'Test cancelled') {
        setErrorMessage(err?.message || 'Uji kecepatan gagal');
      }
    } finally {
      setTesting(false);
      setLiveGaugeSpeed(0);
    }
  };

  const handleStopTest = () => {
    speedTestService.stop();
    setTesting(false);
    setStage('idle');
    setLiveGaugeSpeed(0);
  };

  const handleClearHistory = () => {
    if (confirm('Hapus seluruh riwayat uji kecepatan?')) {
      speedTestService.clearHistory();
      setHistory([]);
    }
  };

  // Speedometer needle angle calculation:
  // Gauge center: (130, 115). Arc spans 240 deg (from -120 deg to +120 deg).
  const maxDisplaySpeed = 100;
  const currentVal = liveGaugeSpeed > 0 ? liveGaugeSpeed : (stage === 'completed' ? downloadSpeed : 0);
  const clampedSpeed = Math.min(maxDisplaySpeed, currentVal);
  const needleRotation = -120 + (clampedSpeed / maxDisplaySpeed) * 240;

  // Quality evaluation without brand names
  const getGamingRating = (ms: number) => {
    if (ms === 0) return { label: 'Menunggu Pengujian', badge: 'bg-slate-800 text-slate-400 border-slate-700' };
    if (ms < 30) return { label: 'Sangat Responsif (< 30 ms)', badge: 'bg-emerald-950/80 border-emerald-800/40 text-emerald-400' };
    if (ms < 60) return { label: 'Baik (< 60 ms)', badge: 'bg-cyan-950/80 border-cyan-800/40 text-cyan-400' };
    if (ms < 100) return { label: 'Cukup (< 100 ms)', badge: 'bg-amber-950/80 border-amber-800/40 text-amber-400' };
    return { label: 'Tinggi (> 100 ms)', badge: 'bg-rose-950/80 border-rose-800/40 text-rose-400' };
  };

  const getStreamingRating = (mbps: number) => {
    if (mbps === 0) return { label: 'Menunggu Pengujian', badge: 'bg-slate-800 text-slate-400 border-slate-700' };
    if (mbps >= 35) return { label: '4K Ultra HD', badge: 'bg-emerald-950/80 border-emerald-800/40 text-emerald-400' };
    if (mbps >= 15) return { label: 'Full HD 1080p', badge: 'bg-cyan-950/80 border-cyan-800/40 text-cyan-400' };
    if (mbps >= 5) return { label: 'HD 720p', badge: 'bg-amber-950/80 border-amber-800/40 text-amber-400' };
    return { label: 'Standar 480p', badge: 'bg-rose-950/80 border-rose-800/40 text-rose-400' };
  };

  const getVideoCallRating = (jit: number) => {
    if (jit === 0) return { label: 'Menunggu Pengujian', badge: 'bg-slate-800 text-slate-400 border-slate-700' };
    if (jit < 10) return { label: 'Ultra Stabil', badge: 'bg-emerald-950/80 border-emerald-800/40 text-emerald-400' };
    if (jit < 25) return { label: 'Stabil', badge: 'bg-cyan-950/80 border-cyan-800/40 text-cyan-400' };
    return { label: 'Fluktuatif', badge: 'bg-amber-950/80 border-amber-800/40 text-amber-400' };
  };

  const gamingInfo = getGamingRating(ping);
  const streamInfo = getStreamingRating(downloadSpeed);
  const videoCallInfo = getVideoCallRating(jitter);

  const activeGatewayIp = routerStatus?.routerInfo?.ipAddress || detectedGateway || '192.168.1.1';

  return (
    <div className="p-3.5 sm:p-5 md:p-6 space-y-4 max-w-6xl mx-auto overflow-y-auto h-full pb-16">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/90">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Gauge className="w-5 h-5" />
            </div>
            Uji Kecepatan Internet
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Diagnostik throughput unduh, unggah, ping, dan stabilitas latensi jaringan Wi-Fi.
          </p>
        </div>

        {/* Auto Wi-Fi & Gateway Indicator Pill */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/90 px-3.5 py-2 rounded-xl self-start sm:self-auto shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-left text-xs">
            <div className="text-slate-400 text-[10px] font-medium uppercase tracking-wider flex items-center gap-1">
              <Wifi className="w-3 h-3 text-sky-400" />
              Wi-Fi Terdeteksi Otomatis
            </div>
            <div className="font-semibold text-slate-200 font-mono">
              Gateway: {activeGatewayIp}
            </div>
          </div>
        </div>
      </div>

      {/* Main Gauge & KPI Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Speedometer Gauge Card */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800/90 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-between relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 via-transparent to-transparent pointer-events-none" />

          {/* Test Stage Status Pill */}
          <div className="w-full flex items-center justify-between z-10 mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Jaringan Siap Digunakan
            </span>

            <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              stage === 'idle' ? 'bg-slate-800 text-slate-400 border-slate-700' :
              stage === 'ping' ? 'bg-amber-950/80 text-amber-400 border-amber-800/40 animate-pulse' :
              stage === 'download' ? 'bg-sky-950/80 text-sky-400 border-sky-800/40 animate-pulse' :
              stage === 'upload' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40 animate-pulse' :
              stage === 'completed' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40' :
              'bg-rose-950/80 text-rose-400 border-rose-800/40'
            }`}>
              {stage === 'idle' && 'SIAP DIUJI'}
              {stage === 'ping' && 'MENGUKUR PING...'}
              {stage === 'download' && 'MENGUJI DOWNLOAD...'}
              {stage === 'upload' && 'MENGUJI UPLOAD...'}
              {stage === 'completed' && 'PENGUJIAN SELESAI'}
              {stage === 'error' && 'TERJADI KESALAHAN'}
            </div>
          </div>

          {/* Speedometer SVG Component (Balanced & Tidy) */}
          <div className="relative my-2 flex flex-col items-center justify-center w-full max-w-[340px] sm:max-w-[380px]">
            <svg viewBox="0 0 260 165" className="w-full h-auto overflow-visible select-none">
              <defs>
                <linearGradient id="speedGradientClean" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="60%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Background Arc */}
              <path
                d="M 40 145 A 90 90 0 0 1 220 145"
                fill="none"
                stroke="#1e293b"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Progress Arc */}
              <path
                d="M 40 145 A 90 90 0 0 1 220 145"
                fill="none"
                stroke="url(#speedGradientClean)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="282.74"
                strokeDashoffset={282.74 - (282.74 * (clampedSpeed / maxDisplaySpeed))}
                style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
              />

              {/* Scale Tick Markers */}
              <text x="32" y="152" textAnchor="end" fill="#64748b" fontSize="9" fontWeight="600">0</text>
              <text x="58" y="82" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">25</text>
              <text x="130" y="44" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">50</text>
              <text x="202" y="82" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">75</text>
              <text x="228" y="152" textAnchor="start" fill="#64748b" fontSize="9" fontWeight="600">100+</text>

              {/* Needle Indicator */}
              <g transform="translate(130, 145)">
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-84"
                  stroke="#f8fafc"
                  strokeWidth="3"
                  strokeLinecap="round"
                  transform={`rotate(${needleRotation})`}
                  style={{
                    transformOrigin: '0 0',
                    transition: 'transform 0.15s ease-out',
                    filter: 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.7))'
                  }}
                />
                {/* Sleek Needle Hub */}
                <circle cx="0" cy="0" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
              </g>
            </svg>

            {/* Live Numerical Display - Positioned Cleanly Below Gauge Without Overlapping */}
            <div className="text-center mt-3 z-10">
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline justify-center gap-1.5">
                <span>
                  {liveGaugeSpeed > 0
                    ? liveGaugeSpeed.toFixed(1)
                    : stage === 'completed'
                    ? downloadSpeed.toFixed(1)
                    : '0.0'}
                </span>
                <span className="text-sm sm:text-base font-bold text-sky-400">Mbps</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {stage === 'download' && 'Kecepatan Unduh Saat Ini'}
                {stage === 'upload' && 'Kecepatan Unggah Saat Ini'}
                {stage === 'ping' && 'Mengukur Waktu Respons Jaringan...'}
                {stage === 'completed' && 'Kecepatan Unduh Puncak'}
                {stage === 'idle' && 'Tekan tombol Mulai di bawah'}
                {stage === 'error' && 'Terjadi gangguan koneksi'}
              </p>
            </div>
          </div>

          {/* Progress Bar (0 to 100%) */}
          <div className="w-full space-y-1.5 my-3 z-10">
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>Kemajuan Pengujian</span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="w-full flex items-center justify-center gap-3 pt-1 z-10">
            {!testing ? (
              <button
                onClick={handleStartTest}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm tracking-wider transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 group active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950 transition-transform group-hover:scale-110" />
                MULAI UJI KECEPATAN
              </button>
            ) : (
              <button
                onClick={handleStopTest}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm tracking-wider transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 active:scale-95 border border-rose-500/30 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                HENTIKAN PENGUJIAN
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="mt-3 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Right Column: 4 Real-time Metrics Cards */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Download Speed Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/90 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <ArrowDown className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Download</span>
                  <div className="text-[10px] text-slate-400">Kecepatan Unduh</div>
                </div>
              </div>
              {stage === 'download' && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {downloadSpeed > 0 ? downloadSpeed.toFixed(2) : '--'}
              </div>
              <div className="text-xs font-bold text-sky-400">Mbps</div>
            </div>
          </div>

          {/* Upload Speed Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/90 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <ArrowUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Upload</span>
                  <div className="text-[10px] text-slate-400">Kecepatan Unggah</div>
                </div>
              </div>
              {stage === 'upload' && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {uploadSpeed > 0 ? uploadSpeed.toFixed(2) : '--'}
              </div>
              <div className="text-xs font-bold text-emerald-400">Mbps</div>
            </div>
          </div>

          {/* Ping Latency & Jitter Double Card */}
          <div className="grid grid-cols-2 gap-3">
            {/* Ping */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/90 shadow-md">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Ping</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-xl font-black text-white">
                  {ping > 0 ? ping : '--'}
                </div>
                <div className="text-xs text-amber-400 font-semibold">ms</div>
              </div>
            </div>

            {/* Jitter */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/90 shadow-md">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Wifi className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Jitter</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-xl font-black text-white">
                  {jitter > 0 ? jitter : '--'}
                </div>
                <div className="text-xs text-indigo-400 font-semibold">ms</div>
              </div>
            </div>
          </div>

          {/* Connection Metadata Footer */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span>Alamat IP Publik:</span>
              <span className="font-mono text-slate-200 font-semibold">
                {serverInfo?.ip || 'Mendeteksi...'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Router Gateway:</span>
              <span className="font-mono text-slate-200 font-semibold">
                {activeGatewayIp}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Server Pengujian:</span>
              <span className="text-slate-300">
                {serverInfo ? `${serverInfo.city} (${serverInfo.country})` : 'Cloudflare Edge CDN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Network Quality Assessment (Clean, No Brands) */}
      <div className="space-y-2.5 pt-1">
        <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Kesesuaian Layanan & Performa Aplikasi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Game Online Card */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/90 flex flex-col justify-between gap-2.5 shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Game Online</h4>
            </div>
            <div>
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${gamingInfo.badge}`}>
                {gamingInfo.label}
              </span>
            </div>
          </div>

          {/* Streaming Card */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/90 flex flex-col justify-between gap-2.5 shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Tv className="w-4 h-4" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Streaming</h4>
            </div>
            <div>
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${streamInfo.badge}`}>
                {streamInfo.label}
              </span>
            </div>
          </div>

          {/* Video Call Card */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/90 flex flex-col justify-between gap-2.5 shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Video Call</h4>
            </div>
            <div>
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${videoCallInfo.badge}`}>
                {videoCallInfo.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800/90 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-sky-400" />
            Riwayat Uji Kecepatan ({history.length})
          </h3>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Riwayat</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            Belum ada riwayat uji kecepatan. Tekan tombol &quot;Mulai Uji Kecepatan&quot; di atas untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2 px-3">Waktu</th>
                  <th className="py-2 px-3">Unduh</th>
                  <th className="py-2 px-3">Unggah</th>
                  <th className="py-2 px-3">Ping</th>
                  <th className="py-2 px-3">Jitter</th>
                  <th className="py-2 px-3">Lokasi Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 text-slate-300 font-mono">
                      {new Date(item.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2 px-3 font-bold text-sky-400 font-mono">
                      {item.downloadMbps.toFixed(2)} Mbps
                    </td>
                    <td className="py-2 px-3 font-bold text-emerald-400 font-mono">
                      {item.uploadMbps.toFixed(2)} Mbps
                    </td>
                    <td className="py-2 px-3 text-amber-300 font-mono">
                      {item.pingMs} ms
                    </td>
                    <td className="py-2 px-3 text-slate-300 font-mono">
                      {item.jitterMs} ms
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {item.serverLocation || 'Cloudflare Edge'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
