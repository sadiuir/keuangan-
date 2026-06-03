'use client';

import React from 'react';
import useSWR from 'swr';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to load dashboard data');
  return res.json();
});

// Format numbers as Rupiah
const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Format large numbers in Millions (Jt)
const formatJuta = (value: number) => {
  if (value === 0) return '0';
  return (value / 1000000).toFixed(1) + ' Jt';
};

const COLORS = ['#06b6d4', '#6366f1', '#f59e0b']; // Cyan, Indigo, Amber

export default function DashboardPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/dashboard', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 10000 // refresh every 10s for active simulation
  });

  const [walletModalOpen, setWalletModalOpen] = React.useState(false);
  const [newWalletName, setNewWalletName] = React.useState('');
  const [newWalletBalance, setNewWalletBalance] = React.useState('');
  const [walletError, setWalletError] = React.useState('');
  const [walletSubmitting, setWalletSubmitting] = React.useState(false);

  // Wallet Edit/Delete Dialog States
  const [walletEditModalOpen, setWalletEditModalOpen] = React.useState(false);
  const [selectedWallet, setSelectedWallet] = React.useState<any>(null);
  const [editWalletName, setEditWalletName] = React.useState('');
  const [editWalletBalance, setEditWalletBalance] = React.useState('');
  const [walletEditError, setWalletEditError] = React.useState('');
  const [walletEditSubmitting, setWalletEditSubmitting] = React.useState(false);

  // Delete countdown states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleteCycle, setDeleteCycle] = React.useState(1); // 1 or 2
  const [deleteCountdown, setDeleteCountdown] = React.useState(10);
  const [canDeleteConfirm, setCanDeleteConfirm] = React.useState(false);

  const timerRef = React.useRef<any>(null);

  const startDeleteCountdown = (cycle: number) => {
    setDeleteCycle(cycle);
    setDeleteCountdown(10);
    setCanDeleteConfirm(false);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setCanDeleteConfirm(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleWalletClick = (wallet: any) => {
    setSelectedWallet(wallet);
    setEditWalletName(wallet.name);
    setEditWalletBalance(Number(wallet.balance).toString());
    setWalletEditError('');
    setWalletEditModalOpen(true);
  };

  const handleUpdateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWalletName) {
      setWalletEditError('Nama dompet wajib diisi');
      return;
    }
    const balanceVal = parseFloat(editWalletBalance);
    if (isNaN(balanceVal) || balanceVal < 0) {
      setWalletEditError('Saldo tidak boleh negatif');
      return;
    }

    setWalletEditSubmitting(true);
    setWalletEditError('');

    try {
      const res = await fetch('/api/wallets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedWallet.id,
          name: editWalletName,
          balance: balanceVal
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal mengubah dompet');
      }

      setWalletEditModalOpen(false);
      mutate();
    } catch (err: any) {
      setWalletEditError(err.message || 'Terjadi kesalahan');
    } finally {
      setWalletEditSubmitting(false);
    }
  };

  const handleDeleteTrigger = () => {
    setWalletEditModalOpen(false);
    setDeleteConfirmOpen(true);
    startDeleteCountdown(1);
  };

  const handleDeleteCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDeleteConfirmOpen(false);
    setDeleteCycle(1);
    setSelectedWallet(null);
  };

  const handleDeleteConfirm = async () => {
    if (!canDeleteConfirm) return;

    if (deleteCycle === 1) {
      startDeleteCountdown(2);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        const res = await fetch(`/api/wallets?id=${selectedWallet.id}`, {
          method: 'DELETE'
        });
        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error || 'Gagal menghapus dompet');
        }
        setDeleteConfirmOpen(false);
        setSelectedWallet(null);
        mutate();
      } catch (err: any) {
        alert(err.message || 'Terjadi kesalahan saat menghapus dompet');
      }
    }
  };

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName) {
      setWalletError('Nama dompet wajib diisi');
      return;
    }
    
    const balanceVal = parseFloat(newWalletBalance || '0');
    if (isNaN(balanceVal) || balanceVal < 0) {
      setWalletError('Saldo awal tidak boleh negatif');
      return;
    }
    
    setWalletSubmitting(true);
    setWalletError('');
    
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWalletName,
          initialBalance: balanceVal
        })
      });
      
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal membuat dompet');
      }
      
      setNewWalletName('');
      setNewWalletBalance('');
      setWalletModalOpen(false);
      
      mutate();
    } catch (err: any) {
      setWalletError(err.message || 'Terjadi kesalahan');
    } finally {
      setWalletSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
          <p className="text-slate-400 text-sm">Memuat Command Center...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="max-w-md p-6 glass-panel rounded-2xl border-rose-500/20 text-center">
          <AlertCircle className="text-rose-500 mx-auto mb-3" size={40} />
          <h2 className="text-lg font-bold text-white mb-1">Gagal Memuat Data</h2>
          <p className="text-slate-400 text-sm">{error?.message || 'Koneksi ke database gagal'}</p>
        </div>
      </div>
    );
  }

  // Highlight metrics
  const stats = [
    {
      name: 'Total Saldo',
      value: data.totalBalance,
      icon: Wallet,
      color: 'from-blue-600 to-indigo-600',
      textClass: 'text-indigo-400',
      bgClass: 'bg-indigo-500/10'
    },
    {
      name: 'Pemasukan Bulan Ini',
      value: data.monthIncome,
      icon: TrendingUp,
      color: 'from-emerald-600 to-teal-500',
      textClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10'
    },
    {
      name: 'Pengeluaran Bulan Ini',
      value: data.monthExpense,
      icon: TrendingDown,
      color: 'from-rose-600 to-pink-500',
      textClass: 'text-rose-400',
      bgClass: 'bg-rose-500/10'
    },
    {
      name: 'Sisa Dana Alokasi (SDA)',
      value: data.sda,
      icon: ShieldCheck,
      color: 'from-cyan-600 to-teal-500',
      textClass: 'text-cyan-400',
      bgClass: 'bg-cyan-500/10',
      tooltip: 'Uang aman setelah dikurangi cicilan aktif bulan ini'
    }
  ];

  // Allocation Pie Chart Data
  const pieData = [
    { name: 'Tabungan', value: data.allocationPct.tabungan },
    { name: 'Dana Darurat', value: data.allocationPct.darurat },
    { name: 'Jajan & Hiburan', value: data.allocationPct.jajan }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Command Center</h1>
        <p className="text-sm text-slate-400 mt-1">
          Selamat datang kembali, <span className="text-indigo-400 font-medium">{data.user.name}</span>
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="glass-panel glass-panel-hover rounded-xl p-5 border border-slate-900 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[120px]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    {stat.name}
                  </p>
                  <h3 className="text-2xl font-bold text-white mt-2 font-mono">
                    {formatRupiah(stat.value)}
                  </h3>
                </div>
                <div className={`p-2.5 rounded-lg border border-slate-800 ${stat.textClass} ${stat.bgClass}`}>
                  <Icon size={20} />
                </div>
              </div>
              {stat.tooltip && (
                <div className="mt-3 text-[10px] text-slate-500 italic">
                  * {stat.tooltip}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Wallets List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Dompet & Rekening Saya</h2>
          <button
            onClick={() => {
              setWalletError('');
              setNewWalletName('');
              setNewWalletBalance('');
              setWalletModalOpen(true);
            }}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition border border-slate-850 hover:border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg"
          >
            + Tambah Dompet
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.wallets && data.wallets.map((w: any) => (
            <div
              key={w.id}
              onClick={() => handleWalletClick(w)}
              className="glass-panel glass-panel-hover p-4 rounded-xl border border-slate-900 shadow-md flex items-center justify-between cursor-pointer hover:border-indigo-500/40 hover:bg-slate-900/40 transition duration-150"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-slate-800 text-indigo-400">
                  <Wallet size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{w.name}</h4>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-white font-mono">{formatRupiah(Number(w.balance))}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Flux Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Daily Flux Chart</h2>
              <p className="text-xs text-slate-400 mt-0.5">Mutasi Kas Harian (Tanggal 1 - 31 Bulan Ini)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Pemasukan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Pengeluaran
              </span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyFlux} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="day" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  tickFormatter={(val) => val.replace('Tgl ', '')}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  tickFormatter={formatJuta} 
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                  formatter={(val: number) => [formatRupiah(val), '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="Pemasukan" 
                  stroke="#06b6d4" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorInc)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Pengeluaran" 
                  stroke="#6366f1" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorExp)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation Pie Chart */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Alokasi Anggaran Cerdas</h2>
            <p className="text-xs text-slate-400 mt-0.5">Proporsi Alokasi Dana Bulan Ini</p>
          </div>
          <div className="h-[220px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.5rem',
                    fontSize: '11px'
                  }}
                  formatter={(val: number) => [`${val}%`, 'Porsi']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total</span>
              <p className="text-xl font-bold text-white font-mono">100%</p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }}></span>
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="font-bold text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom widgets grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Bills widget */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Upcoming Bills (H-3)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Cicilan yang akan jatuh tempo dalam 3 hari ke depan</p>
            </div>
            <Calendar size={18} className="text-indigo-400" />
          </div>

          {data.upcomingBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShieldCheck className="text-emerald-500 mb-2" size={32} />
              <p className="text-slate-400 text-sm font-medium">Bebas Tagihan!</p>
              <p className="text-slate-500 text-xs mt-0.5">Tidak ada cicilan jatuh tempo dalam rentang 3 hari.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-900 space-y-3">
              {data.upcomingBills.map((bill: any) => (
                <div key={bill.id} className="flex items-center justify-between pt-3 first:pt-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{bill.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Jatuh tempo: Tanggal {bill.dueDate} ({bill.daysLeft === 0 ? 'Hari ini' : `${bill.daysLeft} hari lagi`}) • Bunga {bill.interestType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white font-mono">
                      {formatRupiah(bill.installment)}
                    </span>
                    <div className="mt-1">
                      <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-medium 
                        ${bill.daysLeft === 0 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}
                      >
                        {bill.daysLeft === 0 ? 'Segera Bayar' : 'Jatuh Tempo'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tambah Dompet Modal */}
        {walletModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md p-6 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500 rounded-full blur-3xl opacity-20 -z-10"></div>
              
              <h3 className="text-lg font-bold text-white mb-4">Tambah Dompet / Rekening Baru</h3>
              
              {walletError && (
                <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {walletError}
                </div>
              )}

              <form onSubmit={handleCreateWallet} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Nama Dompet / Rekening*</label>
                  <input
                    type="text"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    placeholder="Contoh: Bank BCA, E-Wallet OVO, Dompet Tunai"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Saldo Awal (Rupiah)</label>
                  <input
                    type="number"
                    value={newWalletBalance}
                    onChange={(e) => setNewWalletBalance(e.target.value)}
                    placeholder="Contoh: 500000"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-white text-sm font-mono"
                    min="0"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setWalletModalOpen(false)}
                    disabled={walletSubmitting}
                    className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-medium text-xs transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={walletSubmitting || !newWalletName}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {walletSubmitting ? 'Menyimpan...' : 'Tambah Dompet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Wallet Modal */}
        {walletEditModalOpen && selectedWallet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md p-6 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
              
              <h3 className="text-lg font-bold text-white mb-4 font-sans">Edit Dompet: {selectedWallet.name}</h3>
              
              {walletEditError && (
                <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {walletEditError}
                </div>
              )}

              <form onSubmit={handleUpdateWallet} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Nama Dompet</label>
                  <input
                    type="text"
                    value={editWalletName}
                    onChange={(e) => setEditWalletName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Saldo (Rupiah)</label>
                  <input
                    type="number"
                    value={editWalletBalance}
                    onChange={(e) => setEditWalletBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-white text-sm font-mono"
                    min="0"
                    required
                  />
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={handleDeleteTrigger}
                    className="px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-xs transition cursor-pointer"
                  >
                    Hapus Dompet
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWalletEditModalOpen(false)}
                      disabled={walletEditSubmitting}
                      className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-medium text-xs transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={walletEditSubmitting}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                    >
                      {walletEditSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Wallet Confirmation Dialog */}
        {deleteConfirmOpen && selectedWallet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className={`w-full max-w-md p-6 bg-slate-950 border rounded-2xl shadow-2xl relative overflow-hidden transition-colors duration-300
              ${deleteCycle === 2 ? 'border-rose-500/30 bg-rose-950/5' : 'border-slate-800'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${deleteCycle === 2 ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-white font-sans">
                  {deleteCycle === 1 ? 'Konfirmasi Hapus Dompet (Tahap 1/2)' : 'PERINGATAN KERAS! Hapus Permanen (Tahap 2/2)'}
                </h3>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mb-6 font-sans">
                {deleteCycle === 1 
                  ? `Apakah Anda yakin ingin menghapus dompet "${selectedWallet.name}"? Seluruh alokasi anggaran cerdas dan transaksi yang menggunakan dompet ini akan terpengaruh.`
                  : `TINDAKAN INI TIDAK DAPAT DIBATALKAN. Menghapus dompet "${selectedWallet.name}" akan menghapus secara permanen seluruh data transaksi, cicilan, dan alokasi yang terhubung dengannya dari database. Semua riwayat keuangan Anda di dompet ini akan hilang!`
                }
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-medium text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={!canDeleteConfirm}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                    ${deleteCycle === 2 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 animate-pulse' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}`}
                >
                  {deleteCycle === 1 
                    ? (canDeleteConfirm ? 'Hapus' : `Hapus (${deleteCountdown}s)`)
                    : (canDeleteConfirm ? 'Hapus Permanen' : `Hapus Permanen (${deleteCountdown}s)`)
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
