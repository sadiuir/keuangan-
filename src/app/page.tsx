'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowRight, 
  TrendingUp, 
  Cpu, 
  PieChart, 
  Users, 
  HelpCircle, 
  Mail, 
  BookmarkCheck,
  Percent,
  Wallet,
  Award
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [activeShowcase, setActiveShowcase] = useState<'wallet' | 'budget' | 'loan' | 'kost' | 'cron'>('wallet');

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.push('/dashboard');
            return;
          }
        }
      } catch (e) {
        console.error('Landing page auth check error:', e);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactName('');
    setContactEmail('');
    setContactMsg('');
    setTimeout(() => setContactSuccess(false), 4000);
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-3xl opacity-10 -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-600 rounded-full blur-3xl opacity-10 -z-10"></div>
      <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-3xl opacity-5 -z-10"></div>

      {/* Navigation Header */}
      <header className="px-6 lg:px-12 py-5 flex items-center justify-between border-b border-slate-900/60 backdrop-blur-md sticky top-0 z-50 bg-slate-950/70">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
            WM
          </div>
          <span className="font-semibold text-base tracking-wide text-white">Wealth Manager</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <a href="#fitur" className="hover:text-white transition">Fitur Utama</a>
          <a href="#preview-sistem" className="hover:text-white transition">Preview Sistem</a>
          <a href="#tentang" className="hover:text-white transition">Tentang Kami</a>
          <a href="#rencana-layanan" className="hover:text-white transition">Paket Layanan</a>
          <a href="#faq" className="hover:text-white transition">FAQ</a>
          <a href="#kontak" className="hover:text-white transition">Kontak</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-400 font-semibold text-xs border border-slate-800 transition"
          >
            Masuk Ke Sistem
          </Link>
          <Link 
            href="/register" 
            className="hidden sm:inline-block px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
          >
            Daftar Gratis
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto py-24 lg:py-32">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6">
          <ShieldCheck size={14} />
          Solusi Finansial Proaktif Personal & Bisnis Kecil
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
          Manajemen Keuangan Proaktif Dengan{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Akurasi Total
          </span>
        </h1>
        
        <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
          Satu dasbor terpadu untuk melacak kas multi-dompet dengan garansi transaksi ACID, 
          slider alokasi proporsional otomatis, simulasi cicilan komprehensif, dan 
          pembayaran tagihan terjadwal via Virtual Administrator.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            Mulai Kelola Finansial
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/register"
            className="px-6 py-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-350 font-semibold text-sm transition border border-slate-800 flex items-center justify-center gap-2 cursor-pointer"
          >
            Daftar Akun Baru
          </Link>
        </div>
      </section>

      {/* Core Features Explanation */}
      <section id="fitur" className="py-20 bg-slate-950 border-t border-slate-900/60 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Teknologi & Fitur</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">Daftar Fitur Unggulan Wealth Manager</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              Kami memadukan integritas data tingkat korporasi (ACID) dengan logika matematika canggih 
              untuk memberikan kontrol arus kas yang presisi dan transparan kepada Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fitur 1: ACID Transactions */}
            <div className="glass-panel p-6 rounded-xl border border-slate-900 shadow-md">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-base font-bold text-white">1. Transaksi Kepatuhan ACID</h3>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                Setiap transaksi pemasukan, pengeluaran, maupun transfer antar rekening di Wealth Manager dijamin secara ACID (Atomicity, Consistency, Isolation, Durability) di database. Jika terjadi kegagalan atau saldo dompet tidak mencukupi, sistem akan otomatis melakukan rollback data secara penuh (all-or-nothing), menjamin saldo Anda tidak pernah selisih satu rupiah pun.
              </p>
            </div>

            {/* Fitur 2: Smart Budgeting */}
            <div className="glass-panel p-6 rounded-xl border border-slate-900 shadow-md">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <PieChart size={20} />
              </div>
              <h3 className="text-base font-bold text-white">2. Alokasi Cerdas Proporsional</h3>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                Pengaturan anggaran bulanan menggunakan sistem slider yang saling terhubung secara matematika (Strict Capping). Saat Anda mengubah satu porsi anggaran (misalnya Tabungan), porsi anggaran lainnya (Dana Darurat dan Jajan) akan bergeser secara proporsional secara otomatis agar total anggaran tetap terkunci tepat pada angka **100%**, mencegah over-budgeting.
              </p>
            </div>

            {/* Fitur 3: Loan Engine */}
            <div className="glass-panel p-6 rounded-xl border border-slate-900 shadow-md">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Percent size={20} />
              </div>
              <h3 className="text-base font-bold text-white">3. Kalkulator Amortisasi Pinjaman</h3>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                Kelola pinjaman dan utang secara transparan. Mendukung tiga algoritma bunga yang umum digunakan di perbankan: **Flat** (bunga tetap), **Efektif** (bunga menurun berdasarkan sisa pokok), dan **Anuitas** (angsuran bulanan tetap dengan porsi bunga-pokok dinamis). Dilengkapi dengan tabel jadwal angsuran detail dari bulan pertama hingga lunas.
              </p>
            </div>

            {/* Fitur 4: Anak Kost Survival */}
            <div className="glass-panel p-6 rounded-xl border border-slate-900 shadow-md">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Award size={20} />
              </div>
              <h3 className="text-base font-bold text-white">4. Mode Anak Kost (Survival Mode)</h3>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                Algoritma pelacak limit harian dinamis. Mengatur batas pengeluaran harian berdasarkan sisa uang dan sisa hari di bulan berjalan. Sistem memberikan insentif: jika hari ini hemat (Saving), sisa limit akan dialokasikan sebagai tambahan batas besok (Reward). Sebaliknya, jika boros, limit hari berikutnya akan dikurangi secara otomatis (Penalty).
              </p>
            </div>

            {/* Fitur 5: Virtual Administrator */}
            <div className="glass-panel p-6 rounded-xl border border-slate-900 shadow-md">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Cpu size={20} />
              </div>
              <h3 className="text-base font-bold text-white">5. Virtual Administrator & Auto-Debet</h3>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                Sistem penjadwalan otomatis (background cron job) yang memotong saldo rekening secara otomatis tepat pada tanggal jatuh tempo tagihan atau cicilan. Dilengkapi dengan deteksi saldo awal, penanganan toleransi saldo tidak cukup, dan pencatatan riwayat eksekusi terperinci (Cron Log) untuk transparansi mutasi otomatis Anda.
              </p>
            </div>

            {/* Fitur 6: Multi-Wallet & Multi-Account */}
            <div className="glass-panel p-6 rounded-xl border border-slate-900 shadow-md">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
                <Wallet size={20} />
              </div>
              <h3 className="text-base font-bold text-white">6. Multi-Dompet & Profil User</h3>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                Anda bebas membuat banyak dompet baru (BCA, OVO, Cash, dll) secara langsung dari Dashboard dan mengedit informasi profil Anda (Nama, Email, Password) secara aman menggunakan autentikasi JWT terenkripsi. Hak akses Super Admin terintegrasi juga memungkinkan troubleshooting dan manajemen global bagi developer/owner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive System Preview (Showcase) */}
      <section id="preview-sistem" className="py-20 bg-slate-950 border-t border-slate-900/60 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Preview Antarmuka</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">Simulasi Dasbor Wealth Manager</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              Jelajahi bagaimana fitur canggih Wealth Manager beroperasi melalui replika simulasi antarmuka di bawah ini.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Tab controls */}
            <div className="lg:col-span-4 space-y-2">
              <button
                onClick={() => setActiveShowcase('wallet')}
                className={`w-full text-left p-4 rounded-xl border transition flex flex-col gap-1 cursor-pointer
                  ${activeShowcase === 'wallet'
                    ? 'bg-indigo-600/10 border-indigo-500 text-white'
                    : 'bg-slate-900/35 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                <span className="font-bold text-xs">1. Multi-Dompet & Saldo</span>
                <span className="text-[10px] opacity-75">Simulasi total saldo teragregasi dari berbagai akun/wallet secara real-time.</span>
              </button>

              <button
                onClick={() => setActiveShowcase('budget')}
                className={`w-full text-left p-4 rounded-xl border transition flex flex-col gap-1 cursor-pointer
                  ${activeShowcase === 'budget'
                    ? 'bg-indigo-600/10 border-indigo-500 text-white'
                    : 'bg-slate-900/35 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                <span className="font-bold text-xs">2. Alokasi Cerdas 100%</span>
                <span className="text-[10px] opacity-75">Sistem slider alokasi otomatis (Strict Capping) yang saling mengunci proporsional.</span>
              </button>

              <button
                onClick={() => setActiveShowcase('loan')}
                className={`w-full text-left p-4 rounded-xl border transition flex flex-col gap-1 cursor-pointer
                  ${activeShowcase === 'loan'
                    ? 'bg-indigo-600/10 border-indigo-500 text-white'
                    : 'bg-slate-900/35 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                <span className="font-bold text-xs">3. Amortisasi Cicilan</span>
                <span className="text-[10px] opacity-75">Simulasi perbandingan bunga Flat vs Efektif vs Anuitas secara transparan.</span>
              </button>

              <button
                onClick={() => setActiveShowcase('kost')}
                className={`w-full text-left p-4 rounded-xl border transition flex flex-col gap-1 cursor-pointer
                  ${activeShowcase === 'kost'
                    ? 'bg-indigo-600/10 border-indigo-500 text-white'
                    : 'bg-slate-900/35 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                <span className="font-bold text-xs">4. Limit Mode Anak Kost</span>
                <span className="text-[10px] opacity-75">Perhitungan batas jajan harian dinamis dengan skema Reward & Penalty.</span>
              </button>

              <button
                onClick={() => setActiveShowcase('cron')}
                className={`w-full text-left p-4 rounded-xl border transition flex flex-col gap-1 cursor-pointer
                  ${activeShowcase === 'cron'
                    ? 'bg-indigo-600/10 border-indigo-500 text-white'
                    : 'bg-slate-900/35 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                <span className="font-bold text-xs">5. Otomasi Virtual Admin</span>
                <span className="text-[10px] opacity-75">Simulasi pemotongan otomatis tagihan jatuh tempo via background cron job.</span>
              </button>
            </div>

            {/* Simulated UI container */}
            <div className="lg:col-span-8 glass-panel rounded-2xl border border-slate-900 p-6 min-h-[360px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -z-10"></div>
              
              {/* Tab: Multi-Wallet */}
              {activeShowcase === 'wallet' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Simulasi Dompet</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">Status: Connected</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total Saldo Tergabung</span>
                    <h4 className="text-2xl font-bold text-white font-mono mt-1">Rp 12.450.000</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-850">
                      <span className="text-[9px] text-slate-400 uppercase">BCA Tabungan</span>
                      <p className="text-sm font-bold text-white mt-1 font-mono">Rp 8.500.000</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-850">
                      <span className="text-[9px] text-slate-400 uppercase">OVO Cash</span>
                      <p className="text-sm font-bold text-white mt-1 font-mono">Rp 1.450.000</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-850">
                      <span className="text-[9px] text-slate-400 uppercase">Uang Tunai</span>
                      <p className="text-sm font-bold text-white mt-1 font-mono">Rp 2.500.000</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Budget */}
              {activeShowcase === 'budget' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Strict Slider Capping (Anggaran 100%)</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-mono">Lock Active</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Tabungan (Investasi)</span>
                        <span className="text-white font-mono font-bold">40%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden relative">
                        <div className="bg-indigo-500 h-2 w-[40%]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Dana Darurat (Proteksi)</span>
                        <span className="text-white font-mono font-bold">30%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden relative">
                        <div className="bg-cyan-400 h-2 w-[30%]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Uang Jajan (Konsumsi)</span>
                        <span className="text-white font-mono font-bold">30%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden relative">
                        <div className="bg-purple-500 h-2 w-[30%]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-slate-400 leading-relaxed">
                    💡 Mengubah persentase salah satu kategori akan otomatis membagi sisa atau kekurangan persentase ke kategori lain secara proporsional. Total alokasi selalu tepat <strong>100%</strong>.
                  </div>
                </div>
              )}

              {/* Tab: Loan */}
              {activeShowcase === 'loan' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Simulasi Amortisasi</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono">Pinjaman: Rp 10.000.000 / 12 Bln</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-400 font-semibold uppercase tracking-wider">
                          <th className="py-2">Tipe Bunga</th>
                          <th className="py-2 text-right">Angsuran / Bln</th>
                          <th className="py-2 text-right">Total Bunga</th>
                          <th className="py-2 text-right">Total Bayar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/50">
                        <tr>
                          <td className="py-2 font-semibold text-white">Flat</td>
                          <td className="py-2 text-right font-mono text-indigo-400">Rp 916.667</td>
                          <td className="py-2 text-right font-mono">Rp 1.000.000</td>
                          <td className="py-2 text-right font-mono">Rp 11.000.000</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-semibold text-white">Efektif (Menurun)</td>
                          <td className="py-2 text-right font-mono text-indigo-400">Rp 916.667 (Awal)</td>
                          <td className="py-2 text-right font-mono">Rp 541.667</td>
                          <td className="py-2 text-right font-mono">Rp 10.541.667</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-semibold text-white">Anuitas (Tetap)</td>
                          <td className="py-2 text-right font-mono text-indigo-400">Rp 879.159 (Tetap)</td>
                          <td className="py-2 text-right font-mono">Rp 549.907</td>
                          <td className="py-2 text-right font-mono">Rp 10.549.907</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[9px] text-slate-500 leading-relaxed italic">
                    * Simulasi menggunakan suku bunga 10% per tahun. Bunga Flat membebankan bunga dari plafon awal, sedangkan Efektif & Anuitas membebankan bunga hanya pada sisa pokok pinjaman.
                  </p>
                </div>
              )}

              {/* Tab: Kost */}
              {activeShowcase === 'kost' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Batas Safe Limit Mode Anak Kost</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-mono">Sisa Hari: 12 Hari</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-850">
                      <span className="text-[9px] text-slate-400 uppercase">Uang Jajan Tersisa</span>
                      <p className="text-lg font-bold text-white mt-1 font-mono">Rp 600.000</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-850">
                      <span className="text-[9px] text-slate-400 uppercase">Limit Harian Aman</span>
                      <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">Rp 50.000 / hari</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-slate-400 leading-relaxed space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Efek Hemat (Reward)
                    </div>
                    <p>
                      Jika hari ini Anda hanya membelanjakan Rp 30.000 (hemat Rp 20.000), sisa saldo hemat akan ditambahkan ke batas belanja hari esok secara otomatis, menjadi Rp 70.000.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: Cron */}
              {activeShowcase === 'cron' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Log Eksekusi Virtual Admin</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono">Cron Job Active</span>
                  </div>
                  <div className="bg-slate-950 rounded-lg p-3 border border-slate-900 font-mono text-[9px] text-slate-400 space-y-1 overflow-y-auto max-h-[160px]">
                    <p className="text-slate-500">[04/06/2026 00:01:00] Memulai Background Cron Job Auto-Debet...</p>
                    <p className="text-slate-500">[04/06/2026 00:01:01] Memeriksa daftar tagihan jatuh tempo hari ini...</p>
                    <p className="text-yellow-400">[04/06/2026 00:01:02] Ditemukan: Tagihan "Netflix Premium" (Rp 186.000) jatuh tempo.</p>
                    <p className="text-slate-500">[04/06/2026 00:01:03] Mengecek saldo dompet "BCA Tabungan" (Saldo: Rp 8.500.000)</p>
                    <p className="text-emerald-400">[04/06/2026 00:01:04] SUKSES: Auto-debet berhasil. Saldo BCA dipotong Rp 186.000. Transaksi tercatat.</p>
                    <p className="text-yellow-400">[04/06/2026 00:01:05] Ditemukan: Tagihan "Cicilan KPR" (Rp 2.000.000) jatuh tempo.</p>
                    <p className="text-slate-500">[04/06/2026 00:01:06] Mengecek saldo dompet "OVO Cash" (Saldo: Rp 1.450.000)</p>
                    <p className="text-rose-400">[04/06/2026 00:01:07] GAGAL: Saldo dompet OVO Cash tidak mencukupi. Auto-debet dibatalkan aman (Rollback).</p>
                    <p className="text-slate-500">[04/06/2026 00:01:08] Pekerjaan selesai. 1 Berhasil, 1 Gagal.</p>
                  </div>
                </div>
              )}

              {/* Action buttons simulated link */}
              <div className="mt-4 pt-3 border-t border-slate-900/60 flex justify-between items-center text-xs">
                <span className="text-slate-500 text-[10px]">Coba fitur asli di dasbor Wealth Manager Anda</span>
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] transition"
                >
                  Buka Dasbor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment & Pricing Section */}
      <section id="rencana-layanan" className="py-20 bg-slate-950 border-t border-slate-900/60 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Arsitektur & Skalabilitas</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">Pilihan Paket & Hosting Fleksibel</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              Didesain khusus untuk berjalan di infrastruktur serverless modern (Cloudflare Pages + Neon Database) dengan biaya pemeliharaan Rp 0,-.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan 1: Serverless Free Plan */}
            <div className="glass-panel p-8 rounded-2xl border border-slate-900 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/30 transition duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded">Recomended for Personal</span>
                <h4 className="text-xl font-bold text-white mt-4">Personal Serverless Plan</h4>
                <p className="text-[10px] text-slate-500 mt-1">Hosting Mandiri Tanpa Biaya Bulanan</p>
                <div className="my-6">
                  <span className="text-3xl font-bold text-white font-mono">Rp 0</span>
                  <span className="text-xs text-slate-500 font-mono"> / selamanya</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-450 border-t border-slate-900/60 pt-6 mb-8">
                  <li className="flex items-center gap-2">✓ Support Hosting Cloudflare Pages</li>
                  <li className="flex items-center gap-2">✓ Koneksi Database Neon Serverless</li>
                  <li className="flex items-center gap-2">✓ Scale-to-Zero Auto-Sleep (Hemat Limit CPU)</li>
                  <li className="flex items-center gap-2">✓ Logika Matematika 100% Berjalan Lokal</li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs text-center block transition shadow-md shadow-emerald-600/15"
              >
                Mulai Registrasi Free
              </Link>
            </div>

            {/* Plan 2: Enterprise Tier */}
            <div className="glass-panel p-8 rounded-2xl border border-slate-900 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/30 transition duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded">For Companies</span>
                <h4 className="text-xl font-bold text-white mt-4">Corporate Dedicated Plan</h4>
                <p className="text-[10px] text-slate-500 mt-1">Dedicated Server & Kustomisasi Penuh</p>
                <div className="my-6">
                  <span className="text-2xl font-bold text-white font-mono">Custom Quote</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-450 border-t border-slate-900/60 pt-6 mb-8">
                  <li className="flex items-center gap-2">✓ Penempatan Server On-Premise / VPS</li>
                  <li className="flex items-center gap-2">✓ Multi-User Super Admin Terkontrol</li>
                  <li className="flex items-center gap-2">✓ Backup & Replikasi Database Real-Time</li>
                  <li className="flex items-center gap-2">✓ Penyesuaian Algoritma Finansial Kustom</li>
                </ul>
              </div>
              <a
                href="#kontak"
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs text-center block transition shadow-md shadow-indigo-600/15"
              >
                Hubungi Pengembang
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-950 border-t border-slate-900/60 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Testimoni Pengguna</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">Dipercaya oleh Pengguna Cerdas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-xl border border-slate-900 shadow-md">
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "Penggabungan multi-dompet sangat mempermudah saya mengawasi dana darurat di OVO dan tabungan di BCA. Ditambah slider anggaran 100%, saya tidak pernah overspending lagi."
              </p>
              <div className="mt-4 pt-4 border-t border-slate-900/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-indigo-400">AH</div>
                <div>
                  <h5 className="text-xs font-bold text-white">Abdullah H.</h5>
                  <p className="text-[9px] text-slate-500">Freelancer</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl border border-slate-900 shadow-md">
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "Mode Anak Kost di Wealth Manager sangat membantu mengontrol uang makan harian. Bonus limit tambahan keesokan harinya jika hari ini hemat memotivasi saya menabung."
              </p>
              <div className="mt-4 pt-4 border-t border-slate-900/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-indigo-400">RY</div>
                <div>
                  <h5 className="text-xs font-bold text-white">Rian Yulianto</h5>
                  <p className="text-[9px] text-slate-500">Mahasiswa</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl border border-slate-900 shadow-md">
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "Virtual Administrator menghemat waktu saya setiap awal bulan. Tagihan otomatis terbayar tanpa repot dan riwayat transaksi tercatat rapi di database yang terisolasi aman."
              </p>
              <div className="mt-4 pt-4 border-t border-slate-900/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-indigo-400">MA</div>
                <div>
                  <h5 className="text-xs font-bold text-white">M. Asad</h5>
                  <p className="text-[9px] text-slate-500">Entrepreneur</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tentang Kami Section */}
      <section id="tentang" className="py-20 bg-slate-950 border-t border-slate-900/60 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Tentang Kami</h2>
            <h3 className="text-3xl font-bold text-white mt-2 leading-tight">
              Membangun Disiplin Finansial Melalui Logika dan Teknologi Modern
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-5 leading-relaxed">
              Wealth Manager lahir dari kebutuhan akan platform manajemen aset personal yang tidak hanya mencatat
              transaksi, namun secara aktif mencegah pengeluaran berlebih, mensimulasikan cicilan dengan matematika perbankan riil,
              dan mengotomatisasi pemotongan dana secara aman.
            </p>
            <p className="text-xs sm:text-sm text-slate-450 mt-4 leading-relaxed">
              Dengan mengadopsi Next.js 14 App Router, Prisma ORM, dan infrastruktur serverless scale-to-zero, kami menawarkan 
              sistem dengan latensi super rendah yang 100% andal dan efisien dalam penggunaan sumber daya.
            </p>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <BookmarkCheck className="text-indigo-400 flex-shrink-0" size={20} />
                <span className="text-xs font-semibold text-slate-350">Keamanan Enkripsi JWT</span>
              </div>
              <div className="flex items-center gap-3">
                <BookmarkCheck className="text-indigo-400 flex-shrink-0" size={20} />
                <span className="text-xs font-semibold text-slate-350">Simulasi Amortisasi Bank</span>
              </div>
              <div className="flex items-center gap-3">
                <BookmarkCheck className="text-indigo-400 flex-shrink-0" size={20} />
                <span className="text-xs font-semibold text-slate-350">Proteksi ACID Database</span>
              </div>
              <div className="flex items-center gap-3">
                <BookmarkCheck className="text-indigo-400 flex-shrink-0" size={20} />
                <span className="text-xs font-semibold text-slate-350">Simpan Tanpa Batas Dompet</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-10 -z-10"></div>
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-900 shadow-2xl relative overflow-hidden space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-slate-500 tracking-wider uppercase font-semibold">Misi Kami</span>
              </div>
              <h4 className="text-lg font-bold text-white">Disiplin Finansial Terotomatisasi</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kami bertujuan untuk menjembatani kesenjangan antara rencana anggaran dan aksi pengeluaran nyata. Melalui 
                peringatan H-3 jatuh tempo tagihan, auto-debet Virtual Admin, dan penyesuaian limit harian instan Mode Anak Kost, 
                Wealth Manager bertindak sebagai asisten pribadi yang memaksa kedisiplinan keuangan Anda secara ramah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cara Kerja Section */}
      <section id="cara-kerja" className="py-20 bg-slate-950 border-t border-slate-900/60 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Cara Kerja</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">4 Langkah Sederhana Mengelola Finansial</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              Mulai kendalikan arus kas masuk dan keluar Anda dalam hitungan menit menggunakan ekosistem terintegrasi kami.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="glass-panel p-6 rounded-xl border border-slate-900 relative">
              <div className="absolute top-4 right-4 text-3xl font-extrabold text-slate-800/40 font-mono">01</div>
              <h4 className="text-sm font-bold text-white mb-2">Buat Akun & Login</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Daftar secara instan menggunakan nama lengkap, email pribadi, dan password aman. Seluruh sesi dilindungi enkripsi JWT.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-panel p-6 rounded-xl border border-slate-900 relative">
              <div className="absolute top-4 right-4 text-3xl font-extrabold text-slate-800/40 font-mono">02</div>
              <h4 className="text-sm font-bold text-white mb-2">Tambah Dompet / Kas</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Masukkan semua dompet fisik (Tunai), tabungan bank, maupun dompet digital (GoPay/OVO) yang Anda gunakan beserta saldo awalnya.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-panel p-6 rounded-xl border border-slate-900 relative">
              <div className="absolute top-4 right-4 text-3xl font-extrabold text-slate-800/40 font-mono">03</div>
              <h4 className="text-sm font-bold text-white mb-2">Atur Slider Alokasi</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tentukan rasio keuangan bulanan untuk Tabungan, Dana Darurat, dan Jajan. Slider pintar akan menjaga total rasio tetap 100%.
              </p>
            </div>

            {/* Step 4 */}
            <div className="glass-panel p-6 rounded-xl border border-slate-900 relative">
              <div className="absolute top-4 right-4 text-3xl font-extrabold text-slate-800/40 font-mono">04</div>
              <h4 className="text-sm font-bold text-white mb-2">Catat & Automasi</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Catat pemasukan atau pengeluaran harian, dan tambahkan kontrak cicilan untuk pemotongan saldo otomatis via Virtual Admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-950 border-t border-slate-900/60 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Pertanyaan Umum (FAQ)</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">Masih Ragu? Lihat Pertanyaan yang Sering Diajukan</h3>
          </div>

          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-900 shadow-md">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle size={16} className="text-indigo-400 flex-shrink-0" />
                Bagaimana Wealth Manager mengamankan data keuangan saya?
              </h4>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                Setiap data yang masuk ke sistem Wealth Manager diisolasi berdasarkan identitas pengguna (Row-Level Security) yang valid. Sesi login Anda dilindungi oleh cookie HttpOnly dan JWT yang aman sehingga tidak dapat diekstrak oleh skrip berbahaya dari browser (bebas serangan XSS). Kata sandi Anda juga dienkripsi menggunakan Bcrypt hashing 10 putaran sebelum disimpan di database.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-slate-900 shadow-md">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle size={16} className="text-indigo-400 flex-shrink-0" />
                Apa yang terjadi jika saldo saya kurang saat jatuh tempo auto-debet?
              </h4>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                Jika pada pukul 00:01 WIB tanggal jatuh tempo saldo dompet Anda kurang dari nominal tagihan, Virtual Administrator akan membatalkan proses pendebetan otomatis untuk menghindari saldo minus. Transaksi dibatalkan secara ACID (aman) dan status kegagalan (saldo tidak cukup) akan tercatat di log panel kontrol Virtual Admin agar Anda dapat melakukan penyesuaian dana secara manual.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-slate-900 shadow-md">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle size={16} className="text-indigo-400 flex-shrink-0" />
                Apakah platform ini 100% gratis untuk hosting di Cloudflare?
              </h4>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                Ya! Seluruh arsitektur backend kami dirancang serverless (menggunakan Edge isolates dari Cloudflare Pages) dan database PostgreSQL Neon Cloud. Jika tidak ada interaksi atau pengguna yang membuka dasbor, baik Cloudflare maupun database Neon akan otomatis "scale-to-zero" (berhenti bekerja seutuhnya). Ini menjamin tidak adanya CPU-hours yang terbuang dan menjaga biaya operasional Anda tetap Rp 0,-.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hubungi Kami Section */}
      <section id="kontak" className="py-20 bg-slate-950 border-t border-slate-900/60 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Details */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Hubungi Kami</h2>
            <h3 className="text-3xl font-bold text-white mt-2 leading-tight">
              Butuh Dukungan atau Kerjasama Bisnis?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed">
              Tim support dan developer Wealth Manager siap menjawab semua masukan, kendala teknis, maupun diskusi penyesuaian 
              aplikasi keuangan kustom untuk korporasi Anda.
            </p>

            <div className="space-y-5 mt-10">
              <div className="flex items-center gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 text-indigo-400 border border-slate-850">
                  <Mail size={18} />
                </div>
                <div>
                  <h5 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Email Dukungan</h5>
                  <p className="text-sm text-white font-semibold mt-1">support@musadi.my.id</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-900 shadow-xl relative">
            <h4 className="text-base font-bold text-white mb-6">Kirim Pesan Langsung</h4>

            {contactSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                Pesan Anda berhasil dikirim! Kami akan menghubungi Anda segera.
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Nama Lengkap</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Email Anda</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Pesan atau Pertanyaan</label>
                <textarea
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-white text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer transition shadow-md shadow-indigo-600/15 mt-3"
              >
                Kirim Pesan
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900/60 py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs text-slate-500">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
                WM
              </div>
              <span className="font-semibold text-sm tracking-wide text-white">Wealth Manager</span>
            </div>
            <p className="leading-relaxed">
              Mewujudkan disiplin finansial total melalui perlindungan data korporasi ACID dan pemantauan terjadwal 24/7.
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-white uppercase tracking-wider text-[10px] mb-3">Tautan Navigasi</h5>
            <ul className="space-y-2">
              <li><a href="#fitur" className="hover:text-white transition">Fitur Utama</a></li>
              <li><a href="#preview-sistem" className="hover:text-white transition">Preview Sistem</a></li>
              <li><a href="#tentang" className="hover:text-white transition">Tentang Kami</a></li>
              <li><a href="#rencana-layanan" className="hover:text-white transition">Paket Layanan</a></li>
              <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-white uppercase tracking-wider text-[10px] mb-3">Fitur Matematika</h5>
            <ul className="space-y-2 font-mono text-[10px]">
              <li>Proportional Slider Logic</li>
              <li>Flat/Effective/Annuity Engine</li>
              <li>Anak Kost daily calculation</li>
              <li>In-line Expression Calculator</li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-white uppercase tracking-wider text-[10px] mb-3">Teknologi</h5>
            <ul className="space-y-2">
              <li>Next.js 14 App Router</li>
              <li>Prisma 7 & PostgreSQL</li>
              <li>Cloudflare Pages Serverless</li>
              <li>Neon WebSockets client</li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-650">
          <p>&copy; {new Date().getFullYear()} Wealth Manager • Muhammad Abdullah Hasyim Musadi • All Rights Reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link href="/login" className="hover:text-white transition">Masuk Sesi</Link>
            <Link href="/register" className="hover:text-white transition">Registrasi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
