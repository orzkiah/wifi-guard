import React, { useState, useEffect } from 'react';
import {
  Gauge,
  ArrowDown,
  ArrowUp,
  Activity,
  Wifi,
  Globe,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Tv,
  Gamepad2,
  Video,
  AlertCircle,
  Play,
  Square
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

  const [history, setHistory] = useState<SpeedTestResult[]>([]);

  useEffect(() => {
    setHistory(speedTestService.getHistory());
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

  // Speedometer needle angle calculation (from -120deg at 0 Mbps to +120deg at 100+ Mbps)
  // Max scale: 100 Mbps (log/linear hybrid)
  const maxDisplaySpeed = 100;
  const clampedSpeed = Math.min(maxDisplaySpeed, liveGaugeSpeed > 0 ? liveGaugeSpeed : (stage === 'completed' ? downloadSpeed : 0));
  const needleRotation = -120 + (clampedSpeed / maxDisplaySpeed) * 240;

  // Quality evaluation
  const getGamingRating = (ms: number) => {
    if (ms === 0) return { label: 'Menunggu Pengujian', color: 'text-slate-400', badge: 'bg-slate-800' };
    if (ms < 30) return { label: 'Sangat Rendah (Pro Gaming)', color: 'text-emerald-400', badge: 'bg-emerald-950/80 border-emerald-800/40 text-emerald-400' };
    if (ms < 60) return { label: 'Baik (Lancar Tanpa Lag)', color: 'text-cyan-400', badge: 'bg-cyan-950/80 border-cyan-800/40 text-cyan-400' };
    if (ms < 100) return { label: 'Cukup (Sedikit Delay)', color: 'text-amber-400', badge: 'bg-amber-950/80 border-amber-800/40 text-amber-400' };
    return { label: 'Tinggi (Potensi Lag)', color: 'text-rose-400', badge: 'bg-rose-950/80 border-rose-800/40 text-rose-400' };
  };

  const getStreamingRating = (mbps: number) => {
    if (mbps === 0) return { label: 'Menunggu Pengujian', color: 'text-slate-400', badge: 'bg-slate-800' };
    if (mbps >= 35) return { label: '4K Ultra HD (Multi-Layar)', color: 'text-emerald-400', badge: 'bg-emerald-950/80 border-emerald-800/40 text-emerald-400' };
    if (mbps >= 15) return { label: 'Full HD 1080p (Sangat Lancar)', color: 'text-cyan-400', badge: 'bg-cyan-950/80 border-cyan-800/40 text-cyan-400' };
    if (mbps >= 5) return { label: 'HD 720p', color: 'text-amber-400', badge: 'bg-amber-950/80 border-amber-800/40 text-amber-400' };
    return { label: 'Standar 480p', color: 'text-rose-400', badge: 'bg-rose-950/80 border-rose-800/40 text-rose-400' };
  };

  const getVideoCallRating = (jit: number) => {
    if (jit === 0) return { label: 'Menunggu Pengujian', color: 'text-slate-400', badge: 'bg-slate-800' };
    if (jit < 10) return { label: 'Ultra Stabil (Zoom/Meet HD)', color: 'text-emerald-400', badge: 'bg-emerald-950/80 border-emerald-800/40 text-emerald-400' };
    if (jit < 25) return { label: 'Stabil (Kualitas Bagus)', color: 'text-cyan-400', badge: 'bg-cyan-950/80 border-cyan-800/40 text-cyan-400' };
    return { label: 'Fluktuatif', color: 'text-amber-400', badge: 'bg-amber-950/80 border-amber-800/40 text-amber-400' };
  };

  const gamingInfo = getGamingRating(ping);
  const streamInfo = getStreamingRating(downloadSpeed);
  const videoCallInfo = getVideoCallRating(jitter);

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto overflow-y-auto h-full pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Gauge className="w-5 h-5" />
            </div>
            Uji Kecepatan Internet
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pengukuran real-time Throughput Unduh, Unggah, Latensi Ping & Jitter jaringan Anda.
          </p>
        </div>

        {/* Server & Network Badge */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <Globe className="w-4 h-4 text-sky-400 shrink-0" />
          <div className="text-left text-xs">
            <div className="text-slate-400 text-[10px]">Server Node</div>
            <div className="font-semibold text-slate-200">
              {serverInfo ? `${serverInfo.city} (${serverInfo.country})` : 'Cloudflare Edge CDN'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Gauge & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Interactive Speedometer Gauge Card */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800/90 rounded-2xl p-5 sm:p-7 flex flex-col items-center justify-between relative overflow-hidden shadow-xl">
          {/* Subtle Cyberpunk Grid Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 via-transparent to-transparent pointer-events-none" />

          {/* Test Stage Status Pill */}
          <div className="w-full flex items-center justify-between z-10">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-sky-400" />
              {routerStatus?.routerInfo?.ipAddress || '192.168.1.1'} Gateway
            </span>

            <div className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
              stage === 'idle' ? 'bg-slate-800 text-slate-400 border-slate-700' :
              stage === 'ping' ? 'bg-amber-950/80 text-amber-400 border-amber-800/40 animate-pulse' :
              stage === 'download' ? 'bg-sky-950/80 text-sky-400 border-sky-800/40 animate-pulse' :
              stage === 'upload' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40 animate-pulse' :
              stage === 'completed' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40' :
              'bg-rose-950/80 text-rose-400 border-rose-800/40'
            }`}>
              {stage === 'idle' && 'SIAP DIUJI'}
              {stage === 'ping' && 'PENGUKURAN PING...'}
              {stage === 'download' && 'MENGUJI UNDUH (DOWNLOAD)...'}
              {stage === 'upload' && 'MENGUJI UNGGAH (UPLOAD)...'}
              {stage === 'completed' && 'PENGUJIAN SELESAI'}
              {stage === 'error' && 'TERJADI KESALAHAN'}
            </div>
          </div>

          {/* Speedometer SVG Component */}
          <div className="relative my-4 flex flex-col items-center justify-center w-full max-w-[340px] sm:max-w-[400px]">
            <svg viewBox="0 0 240 150" className="w-full h-auto overflow-visible select-none">
              {/* Background Arc */}
              <path
                d="M 30 140 A 90 90 0 0 1 210 140"
                fill="none"
                stroke="#1e293b"
                strokeWidth="16"
                strokeLinecap="round"
              />

              {/* Progress Arc */}
              <path
                d="M 30 140 A 90 90 0 0 1 210 140"
                fill="none"
                stroke="url(#speedGradient)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray="282.74"
                strokeDashoffset={282.74 - (282.74 * (clampedSpeed / maxDisplaySpeed))}
                style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
              />

              {/* Gradients */}
              <defs>
                <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="60%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Scale Tick Markers */}
              <text x="25" y="146" textAnchor="end" fill="#64748b" fontSize="8" fontWeight="600">0</text>
              <text x="50" y="78" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">25</text>
              <text x="120" y="44" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">50</text>
              <text x="190" y="78" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">75</text>
              <text x="215" y="146" textAnchor="start" fill="#64748b" fontSize="8" fontWeight="600">100+</text>

              {/* Needle Indicator */}
              <g transform="translate(120, 140)">
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-82"
                  stroke="#f8fafc"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  transform={`rotate(${needleRotation})`}
                  style={{
                    transformOrigin: '0 0',
                    transition: 'transform 0.15s ease-out',
                    filter: 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.8))'
                  }}
                />
                <circle cx="0" cy="0" r="7" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
              </g>
            </svg>

            {/* Live Numerical Display in Gauge Hub */}
            <div className="text-center -mt-6 sm:-mt-8 z-10">
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline justify-center gap-1">
                <span>
                  {liveGaugeSpeed > 0
                    ? liveGaugeSpeed.toFixed(1)
                    : stage === 'completed'
                    ? downloadSpeed.toFixed(1)
                    : '0.0'}
                </span>
                <span className="text-sm sm:text-base font-bold text-sky-400">Mbps</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
                {stage === 'download' && 'Kecepatan Unduh Saat Ini'}
                {stage === 'upload' && 'Kecepatan Unggah Saat Ini'}
                {stage === 'ping' && 'Mengukur Waktu Respons...'}
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
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="w-full flex items-center justify-center gap-3 pt-2 z-10">
            {!testing ? (
              <button
                onClick={handleStartTest}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 group active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950 transition-transform group-hover:scale-110" />
                MULAI UJI KECEPATAN
              </button>
            ) : (
              <button
                onClick={handleStopTest}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 active:scale-95 border border-rose-500/30"
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
        <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-4">
          {/* Download Speed Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800/90 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <ArrowDown className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Download</span>
                  <div className="text-[11px] text-slate-400">Kecepatan Unduh</div>
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
              <div className="text-2xl sm:text-3xl font-black text-white">
                {downloadSpeed > 0 ? downloadSpeed.toFixed(2) : '--'}
              </div>
              <div className="text-xs font-bold text-sky-400">Mbps</div>
            </div>
          </div>

          {/* Upload Speed Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800/90 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <ArrowUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upload</span>
                  <div className="text-[11px] text-slate-400">Kecepatan Unggah</div>
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
              <div className="text-2xl sm:text-3xl font-black text-white">
                {uploadSpeed > 0 ? uploadSpeed.toFixed(2) : '--'}
              </div>
              <div className="text-xs font-bold text-emerald-400">Mbps</div>
            </div>
          </div>

          {/* Ping Latency & Jitter Double Card */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Ping */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/90 shadow-md">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Ping</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-xl sm:text-2xl font-black text-white">
                  {ping > 0 ? ping : '--'}
                </div>
                <div className="text-xs text-amber-400 font-semibold">ms</div>
              </div>
            </div>

            {/* Jitter */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/90 shadow-md">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Wifi className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Jitter</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-xl sm:text-2xl font-black text-white">
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
                {routerStatus?.routerInfo?.ipAddress || '192.168.1.1'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Network Quality & Application Readiness Assessment */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Kesesuaian Layanan & Performa Aplikasi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Online Gaming */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Game Online & Esport</h4>
                  <div className="text-[10px] text-slate-400">Mobile Legends, Valorant, PUBG</div>
                </div>
              </div>
            </div>
            <div className="pt-1">
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${gamingInfo.badge}`}>
                {gamingInfo.label}
              </span>
            </div>
          </div>

          {/* Video Streaming */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Streaming Video & Film</h4>
                  <div className="text-[10px] text-slate-400">YouTube 4K, Netflix, Disney+</div>
                </div>
              </div>
            </div>
            <div className="pt-1">
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${streamInfo.badge}`}>
                {streamInfo.label}
              </span>
            </div>
          </div>

          {/* Video Conference */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Video Call & Meeting</h4>
                  <div className="text-[10px] text-slate-400">Zoom, Google Meet, Teams</div>
                </div>
              </div>
            </div>
            <div className="pt-1">
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${videoCallInfo.badge}`}>
                {videoCallInfo.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800/90 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-sky-400" />
            Riwayat Uji Kecepatan ({history.length})
          </h3>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Riwayat</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Belum ada riwayat uji kecepatan. Tekan tombol &quot;Mulai Uji Kecepatan&quot; di atas untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Unduh</th>
                  <th className="py-2.5 px-3">Unggah</th>
                  <th className="py-2.5 px-3">Ping</th>
                  <th className="py-2.5 px-3">Jitter</th>
                  <th className="py-2.5 px-3">Lokasi Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-300 font-mono">
                      {new Date(item.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-sky-400">
                      {item.downloadMbps.toFixed(2)} Mbps
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">
                      {item.uploadMbps.toFixed(2)} Mbps
                    </td>
                    <td className="py-2.5 px-3 text-amber-300 font-mono">
                      {item.pingMs} ms
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">
                      {item.jitterMs} ms
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
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
