import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Wifi,
  ShieldCheck,
  ShieldBan,
  LogOut,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Server,
  Smartphone,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const TutorialView: React.FC = () => {
  const { setIsTutorialModalOpen, setCurrentView } = useAppStore();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const quickSteps = [
    {
      step: '1',
      title: 'Sambungkan ke Wi-Fi Rumah',
      desc: 'Pastikan HP atau Laptop Anda sudah tersambung ke sinyal Wi-Fi dari modem yang sama (bukan memakai kuota seluler 4G/5G).',
      icon: <Wifi className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/30 bg-emerald-500/10'
    },
    {
      step: '2',
      title: 'Login & Autentikasi',
      desc: 'Klik tombol "Router Login" di pojok kanan atas, masukkan IP modem (bawaan 192.168.1.1), username, dan password modem Anda.',
      icon: <Server className="w-5 h-5 text-sky-400" />,
      color: 'border-sky-500/30 bg-sky-500/10'
    },
    {
      step: '3',
      title: 'Tandai Perangkat Keluarga',
      desc: 'Buka menu "All Devices". Klik tombol "Trust" (Perisai Hijau) untuk menandai HP/Laptop milik keluarga atau perangkat Anda.',
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/30 bg-amber-500/10'
    },
    {
      step: '4',
      title: 'Blokir Penyusup & Jadwal',
      desc: 'Temukan perangkat tak dikenal? Klik "Block" seketika, atau atur jam jadwal waktu blokir otomatis (misal: jam 21.00 s/d 06.00).',
      icon: <ShieldBan className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-500/30 bg-rose-500/10'
    }
  ];

  const faqs = [
    {
      q: 'Mengapa muncul pesan "Sesi router sedang digunakan oleh administrator lain"?',
      a: 'Modem fisik (seperti FiberHome) memiliki aturan keamanan ketat: hanya mengizinkan 1 sesi administrator dalam satu waktu. Jika Anda sedang membuka halaman web admin modem di browser laptop (192.168.1.1) atau WiFi Guard di laptop sedang aktif, HP Anda akan ditolak. Solusinya: Klik tombol "Logout" di bar atas aplikasi laptop/HP Anda, atau tunggu 2-3 menit agar masa sesi otomatis reset (timeout).'
    },
    {
      q: 'Apakah saat menggunakan aplikasi di HP harus selalu terhubung ke Wi-Fi?',
      a: 'Ya, WAJIB. Alamat IP modem (192.168.1.1) adalah alamat jaringan lokal privat (LAN) di rumah Anda. Jika HP Anda menggunakan data seluler (kuota 4G/5G) atau Wi-Fi luar, HP berada di luar jaringan lokal dan tidak akan bisa menemukan modem.'
    },
    {
      q: 'Apakah perangkat yang diblokir masih bisa tersambung jika tahu kata sandi Wi-Fi?',
      a: 'Tidak bisa. WiFi Guard menggunakan fitur MAC Address Filtering di tingkat inti modem. Modem akan langsung mengenali identitas fisik perangkat dan menolak transmisi data internetnya meskipun kata sandi Wi-Fi dimasukkan dengan benar.'
    },
    {
      q: 'Bagaimana jika perangkat target menggunakan fitur "Acak Alamat MAC" (Random MAC)?',
      a: 'Smartphone modern terkadang mengaktifkan fitur Random MAC Address. Setiap kali perangkat tersebut membuat MAC baru, WiFi Guard akan mendeteksinya sebagai perangkat "Unknown" baru dengan badge kuning di dashboard. Anda cukup menekan tombol "Block" pada entri baru tersebut. Untuk HP keluarga, disarankan mematikan fitur "Acak Alamat MAC" khusus pada jaringan Wi-Fi rumah agar namanya tetap dikenali.'
    },
    {
      q: 'Apakah aplikasi ini aman dan tidak akan merusak pengaturan modem?',
      a: '100% Aman. WiFi Guard bekerja secara etis dan sah menggunakan protokol komunikasi resmi milik modem Anda sendiri. Aplikasi ini juga dilengkapi fitur Proteksi Diri (Self-Block Prevention) yang mencegah Anda memblokir perangkat yang sedang Anda pakai untuk mengoperasikan aplikasi.'
    }
  ];

  const modemCredentials = [
    {
      vendor: 'FiberHome HG6145D2',
      ip: '192.168.1.1',
      user: 'user',
      pass: 'user1234 (atau lihat di stiker belakang modem)',
      isp: 'Telkom / Indihome / Telkomsel One'
    },
    {
      vendor: 'ZTE F609 / F670',
      ip: '192.168.1.1',
      user: 'user',
      pass: 'user / Zte521',
      isp: 'Indihome / CBN / MyRepublic'
    },
    {
      vendor: 'Huawei HG8245H / EG8145V5',
      ip: '192.168.100.1 / 192.168.1.1',
      user: 'root / telecomadmin',
      pass: 'admin / admintelecom',
      isp: 'Biznet / Indihome / FirstMedia'
    },
    {
      vendor: 'TP-Link / Tenda Router',
      ip: '192.168.0.1 / 192.168.1.1',
      user: 'admin',
      pass: 'admin (atau password buatan Anda)',
      isp: 'Router Tambahan / Access Point'
    }
  ];

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto overflow-y-auto h-full pb-8 select-none">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-800/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sky-400">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Pusat Bantuan Resmi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            Panduan Penggunaan WiFi Guard
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Pelajari cara menghubungkan aplikasi ke modem rumah Anda, mengenali perangkat asing, dan mengontrol akses internet keluarga secara optimal.
          </p>
        </div>

        {/* Trigger Pop-up Tutorial Modal */}
        <button
          onClick={() => setIsTutorialModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Buka Pop-up Interaktif</span>
        </button>
      </div>

      {/* Quick Start 4-Step Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Langkah Cepat Memulai (4 Langkah Mudah)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickSteps.map((s) => (
            <div
              key={s.step}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3 transition-all hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 text-xs font-bold flex items-center justify-center">
                  {s.step}
                </span>
                <div className={`p-2 rounded-lg border ${s.color}`}>
                  {s.icon}
                </div>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white mb-1">{s.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accordion FAQ Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-sky-400" />
          Tanya Jawab & Solusi Kendala (FAQ)
        </h3>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition-colors"
                >
                  <span className="pr-4">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-sky-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modem Credentials Reference Guide */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-purple-400" />
          Daftar Kredensial & IP Modem Standar di Indonesia
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modemCredentials.map((m, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-sm">{m.vendor}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {m.isp}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">IP Gateway:</span>
                  <span className="font-mono text-sky-400 font-semibold">{m.ip}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Username Bawaan:</span>
                  <span className="font-mono text-slate-300 font-semibold">{m.user}</span>
                </div>
              </div>
              <div className="text-[11px] pt-1">
                <span className="text-slate-500 block">Password Bawaan:</span>
                <span className="font-mono text-slate-300">{m.pass}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Tip / Help CTA */}
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start space-x-3 text-xs text-amber-300">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Tips Menghindari Lupa Logout:</span>
          Jika Anda bergantian memantau jaringan antara HP dan Laptop, biasakan selalu menekan tombol{' '}
          <strong className="text-white underline">Logout</strong> di bar atas sebelum menutup aplikasi.
        </div>
      </div>
    </div>
  );
};
