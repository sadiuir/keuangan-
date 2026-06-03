'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, ArrowRight, LogIn, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Seluruh kolom wajib diisi');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal melakukan pendaftaran');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-height-screen items-center justify-center min-h-screen px-4 py-8">
      <div className="w-full max-w-md p-8 glass-panel rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 rounded-full blur-3xl opacity-20 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500 rounded-full blur-3xl opacity-20 -z-10"></div>

        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
            <UserPlus size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Daftar Akun Baru</h1>
          <p className="text-sm text-slate-400 mt-1">Sistem Wealth Manager</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none text-white text-sm transition"
              placeholder="Contoh: Muhammad Abdullah Hasyim Musadi"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none text-white text-sm transition"
              placeholder="nama@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none text-white text-sm transition"
                placeholder="Min. 6 karakter"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name || !email || password.length < 6}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Mendaftarkan Sesi...' : 'Daftar & Masuk'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-sm text-slate-400">
            Sudah memiliki akun?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1">
              Masuk Sekarang
              <LogIn size={14} />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
