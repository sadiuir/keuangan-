'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Search, 
  Filter, 
  X, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowLeft
} from 'lucide-react';
import { parseInlineExpression } from '@/lib/math';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to load transaction data');
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

// Mask number with thousand dot separators (e.g. "500000" => "500.000")
const maskThousand = (valStr: string) => {
  // Remove existing non-digits (except operators for calc support)
  const clean = valStr.replace(/\./g, '');
  if (!/^\d+$/.test(clean)) return valStr; // return as-is if it has operators
  return Number(clean).toLocaleString('id-ID').replace(/,/g, '.');
};

const unmaskThousand = (valStr: string) => {
  return valStr.replace(/\./g, '');
};

export default function TransactionsPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/transactions', fetcher);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  
  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  const [nominalDisplay, setNominalDisplay] = useState(''); // masked with dots or formula
  const [description, setDescription] = useState('');
  const [isNeed, setIsNeed] = useState(false);
  const [walletId, setWalletId] = useState('');
  const [destWalletId, setDestWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().substring(0, 10));
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Auto-set default values when modal opens or data changes
  useEffect(() => {
    if (data) {
      if (data.wallets && data.wallets.length > 0) {
        setWalletId(data.wallets[0].id);
        if (data.wallets.length > 1) {
          setDestWalletId(data.wallets[1].id);
        }
      }
      const defaultCat = data.categories?.find((c: any) => c.type === txType);
      if (defaultCat) {
        setCategoryId(defaultCat.id);
      }
    }
  }, [data, txType, isModalOpen]);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
          <p className="text-slate-400 text-sm">Memuat Ledger Transaksi...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="max-w-md p-6 glass-panel rounded-2xl border-rose-500/20 text-center">
          <AlertCircle className="text-rose-500 mx-auto mb-3" size={40} />
          <h2 className="text-lg font-bold text-white mb-1">Gagal Memuat Transaksi</h2>
          <p className="text-slate-400 text-sm">Koneksi database terganggu</p>
        </div>
      </div>
    );
  }

  const { transactions = [], wallets = [], categories = [] } = data;

  // Filter transactions
  const filteredTransactions = transactions.filter((tx: any) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.category?.name && tx.category.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Handle nominal input formatting & calculation on blur
  const handleNominalBlur = () => {
    const raw = unmaskThousand(nominalDisplay);
    
    // Check if it's an expression (contains +, -, *, /)
    if (/[\+\-\*\/]/.test(raw)) {
      const parsedVal = parseInlineExpression(raw);
      if (parsedVal !== null) {
        setNominalDisplay(maskThousand(Math.round(parsedVal).toString()));
        setFormError('');
      } else {
        setFormError('Formula matematika tidak valid');
      }
    } else {
      // Just normal number formatting
      setNominalDisplay(maskThousand(raw));
    }
  };

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow digits, dots, and math operators
    if (/^[\d\.\+\-\*\/\(\)\s]*$/.test(val)) {
      setNominalDisplay(val);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const rawNominal = unmaskThousand(nominalDisplay);
    let finalAmount = parseFloat(rawNominal);

    // If it's a formula, parse it first
    if (/[\+\-\*\/]/.test(rawNominal)) {
      const parsedVal = parseInlineExpression(rawNominal);
      if (parsedVal !== null) {
        finalAmount = Math.round(parsedVal);
      } else {
        setFormError('Gagal memproses formula nominal');
        return;
      }
    }

    if (isNaN(finalAmount) || finalAmount <= 0) {
      setFormError('Nominal harus lebih besar dari 0');
      return;
    }

    if (!description.trim()) {
      setFormError('Deskripsi transaksi wajib diisi');
      return;
    }

    if (txType === 'TRANSFER' && walletId === destWalletId) {
      setFormError('Dompet asal dan tujuan tidak boleh sama');
      return;
    }

    setSubmitting(true);

    const activeWallet = wallets.find((w: any) => w.id === walletId);
    if ((txType === 'EXPENSE' || txType === 'TRANSFER') && activeWallet) {
      if (Number(activeWallet.balance) < finalAmount) {
        setFormError(`Saldo ${activeWallet.name} tidak mencukupi (${formatRupiah(Number(activeWallet.balance))})`);
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      type: txType,
      amount: finalAmount,
      description,
      is_need: isNeed,
      walletId,
      destinationWalletId: txType === 'TRANSFER' ? destWalletId : undefined,
      categoryId: txType !== 'TRANSFER' ? categoryId : undefined,
      date: txDate
    };

    // --- OPTIMISTIC UI UPDATE ---
    const tempTx = {
      id: `temp-${Date.now()}`,
      type: txType,
      amount: finalAmount,
      description,
      is_need: txType === 'EXPENSE' ? isNeed : false,
      date: new Date(txDate).toISOString(),
      walletId,
      destinationWalletId: txType === 'TRANSFER' ? destWalletId : null,
      categoryId: txType !== 'TRANSFER' ? categoryId : null,
      category: txType !== 'TRANSFER' ? categories.find((c: any) => c.id === categoryId) : null,
      wallet: wallets.find((w: any) => w.id === walletId),
      destinationWallet: txType === 'TRANSFER' ? wallets.find((w: any) => w.id === destWalletId) : null,
    };

    // Optimistically update list
    const updatedTransactions = [tempTx, ...transactions];
    mutate({ ...data, transactions: updatedTransactions }, false);

    setIsModalOpen(false);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal menyimpan transaksi');
      }

      setSuccessToast('Transaksi berhasil dicatat!');
      setTimeout(() => setSuccessToast(''), 4000);

      // Revalidate to get exact DB state & updated wallet balances
      mutate();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      // Rollback to original state on failure
      mutate();
    } finally {
      setSubmitting(false);
      // Reset form fields
      setNominalDisplay('');
      setDescription('');
      setIsNeed(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm shadow-xl flex items-center gap-2 animate-bounce">
          <TrendingUp size={18} />
          {successToast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Riwayat Arus Kas</h1>
          <p className="text-xs text-slate-400 mt-1">Lacak dan catat seluruh mutasi dana secara real-time</p>
        </div>
        
        <button
          onClick={() => {
            setTxType('EXPENSE');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition cursor-pointer shadow-lg shadow-indigo-600/10"
        >
          <Plus size={16} />
          Catat Mutasi
        </button>
      </div>

      {/* Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari deskripsi transaksi atau kategori..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white text-sm transition"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-3 text-slate-500" size={16} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white text-sm transition appearance-none cursor-pointer"
          >
            <option value="ALL">Semua Tipe</option>
            <option value="INCOME">Pemasukan (Masuk)</option>
            <option value="EXPENSE">Pengeluaran (Keluar)</option>
            <option value="TRANSFER">Transfer Antar Dompet</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900/80 bg-slate-900/10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Tanggal</th>
                <th className="p-4">Deskripsi</th>
                <th className="p-4">Dompet</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-right pr-6">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
                    Tidak ada riwayat transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx: any) => {
                  let badgeColor = 'bg-slate-900 text-slate-400 border border-slate-800';
                  let icon = <ArrowDownLeft size={14} />;
                  let amountColor = 'text-rose-400';
                  let amountSign = '-';

                  if (tx.type === 'INCOME') {
                    badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                    icon = <ArrowUpRight size={14} />;
                    amountColor = 'text-emerald-400';
                    amountSign = '+';
                  } else if (tx.type === 'TRANSFER') {
                    badgeColor = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                    icon = <ArrowRightLeft size={14} />;
                    amountColor = 'text-blue-400';
                    amountSign = '⇄';
                  }

                  return (
                    <tr key={tx.id} className="hover:bg-slate-900/20 transition group">
                      {/* Date */}
                      <td className="p-4 pl-6 text-xs text-slate-400 font-medium">
                        {new Date(tx.date).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      
                      {/* Description */}
                      <td className="p-4">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          {tx.description}
                          {tx.is_need && (
                            <span className="text-[9px] px-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded">
                              Wajib
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Wallet */}
                      <td className="p-4 text-xs text-slate-300">
                        {tx.type === 'TRANSFER' ? (
                          <div className="flex items-center gap-1.5 font-mono">
                            <span>{tx.wallet?.name}</span>
                            <span className="text-slate-500">→</span>
                            <span>{tx.destinationWallet?.name}</span>
                          </div>
                        ) : (
                          <span className="font-mono">{tx.wallet?.name}</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        {tx.type === 'TRANSFER' ? (
                          <span className="text-xs text-slate-500 italic">Mutasi Internal</span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
                            {icon}
                            {tx.category?.name || 'Lainnya'}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className={`p-4 text-right pr-6 font-semibold font-mono text-sm ${amountColor}`}>
                        {amountSign} {formatRupiah(Number(tx.amount))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal Creator */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 glass-panel rounded-2xl border border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold text-white mb-6">Catat Mutasi Keuangan</h2>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            {/* Type selector buttons with icons */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                type="button"
                onClick={() => setTxType('INCOME')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer
                  ${txType === 'INCOME'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm shadow-emerald-500/15'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900/60'}`}
              >
                <TrendingUp size={14} />
                Uang Masuk
              </button>
              <button
                type="button"
                onClick={() => setTxType('EXPENSE')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer
                  ${txType === 'EXPENSE'
                    ? 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-sm shadow-rose-500/15'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900/60'}`}
              >
                <TrendingDown size={14} />
                Uang Keluar
              </button>
              <button
                type="button"
                onClick={() => setTxType('TRANSFER')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer
                  ${txType === 'TRANSFER'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-sm shadow-blue-500/15'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900/60'}`}
              >
                <ArrowRightLeft size={14} />
                Transfer
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4 text-xs">
              {/* Nominal Input with masked dots & inline compiler on blur */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nominal (Rupiah)*</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-semibold">Rp</span>
                  <input
                    type="text"
                    value={nominalDisplay}
                    onChange={handleNominalChange}
                    onBlur={handleNominalBlur}
                    placeholder="Contoh: 150.000 atau 100000+50000"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white text-sm font-mono transition"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  * Ketik angka murni atau formula (misal: 10000+5000) lalu klik luar kolom untuk menghitung.
                </p>
              </div>

              {/* Source & Destination Wallets */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    {txType === 'TRANSFER' ? 'Dari Dompet*' : 'Dompet Sumber*'}
                  </label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white transition cursor-pointer"
                    required
                  >
                    {wallets.map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(Number(w.balance))})
                      </option>
                    ))}
                  </select>
                </div>

                {txType === 'TRANSFER' ? (
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Ke Dompet*</label>
                    <select
                      value={destWalletId}
                      onChange={(e) => setDestWalletId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white transition cursor-pointer"
                      required
                    >
                      {wallets.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatRupiah(Number(w.balance))})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Kategori*</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white transition cursor-pointer"
                      required
                    >
                      {categories
                        .filter((c: any) => c.type === txType)
                        .map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Date & IsNeed Checkbox */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tanggal*</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white transition cursor-pointer"
                    required
                  />
                </div>

                {txType === 'EXPENSE' && (
                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="isNeed"
                      checked={isNeed}
                      onChange={(e) => setIsNeed(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900/60 border border-slate-800 text-indigo-600 focus:ring-0 outline-none"
                    />
                    <label htmlFor="isNeed" className="text-slate-400 font-semibold cursor-pointer">
                      Kebutuhan Pokok / Wajib?
                    </label>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Deskripsi*</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan transaksi (misal: Beli Kopi, Bayar Air)"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 outline-none text-white transition"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-900/50 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !nominalDisplay || !description}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
