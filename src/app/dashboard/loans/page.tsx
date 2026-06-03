'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  Calculator, 
  Plus, 
  CreditCard, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ToggleLeft, 
  ToggleRight,
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { calculateAmortization } from '@/lib/math';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch data');
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

export default function LoansPage() {
  const { data: dashboardData, isLoading: dashboardLoading } = useSWR('/api/dashboard', fetcher);
  const { data: loansData, isLoading: loansLoading, mutate } = useSWR('/api/loans', fetcher);

  // Form states for adding new loan
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState(10000000); // default 10M
  const [interestPct, setInterestPct] = useState(10); // default 10% annual
  const [tenor, setTenor] = useState(12); // default 12 months
  const [interestType, setInterestType] = useState<'FLAT' | 'EFFECTIVE' | 'ANNUITY'>('FLAT');
  const [dueDate, setDueDate] = useState(5);
  const [walletId, setWalletId] = useState('');
  const [autoDebet, setAutoDebet] = useState(true);
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Form states for instant calculator simulation
  const [simPrincipal, setSimPrincipal] = useState(5000000);
  const [simInterestPct, setSimInterestPct] = useState(12);
  const [simTenor, setSimTenor] = useState(6);
  const [simInterestType, setSimInterestType] = useState<'FLAT' | 'EFFECTIVE' | 'ANNUITY'>('FLAT');

  useEffect(() => {
    if (dashboardData?.wallets && dashboardData.wallets.length > 0) {
      setWalletId(dashboardData.wallets[0].id);
    }
  }, [dashboardData]);

  if (dashboardLoading || loansLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
          <p className="text-slate-400 text-sm">Membuat Mesin Pinjaman...</p>
        </div>
      </div>
    );
  }

  const { loans = [] } = loansData;
  const wallets = dashboardData?.wallets || [];

  // Instant simulator calculations
  const simResult = calculateAmortization(simPrincipal, simInterestPct, simTenor, simInterestType);

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('Nama cicilan wajib diisi');
      return;
    }
    if (principal <= 0 || interestPct < 0 || tenor <= 0) {
      setFormError('Parameter input tidak valid');
      return;
    }
    if (!walletId) {
      setFormError('Pilih dompet pembayaran');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          principal,
          annualInterestRatePct: interestPct,
          tenor,
          interestType,
          dueDate,
          walletId,
          autoDebet
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal menyimpan cicilan');
      }

      setSuccessToast('Kontrak cicilan berhasil didaftarkan!');
      setTimeout(() => setSuccessToast(''), 4000);
      
      // Reset form
      setName('');
      setPrincipal(10000000);
      setInterestPct(10);
      setTenor(12);
      setInterestType('FLAT');
      setDueDate(5);
      
      mutate();
      // refresh dashboard
      fetch('/api/dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAutoDebet = async (loanId: string) => {
    try {
      const res = await fetch('/api/loans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, action: 'toggle-autodebet' })
      });
      if (res.ok) {
        mutate();
        fetch('/api/dashboard');
      }
    } catch (e) {
      console.error('Error toggling auto-debet:', e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={18} />
          {successToast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Manajemen Cicilan & Amortisasi (Loan Engine)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Simulasikan amortisasi bunga Flat, Efektif, dan Anuitas, serta kelola kontrak cicilan berjalan.
        </p>
      </div>

      {/* Calculator Simulator & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan Calculator Form */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calculator className="text-indigo-400" size={16} />
              Simulasi Kalkulator Cicilan
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Lihat schedule bulanan instan sebelum dicatat.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Pokok Pinjaman (Rupiah)</label>
              <input
                type="number"
                value={simPrincipal}
                onChange={(e) => setSimPrincipal(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white text-sm font-mono transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bunga Per Tahun (%)</label>
                <input
                  type="number"
                  value={simInterestPct}
                  onChange={(e) => setSimInterestPct(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white text-sm font-mono transition"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tenor (Bulan)</label>
                <input
                  type="number"
                  value={simTenor}
                  onChange={(e) => setSimTenor(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white text-sm font-mono transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Metode Bunga</label>
              <select
                value={simInterestType}
                onChange={(e) => setSimInterestType(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white transition cursor-pointer"
              >
                <option value="FLAT">Bunga Flat (Pokok Tetap)</option>
                <option value="EFFECTIVE">Bunga Efektif (Pokok Menurun)</option>
                <option value="ANNUITY">Bunga Anuitas (Angsuran Tetap)</option>
              </select>
            </div>

            {/* Sim result card */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Angsuran / Bln (Awal):</span>
                <span className="font-bold text-white font-mono text-sm">{formatRupiah(simResult.installmentPerMonth)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Bunga:</span>
                <span className="font-bold text-indigo-400 font-mono text-xs">{formatRupiah(simResult.totalInterest)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Pelunasan:</span>
                <span className="font-bold text-white font-mono text-xs">{formatRupiah(simResult.totalPayment)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl overflow-hidden flex flex-col justify-between h-[390px]">
          <div>
            <h3 className="text-sm font-bold text-white">Tabel Rencana Amortisasi (Hasil Simulasi)</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Detail porsi pokok, bunga, dan sisa utang bulanan.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto mt-4 border border-slate-900/60 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/40 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-3 pl-4">Bln</th>
                  <th className="p-3 text-right">Angsuran</th>
                  <th className="p-3 text-right">Pokok</th>
                  <th className="p-3 text-right">Bunga</th>
                  <th className="p-3 text-right pr-4">Sisa Pokok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/20 font-mono">
                {simResult.schedule.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-900/10">
                    <td className="p-3 pl-4 font-sans text-slate-400">{row.month}</td>
                    <td className="p-3 text-right text-white">{formatRupiah(row.installment)}</td>
                    <td className="p-3 text-right text-emerald-400">{formatRupiah(row.principalPayment)}</td>
                    <td className="p-3 text-right text-indigo-400">{formatRupiah(row.interestPayment)}</td>
                    <td className="p-3 text-right pr-4 text-slate-500">{formatRupiah(row.remainingPrincipal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Active Loan Contracts */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl space-y-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="text-indigo-400" size={18} />
            Daftar Kontrak Cicilan Aktif
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Daftar kewajiban cicilan berjalan yang dipantau oleh Virtual Administrator.</p>
        </div>

        <div className="overflow-x-auto border border-slate-900/60 rounded-xl">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-400 font-semibold uppercase tracking-wider text-xs">
                <th className="p-4 pl-5">Nama Cicilan</th>
                <th className="p-4">Pokok Awal</th>
                <th className="p-4">Tenor</th>
                <th className="p-4">Metode Bunga</th>
                <th className="p-4">Tgl Tempo</th>
                <th className="p-4">Sumber Dompet</th>
                <th className="p-4">Auto-Debet</th>
                <th className="p-4 pr-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/30">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                    Tidak ada kontrak cicilan aktif terdaftar.
                  </td>
                </tr>
              ) : (
                loans.map((loan: any) => {
                  const walletName = loan.wallet?.name || 'Tidak ada';
                  const walletBalance = loan.wallet ? Number(loan.wallet.balance) : 0;
                  
                  // Calculate monthly payment for this period
                  const P = Number(loan.principal);
                  const interestRatePct = loan.interestRate * 100 * 12;
                  const tenor = loan.tenor;
                  const interestType = loan.interestType as 'FLAT' | 'EFFECTIVE' | 'ANNUITY';

                  const amort = calculateAmortization(P, interestRatePct, tenor, interestType);
                  const paymentNumber = tenor - loan.remainingTenor + 1;

                  let installment = 0;
                  if (interestType === 'EFFECTIVE') {
                    const periodIndex = paymentNumber - 1;
                    installment = amort.schedule[periodIndex]?.installment || amort.installmentPerMonth;
                  } else {
                    installment = amort.installmentPerMonth;
                  }
                  
                  installment = parseFloat(installment.toFixed(2));

                  // Determine Auto-Debet status
                  let statusText = 'Nonaktif';
                  let statusClass = 'bg-slate-900 text-slate-400 border border-slate-800';
                  let StatusIcon = XCircle;

                  if (loan.autoDebet) {
                    if (walletBalance >= installment) {
                      statusText = 'Aktif';
                      statusClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                      StatusIcon = CheckCircle2;
                    } else {
                      statusText = 'Tertunda (Saldo Kurang)';
                      statusClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
                      StatusIcon = AlertTriangle;
                    }
                  }

                  return (
                    <tr key={loan.id} className="hover:bg-slate-900/10 text-slate-300">
                      <td className="p-4 pl-5 font-semibold text-white">{loan.name}</td>
                      <td className="p-4 font-mono">{formatRupiah(P)}</td>
                      <td className="p-4">
                        <span className="font-semibold text-white">{loan.remainingTenor}</span>
                        <span className="text-slate-500"> / {loan.tenor} Bln</span>
                      </td>
                      <td className="p-4 font-medium text-slate-400">{loan.interestType}</td>
                      <td className="p-4 text-center font-mono">Tgl {loan.dueDate}</td>
                      <td className="p-4 font-mono text-xs">{walletName}</td>
                      
                      {/* Auto-debet action trigger toggle */}
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleAutoDebet(loan.id)}
                          className="text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                          title="Klik untuk mengubah status auto-debet"
                        >
                          {loan.autoDebet ? (
                            <ToggleRight className="text-indigo-500" size={24} />
                          ) : (
                            <ToggleLeft className="text-slate-600" size={24} />
                          )}
                        </button>
                      </td>
                      
                      {/* Status indicator tag */}
                      <td className="p-4 pr-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${statusClass}`}>
                          <StatusIcon size={12} />
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register new contract card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl max-w-2xl">
        <h3 className="text-sm font-bold text-white mb-4">Daftarkan Kontrak Cicilan Baru</h3>
        
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateLoan} className="space-y-4 text-xs sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
          <div className="sm:col-span-2">
            <label className="block text-slate-400 font-semibold mb-1">Nama Cicilan / Kontrak*</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: KPR Bank Mandiri, Cicilan Mobil"
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white transition text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Pokok Pinjaman (Rupiah)*</label>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white font-mono transition text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Bunga Per Tahun (%)*</label>
            <input
              type="number"
              value={interestPct}
              onChange={(e) => setInterestPct(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white font-mono transition text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Tenor (Bulan)*</label>
            <input
              type="number"
              value={tenor}
              onChange={(e) => setTenor(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white font-mono transition text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Metode Bunga*</label>
            <select
              value={interestType}
              onChange={(e) => setInterestType(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white transition text-xs cursor-pointer"
            >
              <option value="FLAT">Flat</option>
              <option value="EFFECTIVE">Efektif</option>
              <option value="ANNUITY">Anuitas</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Tanggal Jatuh Tempo (1-31)*</label>
            <input
              type="number"
              min="1"
              max="31"
              value={dueDate}
              onChange={(e) => setDueDate(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white font-mono transition text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Dompet Sumber Dana*</label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white transition text-xs cursor-pointer"
              required
            >
              {wallets.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatRupiah(Number(w.balance))})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-4 sm:pt-6 sm:col-span-2">
            <input
              type="checkbox"
              id="newAutoDebet"
              checked={autoDebet}
              onChange={(e) => setAutoDebet(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900/60 border border-slate-800 text-indigo-600 focus:ring-0 outline-none"
            />
            <label htmlFor="newAutoDebet" className="text-slate-300 font-semibold cursor-pointer">
              Aktifkan Pemotongan Auto-Debet Otomatis Bulanan
            </label>
          </div>

          <div className="sm:col-span-2 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Menyimpan Kontrak...' : 'Daftarkan Kontrak'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
