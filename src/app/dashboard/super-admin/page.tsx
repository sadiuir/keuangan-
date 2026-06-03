'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { 
  Users, 
  Wallet, 
  History, 
  KeyRound, 
  Trash2, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Loader2, 
  Check, 
  CreditCard
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Akses ditolak atau kesalahan jaringan');
  return res.json();
});

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

export default function SuperAdminPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/users', fetcher);
  
  // Modal states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password minimal 6 karakter');
      return;
    }

    setResetSubmitting(true);
    setResetError('');
    setResetSuccess('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          userId: selectedUser.id,
          newPassword
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal mereset password');
      }

      setResetSuccess('Password berhasil diperbarui!');
      setTimeout(() => {
        setResetModalOpen(false);
        setNewPassword('');
        setResetSuccess('');
      }, 1500);
    } catch (err: any) {
      setResetError(err.message || 'Terjadi kesalahan');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    setDeleteSubmitting(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_user',
          userId: selectedUser.id
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal menghapus pengguna');
      }

      setDeleteModalOpen(false);
      mutate(); // Refresh the list of users
    } catch (err: any) {
      setDeleteError(err.message || 'Terjadi kesalahan');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
          <p className="text-slate-400 text-sm">Memuat Super Admin Console...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="max-w-md p-6 glass-panel rounded-2xl border-rose-500/20 text-center">
          <ShieldAlert className="text-rose-500 mx-auto mb-3" size={40} />
          <h2 className="text-lg font-bold text-white mb-1">Akses Ditolak</h2>
          <p className="text-slate-400 text-sm">{error?.message || 'Hanya Super Admin yang diizinkan mengakses halaman ini'}</p>
        </div>
      </div>
    );
  }

  const { users = [], stats = {} } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <ShieldAlert className="text-indigo-400" size={24} />
          Super Admin Panel
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Pengaturan global sistem, manajemen akun pengguna, dan reset kredensial darurat.
        </p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-xl border border-slate-900 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Pengguna</p>
            <h3 className="text-2xl font-bold text-white mt-1.5 font-mono">{stats.totalUsers || 0}</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-slate-800">
            <Users size={18} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-900 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Dompet</p>
            <h3 className="text-2xl font-bold text-white mt-1.5 font-mono">{stats.totalWallets || 0}</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-slate-800">
            <Wallet size={18} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-900 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Mutasi</p>
            <h3 className="text-2xl font-bold text-white mt-1.5 font-mono">{stats.totalTransactions || 0}</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-slate-800">
            <History size={18} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-900 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Kontrak Cicilan</p>
            <h3 className="text-2xl font-bold text-white mt-1.5 font-mono">{stats.totalLoans || 0}</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-slate-800">
            <CreditCard size={18} />
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-900/80 bg-slate-900/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Daftar Akun Pengguna Keuangan</h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 font-semibold">
            {users.length} Akun Terdaftar
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-950/60 bg-slate-950/20 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Nama Lengkap</th>
                <th className="p-4">Alamat Email</th>
                <th className="p-4">Hak Akses</th>
                <th className="p-4">Tanggal Bergabung</th>
                <th className="p-4 text-center pr-6">Tindakan Kontrol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-sm">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-900/10 transition">
                  <td className="p-4 pl-6 font-semibold text-white">{u.name}</td>
                  <td className="p-4 text-slate-300 font-mono text-xs">{u.email}</td>
                  <td className="p-4">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider
                      ${u.role === 'ADMIN' 
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                    >
                      {u.role === 'ADMIN' ? 'Super Admin' : 'User Biasa'}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-400 font-medium">
                    {new Date(u.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="p-4 text-center pr-6 flex items-center justify-center gap-2.5">
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setNewPassword('');
                        setResetError('');
                        setResetSuccess('');
                        setResetModalOpen(true);
                      }}
                      title="Reset Password Akun"
                      className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                    >
                      <KeyRound size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setDeleteError('');
                        setDeleteModalOpen(true);
                      }}
                      disabled={u.role === 'ADMIN'}
                      title="Hapus Akun Permanen"
                      className="p-1.5 rounded bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-350 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
            
            <h3 className="text-base font-bold text-white mb-2">Reset Password Darurat</h3>
            <p className="text-xs text-slate-400 mb-4">
              Mengatur ulang kata sandi untuk akun <span className="text-indigo-400 font-semibold">{selectedUser?.name}</span>.
            </p>

            {resetError && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password Baru*</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className="w-full pl-3 pr-10 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-white text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  disabled={resetSubmitting}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-medium text-xs cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting || newPassword.length < 6}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer transition disabled:opacity-50"
                >
                  {resetSubmitting ? 'Mengubah...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-1.5">
              <Trash2 className="text-rose-500" size={18} />
              Hapus Akun Pengguna?
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Tindakan ini akan **menghapus secara permanen** akun <span className="text-white font-bold">{selectedUser?.name}</span> beserta semua data dompet, cicilan, riwayat transaksi, dan alokasi anggarannya. Tindakan ini **TIDAK BISA DIBATALKAN**.
            </p>

            {deleteError && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteSubmitting}
                className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-medium text-xs cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleteSubmitting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs cursor-pointer transition"
              >
                {deleteSubmitting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
