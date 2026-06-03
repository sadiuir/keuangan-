'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  Coffee, 
  Settings, 
  HelpCircle, 
  TrendingUp, 
  ShieldAlert, 
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
  Zap,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { calculateAnakKostMetrics } from '@/lib/math';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to load Anak Kost metrics');
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

export default function AnakKostPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/anak-kost', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 10000 // 10s auto refresh for live simulations
  });

  // Client configurations persisted in localStorage
  const [thresholdPct, setThresholdPct] = useState(20); // default 20%
  const [customThresholdVal, setCustomThresholdVal] = useState<number | undefined>(undefined);
  const [useManualOverride, setUseManualOverride] = useState(false);

  // Manual Override parameter states
  const [customBudget, setCustomBudget] = useState(1500000);
  const [customDaysTotal, setCustomDaysTotal] = useState(15);
  const [customDaysRemaining, setCustomDaysRemaining] = useState(10);
  const [customActualRemaining, setCustomActualRemaining] = useState(1000000);

  // Wallet selector and confirmation states
  const [selectedWalletId, setSelectedWalletId] = useState<string>('default');
  const [pendingWalletId, setPendingWalletId] = useState<string>('default');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCycle, setConfirmCycle] = useState(1);
  const [confirmCountdown, setConfirmCountdown] = useState(10);
  const [canConfirmChange, setCanConfirmChange] = useState(false);
  const confirmTimerRef = React.useRef<any>(null);

  // Sisa bulanan target wallet state
  const [sisaWalletId, setSisaWalletId] = useState<string>('tabungan');

  const startConfirmCountdown = (cycle: number) => {
    setConfirmCycle(cycle);
    setConfirmCountdown(10);
    setCanConfirmChange(false);

    if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);

    confirmTimerRef.current = setInterval(() => {
      setConfirmCountdown((prev) => {
        if (prev <= 1) {
          if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);
          setCanConfirmChange(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleWalletSelectChange = (newVal: string) => {
    if (newVal === selectedWalletId) return;
    setPendingWalletId(newVal);
    setConfirmOpen(true);
    startConfirmCountdown(1);
  };

  const handleConfirmCancel = () => {
    if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);
    setConfirmOpen(false);
    setConfirmCycle(1);
    setPendingWalletId(selectedWalletId);
  };

  const handleConfirmOk = () => {
    if (!canConfirmChange) return;

    if (confirmCycle === 1) {
      startConfirmCountdown(2);
    } else {
      if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);
      setSelectedWalletId(pendingWalletId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ak_selected_wallet_id', pendingWalletId);
      }
      setConfirmOpen(false);
      mutate();
    }
  };

  const handleSisaWalletChange = (newVal: string) => {
    setSisaWalletId(newVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ak_sisa_allocation_wallet_id', newVal);
    }
  };

  // Load configuration from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPct = localStorage.getItem('ak_threshold_pct');
      const savedVal = localStorage.getItem('ak_threshold_val');
      const savedOverride = localStorage.getItem('ak_use_override');
      const savedWalletId = localStorage.getItem('ak_selected_wallet_id');
      const savedSisaId = localStorage.getItem('ak_sisa_allocation_wallet_id');
      
      if (savedPct) setThresholdPct(Number(savedPct));
      if (savedVal) setCustomThresholdVal(Number(savedVal));
      if (savedOverride) setUseManualOverride(savedOverride === 'true');
      if (savedWalletId) {
        setSelectedWalletId(savedWalletId);
        setPendingWalletId(savedWalletId);
      }
      if (savedSisaId) {
        setSisaWalletId(savedSisaId);
      }
    }
  }, []);

  const saveConfig = (pct: number, val?: number, override?: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ak_threshold_pct', pct.toString());
      if (val !== undefined) localStorage.setItem('ak_threshold_val', val.toString());
      if (override !== undefined) localStorage.setItem('ak_use_override', override.toString());
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
          <p className="text-slate-400 text-sm">Memuat Mode Anak Kost...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="max-w-md p-6 glass-panel rounded-2xl border-rose-500/20 text-center">
          <AlertCircle className="text-rose-500 mx-auto mb-3" size={40} />
          <h2 className="text-lg font-bold text-white mb-1">Gagal Memuat Mode Anak Kost</h2>
          <p className="text-slate-400 text-sm">Koneksi database terputus</p>
        </div>
      </div>
    );
  }

  const { initialMoney, actualMoneyRemaining, spentToday, todayDateNum, daysInMonth, wallets = [] } = data;

  const selectedWallet = wallets.find((w: any) => w.id === selectedWalletId);
  const effectiveActualMoneyRemaining = selectedWallet ? Number(selectedWallet.balance) : actualMoneyRemaining;

  // Calculate metrics based on modes
  let metrics;
  if (useManualOverride) {
    // Manual Override algorithm
    const baseLimit = Math.floor(customBudget / customDaysTotal);
    const neededFund = customDaysRemaining * baseLimit;
    const isPenalty = customActualRemaining < neededFund;
    
    let limitToday = 0;
    if (isPenalty) {
      limitToday = Math.floor(customActualRemaining / customDaysRemaining);
    } else {
      limitToday = baseLimit + Math.floor((customActualRemaining - neededFund) / customDaysRemaining);
    }

    const thresholdRed = customThresholdVal !== undefined && customThresholdVal > 0
      ? customThresholdVal
      : (thresholdPct / 100) * limitToday;

    metrics = {
      daysTotal: customDaysTotal,
      daysRemaining: customDaysRemaining,
      baseLimit,
      neededFund,
      limitToday: Math.max(0, limitToday),
      accumulatedSavings: isPenalty ? 0 : Math.max(0, customActualRemaining - neededFund),
      isPenalty,
      thresholdRed
    };
  } else {
    // Default Calendar month algorithm
    metrics = calculateAnakKostMetrics(
      initialMoney,
      effectiveActualMoneyRemaining,
      todayDateNum,
      daysInMonth,
      thresholdPct,
      customThresholdVal
    );
  }

  const {
    daysRemaining,
    baseLimit,
    neededFund,
    limitToday,
    accumulatedSavings,
    isPenalty,
    thresholdRed
  } = metrics;

  // Spent today vs limit today calculations
  const remainingToday = limitToday - spentToday;
  const spentPercent = limitToday > 0 ? Math.min(100, (spentToday / limitToday) * 100) : 0;
  
  // Triggers red status if spent today exceeds safety threshold
  const isRedZone = spentToday > thresholdRed;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Coffee className="text-indigo-400" size={24} />
            Mode Anak Kost (Survival Optimizer)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pantau dan batasi pengeluaran harian Anda agar sanggup bertahan sampai akhir bulan reset.
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 hover:text-white transition cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circular Survival Gauge */}
        <div className={`glass-panel rounded-2xl p-6 border flex flex-col items-center justify-center text-center shadow-xl min-h-[360px] transition-colors duration-300
          ${isRedZone ? 'border-rose-500/30 bg-rose-950/5' : 'border-slate-900 bg-slate-950/20'}`}
        >
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Survival Gauge
          </span>

          {/* SVG Circular Progress */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="88"
                cy="88"
                r="74"
                className="stroke-slate-900"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress circle */}
              <circle
                cx="88"
                cy="88"
                r="74"
                stroke={isRedZone ? '#f43f5e' : '#6366f1'} // Rose if RedZone, Indigo if safe
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="465"
                strokeDashoffset={465 - (465 * spentPercent) / 100}
                className="transition-all duration-500 ease-out"
                strokeLinecap="round"
              />
            </svg>
            
            {/* Value display inside circle */}
            <div className="absolute text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Jatah Tersisa</span>
              <span className="text-lg font-bold font-mono text-white block mt-0.5">
                {formatRupiah(Math.max(0, remainingToday))}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                Terpakai: {formatRupiah(spentToday)}
              </span>
            </div>
          </div>

          {/* Status Label */}
          <div className="mt-6 text-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border
              ${isRedZone 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' 
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}
            >
              {isRedZone ? <ShieldAlert size={12} /> : <Zap size={12} />}
              {isRedZone ? 'Zona Bahaya (Exceeded Threshold)' : 'Batas Aman Aktif'}
            </span>
            <p className="text-[10px] text-slate-500 mt-2">
              Batas Merah Peringatan (Threshold): {formatRupiah(thresholdRed)}
            </p>
          </div>
        </div>

        {/* Financial Metrics Panel */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Status Optimasi Finansial</h3>
              <p className="text-xs text-slate-400 mt-0.5">Parameter harian yang dihitung secara dinamis.</p>
            </div>
            
            {/* Penalty / Reward Badge */}
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border 
              ${isPenalty 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}
            >
              {isPenalty ? 'Overspending / Penalty' : 'Hemat / Reward'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 my-2">
            {/* Base Daily Limit */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Batas Harian Dasar (Base)</span>
              <h4 className="text-lg font-bold text-white font-mono mt-1">{formatRupiah(baseLimit)}</h4>
              <p className="text-[9px] text-slate-400 mt-1">Jatah ideal flat per hari</p>
            </div>

            {/* Optimized Today Limit */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Jatah Hari Ini (Optimized)</span>
              <h4 className="text-lg font-bold text-indigo-400 font-mono mt-1">{formatRupiah(limitToday)}</h4>
              <p className="text-[9px] text-slate-400 mt-1">
                {isPenalty 
                  ? 'Diturunkan karena overspend' 
                  : 'Ditingkatkan dari sisa hemat'}
              </p>
            </div>

            {/* Accumulated Savings */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Akumulasi Hemat</span>
              <h4 className="text-lg font-bold text-emerald-400 font-mono mt-1">{formatRupiah(accumulatedSavings)}</h4>
              <p className="text-[9px] text-slate-400 mt-1">Uang hasil berhemat</p>
            </div>

            {/* Time engine Remaining */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Sisa Waktu Siklus</span>
              <h4 className="text-lg font-bold text-white font-mono mt-1">{daysRemaining} Hari</h4>
              <p className="text-[9px] text-slate-400 mt-1">Menuju tanggal reset bulan</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-950/10 border border-indigo-950/20 text-xs text-indigo-300 leading-relaxed font-sans">
            {isPenalty ? (
              <strong>Peringatan Disiplin:</strong>
            ) : (
              <strong>Predikat Sehat:</strong>
            )}{' '}
            {isPenalty 
              ? `Anda membelanjakan uang melebihi target di hari-hari sebelumnya (sisa jajan aktual ${formatRupiah(useManualOverride ? customActualRemaining : effectiveActualMoneyRemaining)} < ekspektasi bertahan ${formatRupiah(neededFund)}). Sistem memberlakukan penalti penyesuaian batas harian.`
              : `Hebat! Anda berhemat di hari-hari sebelumnya. Sistem memberikan reward pelonggaran batas jatah harian hari ini.`}
          </div>
        </div>
      </div>

      {/* Settings & Manual Override Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Safety Settings + Funding Selector */}
        <div className="space-y-6 lg:col-span-1">
          {/* Safety settings */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="text-indigo-400" size={16} />
              Pengaturan Batas Peringatan
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Persentase Batas Peringatan (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={thresholdPct}
                    onChange={(e) => {
                      setThresholdPct(Number(e.target.value));
                      saveConfig(Number(e.target.value), customThresholdVal, useManualOverride);
                    }}
                    className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="font-bold text-white font-mono w-8 text-right">{thresholdPct}%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Batas Manual (Rupiah - Override)</label>
                <input
                  type="number"
                  value={customThresholdVal || ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    setCustomThresholdVal(val);
                    saveConfig(thresholdPct, val, useManualOverride);
                  }}
                  placeholder="Masukkan nominal manual..."
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 outline-none text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Kosongkan jika ingin menggunakan persentase otomatis (20%).</p>
              </div>
            </div>
          </div>

          {/* Funding Selector */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
              <Settings className="text-indigo-400" size={16} />
              Sumber Dana Mode Anak Kost
            </h3>
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-400 font-semibold mb-1">Pilih Dompet / Rekening:</label>
                <select
                  value={pendingWalletId}
                  onChange={(e) => handleWalletSelectChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 outline-none text-white focus:border-indigo-500 transition cursor-pointer font-sans"
                >
                  <option value="default">Alokasi Jajan Otomatis (Default: {formatRupiah(initialMoney)})</option>
                  {wallets.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(Number(w.balance))})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {selectedWalletId === 'default'
                    ? 'Sistem menggunakan anggaran Jajan bulanan hasil alokasi otomatis.'
                    : `Sistem menggunakan saldo riil dari dompet yang Anda pilih.`
                  }
                </p>
              </div>

              {/* Sisa Allocation Selector */}
              <div className="space-y-1 pt-3 border-t border-slate-900/60">
                <label className="block text-slate-400 font-semibold mb-1">Aliran Sisa Bulanan (Sisa Uang Jajan):</label>
                <select
                  value={sisaWalletId}
                  onChange={(e) => handleSisaWalletChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 outline-none text-white focus:border-indigo-500 transition cursor-pointer font-sans"
                >
                  <option value="tabungan">Dompet Tabungan (Otomatis)</option>
                  {wallets.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(Number(w.balance))})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Sisa saldo uang jajan di akhir bulan akan secara otomatis dialirkan ke dompet tujuan ini.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Manual Override controls */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="text-indigo-400" size={16} />
              Manual Override (Siklus Kustom)
            </h3>
            <button
              onClick={() => {
                const nextVal = !useManualOverride;
                setUseManualOverride(nextVal);
                saveConfig(thresholdPct, customThresholdVal, nextVal);
              }}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            >
              {useManualOverride ? 'Nonaktifkan Mode Manual' : 'Aktifkan Mode Manual'}
            </button>
          </div>

          {useManualOverride ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Dana Alokasi Siklus (D_custom)</label>
                  <input
                    type="number"
                    value={customBudget}
                    onChange={(e) => setCustomBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 outline-none text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Total Hari Siklus (T_custom)</label>
                  <input
                    type="number"
                    value={customDaysTotal}
                    onChange={(e) => setCustomDaysTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 outline-none text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Sisa Dana Aktual (D_aktual)</label>
                  <input
                    type="number"
                    value={customActualRemaining}
                    onChange={(e) => setCustomActualRemaining(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 outline-none text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Sisa Hari Siklus (D_remaining)</label>
                  <input
                    type="number"
                    value={customDaysRemaining}
                    onChange={(e) => setCustomDaysRemaining(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 outline-none text-white font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1">
              <AlertCircle size={24} className="text-slate-600 mb-1" />
              <p>Mode Kustom Nonaktif.</p>
              <p className="text-[10px]">Sistem saat ini menggunakan alokasi "Jajan" bulanan yang bersumber dari basis data.</p>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Switch Confirmation Dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 bg-slate-950 border rounded-2xl shadow-2xl relative overflow-hidden transition-colors duration-300
            ${confirmCycle === 2 ? 'border-rose-500/30 bg-rose-950/5' : 'border-slate-800'}`}
          >
            {/* Warning indicator */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${confirmCycle === 2 ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-lg font-bold text-white font-sans">
                {confirmCycle === 1 ? 'Konfirmasi Sumber Dana (Tahap 1/2)' : 'PERINGATAN KERAS! (Tahap 2/2)'}
              </h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6 font-sans">
              {confirmCycle === 1 
                ? `Apakah Anda yakin ingin mengubah dompet sumber dana untuk Mode Anak Kost? Perhitungan batas harian Anda akan disesuaikan menggunakan saldo dompet yang baru.`
                : `PERINGATAN: Perubahan sumber dana dapat menyebabkan ketidakcocokan data alokasi dan memicu penalti batas harian (Survival Penalty) secara drastis jika saldo dompet baru lebih rendah. Pastikan Anda memahami konsekuensi ini!`
              }
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-medium text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmOk}
                disabled={!canConfirmChange}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                  ${confirmCycle === 2 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 animate-pulse' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}`}
              >
                {confirmCycle === 1 
                  ? (canConfirmChange ? 'OK' : `OK (${confirmCountdown}s)`)
                  : (canConfirmChange ? 'Setujui & Ubah' : `Setujui & Ubah (${confirmCountdown}s)`)
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
