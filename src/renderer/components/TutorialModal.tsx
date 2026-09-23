import React, { useState } from 'react';
import {
  Shield,
  Wifi,
  UserCheck,
  ShieldBan,
  LogOut,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  HelpCircle
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const TutorialModal: React.FC = () => {
  const { isTutorialModalOpen, setIsTutorialModalOpen, setCurrentView } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isTutorialModalOpen) return null;

  const steps = [
    {
      step: 1,
      badge: 'Selamat Datang',
      title: 'Selamat Datang di WiFi Guard',
      subtitle: 'Pelindung Jaringan & Akses Wi-Fi Mandiri Anda',
      icon: <Shield className="w-10 h-10 text-sky-400" />,
      iconBg: 'from-sky-600/20 to-cyan-500/20 border-sky-500/30',
      description:
        'WiFi Guard membantu Anda mengamankan jaringan Wi-Fi rumah atau kantor kecil secara langsung dari HP atau laptop. Anda dapat melihat siapa saja yang terhubung, mendeteksi perangkat liar, serta membatasi pemakaian internet dengan mudah.',
      keyPoints: [
        'Deteksi real-time seluruh perangkat aktif (Wi-Fi 2.4G, 5G, & Kabel LAN)',
        'Pemblokiran 1-ketukan bagi penyusup atau tetangga tanpa izin',
        'Jadwal waktu blokir otomatis untuk jam tidur atau jam belajar anak'
      ]
    },
    {
      step: 2,
      badge: 'Langkah 1',
      title: 'Koneksi Wi-Fi & Login Router',
      subtitle: 'Wajib Terhubung ke Sinyal Wi-Fi yang Sama',
      icon: <Wifi className="w-10 h-10 text-emerald-400" />,
      iconBg: 'from-emerald-600/20 to-teal-500/20 border-emerald-500/30',
      description:
        'Karena alamat IP modem (192.168.1.1) adalah jaringan lokal pribadi, perangkat HP/Laptop Anda wajib tersambung ke Wi-Fi modem tersebut (bukan menggunakan kuota data seluler).',
      keyPoints: [
        'Pastikan HP/Laptop sudah terhubung ke Wi-Fi rumah Anda',
        'Tekan tombol "Router Login" di pojok kanan atas',
        'Masukkan IP (bawaan: 192.168.1.1), username, dan password modem Anda',
        'Tekan "Connect to Router" untuk memulai sinkronisasi'
      ]
    },
    {
      step: 3,
      badge: 'Langkah 2',
      title: 'Kenali Perangkat: Trusted vs Unknown',
      subtitle: 'Tandai Perangkat Keluarga & Awasi Perangkat Asing',
      icon: <UserCheck className="w-10 h-10 text-amber-400" />,
      iconBg: 'from-amber-600/20 to-yellow-500/20 border-amber-500/30',
      description:
        'Setiap perangkat yang pertama kali terdeteksi akan bertanda "Unknown" (Kuning). Ini memudahkan Anda mengenali apakah perangkat tersebut milik keluarga Anda atau penyusup.',
      keyPoints: [
        'Klik tombol "Trust" (Perisai Hijau) untuk menandai HP/Laptop keluarga',
        'Anda dapat mengubah nama perangkat (misal: "HP Ibu", "Laptop Kakak")',
        'Jika ada perangkat asing tak dikenal, periksa atau langsung blokir'
      ]
    },
    {
      step: 4,
      badge: 'Langkah 3',
      title: 'Blokir Seketika & Pasang Jadwal Waktu',
      subtitle: 'Kontrol Penuh Pemakaian Internet',
      icon: <ShieldBan className="w-10 h-10 text-rose-400" />,
      iconBg: 'from-rose-600/20 to-red-500/20 border-rose-500/30',
      description:
        'Jika menemukan perangkat yang mencurigakan, Anda dapat langsung memutuskan akses internetnya ke modem via fitur MAC Filtering.',
      keyPoints: [
        'Tekan tombol "Block" pada perangkat untuk memblokir seketika',
        'Atur "Jadwal Waktu Blokir" (misal: otomatis blokir jam 21:00 s/d 06:00)',
        'Perangkat Anda sendiri (PC Host) memiliki proteksi diri agar tidak sengaja memblokir diri sendiri'
      ]
    },
    {
      step: 5,
      badge: 'Langkah 4',
      title: 'Penting: Sesi Tunggal & Tombol Logout',
      subtitle: 'Mencegah Error "Sesi Sedang Digunakan"',
      icon: <LogOut className="w-10 h-10 text-purple-400" />,
      iconBg: 'from-purple-600/20 to-indigo-500/20 border-purple-500/30',
      description:
        'Modem fisik memiliki aturan keamanan: hanya 1 administrator yang boleh login dalam satu waktu. Jika Anda login di laptop, HP tidak bisa login sebelum sesi di laptop dilepas.',
      keyPoints: [
        'Saat selesai memantau, selalu tekan tombol "Logout" di bar atas',
        'Tombol Logout seketika membebaskan sesi modem',
        'Dengan begitu, Anda atau anggota keluarga lain bisa membuka aplikasi di HP/Laptop kapan saja tanpa bentrok'
      ]
    }
  ];

  const current = steps[currentStep];

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('wifiguard_has_seen_tutorial', 'true');
      } catch {
        // ignore
      }
    }
    setIsTutorialModalOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOpenFullGuide = () => {
    handleClose();
    setCurrentView('tutorial');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {current.badge} ({currentStep + 1} / {steps.length})
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tutup Panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Visual Icon Badge */}
          <div className="flex justify-center">
            <div
              className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${current.iconBg} border flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105`}
            >
              {current.icon}
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              {current.title}
            </h3>
            <p className="text-xs text-sky-400 font-medium">{current.subtitle}</p>
          </div>

          {/* Main Description */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-center sm:text-left bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
            {current.description}
          </p>

          {/* Key Points */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Poin Penting:
            </span>
            <div className="space-y-2">
              {current.keyPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-slate-950/30 border border-slate-800/50 text-xs text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/60 flex flex-col gap-3">
          {/* Dots Indicator & Full Guide Link */}
          <div className="flex items-center justify-between">
            {/* Pagination Dots */}
            <div className="flex items-center space-x-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentStep
                      ? 'w-6 bg-sky-400'
                      : 'w-2 bg-slate-700 hover:bg-slate-600'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Quick link to Full FAQ View */}
            <button
              onClick={handleOpenFullGuide}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center space-x-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Panduan Lengkap & FAQ</span>
            </button>
          </div>

          {/* Action Buttons & Checkbox */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-400 self-start sm:self-center">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-[11px]">Jangan tampilkan otomatis lagi</span>
            </label>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-sky-600/20"
              >
                <span>{currentStep === steps.length - 1 ? 'Mulai Sekarang' : 'Lanjut'}</span>
                {currentStep < steps.length - 1 ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
