'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  PieChart, 
  HelpCircle, 
  TrendingUp, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  Save
} from 'lucide-react';
import { adjustProportionally, getBudgetRecommendation } from '@/lib/math';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to load budget data');
  return res.json();
});

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export default function BudgetingPage() {
  const { data: dashboardData, isLoading: dashboardLoading, mutate: mutateDashboard } = useSWR('/api/dashboard', fetcher);
  const { data: allocationData, isLoading: allocationLoading, mutate: mutateAllocation } = useSWR('/api/allocations', fetcher);

  // Sliders percentage state
  const [tabungan, setTabungan] = useState(30);
  const [darurat, setDarurat] = useState(30);
  const [jajan, setJajan] = useState(40);
  
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Routing Mapping States
  const [showMappingPopup, setShowMappingPopup] = useState(false);
  const [showManualMapping, setShowManualMapping] = useState(false);
  const [selectedTabunganWallet, setSelectedTabunganWallet] = useState('');
  const [selectedDaruratWallet, setSelectedDaruratWallet] = useState('');
  const [selectedJajanWallet, setSelectedJajanWallet] = useState('');

  // Wallet creation inside popup
  const [showAddWalletForm, setShowAddWalletForm] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState(0);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [walletError, setWalletError] = useState('');

  // Sync state once allocation is loaded
  useEffect(() => {
    if (allocationData?.allocation) {
      setTabungan(allocationData.allocation.tabungan);
      setDarurat(allocationData.allocation.darurat);
      setJajan(allocationData.allocation.jajan);
      
      setSelectedTabunganWallet(allocationData.allocation.tabunganWalletId || '');
      setSelectedDaruratWallet(allocationData.allocation.daruratWalletId || '');
      setSelectedJajanWallet(allocationData.allocation.jajanWalletId || '');
    }
  }, [allocationData]);

  if (dashboardLoading || allocationLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
          <p className="text-slate-400 text-sm">Membuat Panel Alokasi Cerdas...</p>
        </div>
      </div>
    );
  }

  // Calculate Net Disposable Income (NDI)
  // NDI = Income - Total Installments - Mandatory Expenses (is_need === true)
  const income = dashboardData?.monthIncome || 0;
  const expense = dashboardData?.monthExpense || 0;
  
  // Tagihan is already subtracted inside dashboard data for SDA. Let's recalculate NDI strictly:
  // We can estimate NDI from current month's income and mandatory obligations.
  // Wait, let's look at the NDI definition: NDI = I_total - L_wajib - E_wajib
  // Since we already calculated SDA which subtracts L_wajib, NDI is:
  // NDI = Income - Total Installments - E_wajib.
  // Let's compute it. In dashboardData we have monthIncome. Let's use the dashboard totalBalance or monthIncome as base:
  // If monthIncome is 0, let's use a standard default (or totalBalance) to avoid showing NDI = 0.
  // But we have seeded 15,000,000 as Gaji, so monthIncome will be 15,000,000!
  // Let's check active loan installments. Total loan installments are stored in the database.
  // For Sadi, we have: laptop loan flat installment (P=6M, i=1%, t=12 => installment = 500k + 60k = 560k) and motor loan annuity (P=18M, i=0.8%, t=24 => installment = A = 18M * 0.008(1.008^24) / (1.008^24 - 1) = 827,080).
  // Total loan installments are about 1,387,080.
  // Mandatory expenses (seeded dining expense) is around 400k.
  // So NDI = 15,000,000 - 1,387,080 - 400,000 = 13,212,920.
  // This is Tier 2 (between 5M and 15M).
  // Let's calculate this dynamically!
  const installments = dashboardData?.totalBalance - dashboardData?.sda || 0; // Wait, dashboardData.sda = totalBalance - installments, so installments = totalBalance - sda
  const ndi = Math.max(0, income - installments - expense); 

  // If no transactions yet, default NDI to totalBalance or a fallback for display
  const displayNdi = ndi > 0 ? ndi : (dashboardData?.totalBalance > 0 ? dashboardData.totalBalance : 0);

  const advisor = getBudgetRecommendation(displayNdi);

  // Handle slider changes with proportional auto-balancing linkage
  const handleSliderChange = (key: 'tabungan' | 'darurat' | 'jajan', val: number) => {
    const current = { tabungan, darurat, jajan };
    const adjusted = adjustProportionally(key, val, current);
    setTabungan(adjusted.tabungan);
    setDarurat(adjusted.darurat);
    setJajan(adjusted.jajan);
  };

  const handleSaveAllocationWithMapping = async (
    tWalletId: string | null,
    dWalletId: string | null,
    jWalletId: string | null
  ) => {
    setSaving(true);
    try {
      const res = await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabungan,
          darurat,
          jajan,
          tabunganWalletId: tWalletId || null,
          daruratWalletId: dWalletId || null,
          jajanWalletId: jWalletId || null,
        })
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal menyimpan alokasi');
      }

      setToastMessage('Kontrol Ketat Anggaran berhasil disimpan!');
      setTimeout(() => setToastMessage(''), 4000);
      
      mutateAllocation();
      // Refresh dashboard
      mutateDashboard();
      setShowMappingPopup(false);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleKontrolKetatAnggaran = () => {
    // Check if mapping is already configured
    const hasMapping = allocationData?.allocation?.tabunganWalletId && 
                       allocationData?.allocation?.daruratWalletId && 
                       allocationData?.allocation?.jajanWalletId;

    if (hasMapping) {
      // Just save percentages using existing mappings
      handleSaveAllocationWithMapping(
        allocationData.allocation.tabunganWalletId,
        allocationData.allocation.daruratWalletId,
        allocationData.allocation.jajanWalletId
      );
    } else {
      // Open modal configuration
      setShowMappingPopup(true);
      setShowManualMapping(false);
    }
  };

  const handleAutoSetup = async () => {
    setSaving(true);
    try {
      const walletsList = dashboardData?.wallets || [];
      
      let tWallet = walletsList.find((w: any) => w.name === 'Tabungan');
      let dWallet = walletsList.find((w: any) => w.name === 'Dana Darurat');
      let jWallet = walletsList.find((w: any) => w.name === 'Jajan');

      let tId = tWallet?.id || null;
      let dId = dWallet?.id || null;
      let jId = jWallet?.id || null;

      if (!tId) {
        const res = await fetch('/api/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Tabungan', initialBalance: 0 })
        });
        const data = await res.json();
        if (res.ok) tId = data.wallet.id;
      }

      if (!dId) {
        const res = await fetch('/api/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Dana Darurat', initialBalance: 0 })
        });
        const data = await res.json();
        if (res.ok) dId = data.wallet.id;
      }

      if (!jId) {
        const res = await fetch('/api/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Jajan', initialBalance: 0 })
        });
        const data = await res.json();
        if (res.ok) jId = data.wallet.id;
      }

      await handleSaveAllocationWithMapping(tId, dId, jId);
    } catch (err: any) {
      alert(`Gagal membuat dompet otomatis: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewWalletInPopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName) {
      setWalletError('Nama dompet wajib diisi');
      return;
    }
    setCreatingWallet(true);
    setWalletError('');
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWalletName, initialBalance: newWalletBalance })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat dompet');
      }

      await mutateDashboard();
      setNewWalletName('');
      setNewWalletBalance(0);
      setShowAddWalletForm(false);
    } catch (err: any) {
      setWalletError(err.message || 'Terjadi kesalahan');
    } finally {
      setCreatingWallet(false);
    }
  };

  const handleSaveManualSetup = () => {
    if (!selectedTabunganWallet || !selectedDaruratWallet || !selectedJajanWallet) {
      alert('Harap pilih rekening dompet untuk masing-masing alokasi!');
      return;
    }
    handleSaveAllocationWithMapping(selectedTabunganWallet, selectedDaruratWallet, selectedJajanWallet);
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm shadow-xl flex items-center gap-2 animate-bounce">
          <Sparkles size={18} />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Alokasi Cerdas (Smart Budgeting)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Bagi Sisa Dana Alokasi (SDA) secara proporsional. Total alokasi selalu dikunci pada 100%.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders linkage Panel */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl space-y-8">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="text-indigo-400" size={18} />
              Auto-Balancing Slider
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Geser salah satu slider, variabel lain akan menyeimbangkan secara otomatis.</p>
          </div>

          <div className="space-y-6">
            {/* Tabungan Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Tabungan
                </span>
                <span className="font-bold font-mono text-white text-base">{tabungan}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={tabungan}
                onChange={(e) => handleSliderChange('tabungan', Number(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-slate-900 appearance-none cursor-pointer outline-none accent-cyan-400"
              />
              <div className="text-[11px] text-slate-500 text-right">
                Nominal: <span className="font-mono">{formatRupiah((tabungan / 100) * (dashboardData?.sda || 0))}</span>
              </div>
            </div>

            {/* Dana Darurat Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Dana Darurat
                </span>
                <span className="font-bold font-mono text-white text-base">{darurat}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={darurat}
                onChange={(e) => handleSliderChange('darurat', Number(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-slate-900 appearance-none cursor-pointer outline-none accent-indigo-500"
              />
              <div className="text-[11px] text-slate-500 text-right">
                Nominal: <span className="font-mono">{formatRupiah((darurat / 100) * (dashboardData?.sda || 0))}</span>
              </div>
            </div>

            {/* Jajan / Hiburan Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Jajan & Hiburan
                </span>
                <span className="font-bold font-mono text-white text-base">{jajan}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={jajan}
                onChange={(e) => handleSliderChange('jajan', Number(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-slate-900 appearance-none cursor-pointer outline-none accent-amber-500"
              />
              <div className="text-[11px] text-slate-500 text-right">
                Nominal: <span className="font-mono">{formatRupiah((jajan / 100) * (dashboardData?.sda || 0))}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-slate-500" />
              Sisa Dana Alokasi saat ini: <strong className="text-white font-mono">{formatRupiah(dashboardData?.sda || 0)}</strong>
            </span>
            <div className="flex items-center gap-3">
              {(selectedTabunganWallet && selectedDaruratWallet && selectedJajanWallet) && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMappingPopup(true);
                    setShowManualMapping(true);
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-450 hover:text-white transition font-medium cursor-pointer text-xs"
                >
                  Ubah Aliran Rekening
                </button>
              )}
              <button
                onClick={handleKontrolKetatAnggaran}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer shadow-lg shadow-indigo-600/10 text-xs"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                Kontrol Ketat Anggaran
              </button>
            </div>
          </div>
        </div>

        {/* AI Advisor Panel */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-slate-950 to-indigo-950/5">
          {/* Subtle neon spark */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500 rounded-full blur-2xl opacity-10"></div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles size={16} />
              </div>
              <h3 className="text-sm font-bold text-white">AI Budget Advisor</h3>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Estimasi Net Disposable Income</span>
                <h4 className="text-lg font-bold text-white mt-1 font-mono">{formatRupiah(displayNdi)}</h4>
                <div className="mt-2 text-xs flex items-center gap-1.5 text-indigo-400 font-medium">
                  <TrendingUp size={12} />
                  Tier {advisor.tier}: {advisor.tierLabel}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Rekomendasi Rencana Anggaran:</span>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Tabungan ({advisor.tabunganPct}%)</span>
                    <span className="font-bold text-white font-mono">{formatRupiah(advisor.tabunganVal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Dana Darurat ({advisor.daruratPct}%)</span>
                    <span className="font-bold text-white font-mono">{formatRupiah(advisor.daruratVal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Jajan & Hiburan ({advisor.jajanPct}%)</span>
                    <span className="font-bold text-white font-mono">{formatRupiah(advisor.jajanVal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900 text-[10px] text-slate-500 italic">
            * Rekomendasi dihitung menggunakan rasio ideal berbasis ambang batas kekuatan ekonomi Net Disposable Income (NDI).
          </div>
        </div>
      </div>

      {/* Configuration Mapping Popup */}
      {showMappingPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-850 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6 text-slate-100">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-white">Aliran Rekening Anggaran</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hubungkan alokasi Tabungan, Dana Darurat, dan Jajan ke dompet spesifik Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMappingPopup(false)}
                className="text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {!showManualMapping ? (
              // Phase 1: Ask Automatic vs Manual
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-350 leading-relaxed">
                  ❓ Variabel alokasi anggaran Anda belum terhubung ke dompet manapun. Pilih metode pengaturan di bawah ini untuk memulai pemisahan dana.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleAutoSetup}
                    disabled={saving}
                    className="flex flex-col items-center gap-3 p-5 rounded-xl border border-slate-900 bg-slate-900/40 hover:bg-slate-900 hover:border-indigo-500/40 text-center transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition text-sm">
                      🪄
                    </div>
                    <span className="font-bold text-xs text-white">Dibuat Otomatis</span>
                    <span className="text-[10px] text-slate-500 leading-relaxed">
                      Sistem akan membuat 3 dompet baru bernilai Rp 0 dengan nama "Tabungan", "Dana Darurat", dan "Jajan" secara instan.
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setShowManualMapping(true);
                      const defaultWallet = dashboardData?.wallets?.[0]?.id || '';
                      if (!selectedTabunganWallet) setSelectedTabunganWallet(defaultWallet);
                      if (!selectedDaruratWallet) setSelectedDaruratWallet(defaultWallet);
                      if (!selectedJajanWallet) setSelectedJajanWallet(defaultWallet);
                    }}
                    disabled={saving}
                    className="flex flex-col items-center gap-3 p-5 rounded-xl border border-slate-900 bg-slate-900/40 hover:bg-slate-900 hover:border-indigo-500/40 text-center transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition text-sm">
                      ⚙️
                    </div>
                    <span className="font-bold text-xs text-white">Atur Secara Manual</span>
                    <span className="text-[10px] text-slate-500 leading-relaxed">
                      Anda menentukan sendiri alokasi uang akan diarahkan ke rekening bank atau dompet digital mana yang sudah ada.
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              // Phase 2: Manual dropdown mapping
              <div className="space-y-6">
                <div className="space-y-4">
                  {/* Select Tabungan */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Aliran Rekening Tabungan
                    </label>
                    <select
                      value={selectedTabunganWallet}
                      onChange={(e) => setSelectedTabunganWallet(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-indigo-500 font-mono"
                    >
                      <option value="" disabled>-- Pilih Dompet --</option>
                      {dashboardData?.wallets?.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name} (Saldo: {formatRupiah(Number(w.balance))})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Dana Darurat */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Aliran Rekening Dana Darurat
                    </label>
                    <select
                      value={selectedDaruratWallet}
                      onChange={(e) => setSelectedDaruratWallet(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-indigo-500 font-mono"
                    >
                      <option value="" disabled>-- Pilih Dompet --</option>
                      {dashboardData?.wallets?.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name} (Saldo: {formatRupiah(Number(w.balance))})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Jajan */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Aliran Rekening Jajan
                    </label>
                    <select
                      value={selectedJajanWallet}
                      onChange={(e) => setSelectedJajanWallet(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-indigo-500 font-mono"
                    >
                      <option value="" disabled>-- Pilih Dompet --</option>
                      {dashboardData?.wallets?.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name} (Saldo: {formatRupiah(Number(w.balance))})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub-form: Create Wallet inside manual dialog */}
                <div className="border-t border-slate-900 pt-4 text-left">
                  {!showAddWalletForm ? (
                    <button
                      type="button"
                      onClick={() => setShowAddWalletForm(true)}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                    >
                      + Buat Dompet Baru Tambahan
                    </button>
                  ) : (
                    <form onSubmit={handleCreateNewWalletInPopup} className="p-4 rounded-xl bg-slate-900/40 border border-slate-900 space-y-4">
                      <h4 className="text-xs font-bold text-white">Buat Dompet Baru</h4>
                      
                      {walletError && (
                        <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400">
                          {walletError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-500 mb-1">Nama Dompet</label>
                          <input
                            type="text"
                            value={newWalletName}
                            onChange={(e) => setNewWalletName(e.target.value)}
                            placeholder="Misal: Bank Jatim"
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-850 text-white outline-none focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Saldo Awal</label>
                          <input
                            type="number"
                            value={newWalletBalance}
                            onChange={(e) => setNewWalletBalance(Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-850 text-white outline-none focus:border-indigo-500 font-mono"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end text-[10px]">
                        <button
                          type="button"
                          onClick={() => setShowAddWalletForm(false)}
                          className="px-3 py-1.5 rounded bg-slate-950 border border-slate-850 text-slate-400 hover:text-white cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={creatingWallet}
                          className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                        >
                          {creatingWallet ? 'Memproses...' : 'Simpan Dompet'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowManualMapping(false)}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-450 font-semibold text-xs cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveManualSetup}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer shadow-lg shadow-indigo-600/10"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Mappings & Alokasi'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
