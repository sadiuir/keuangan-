'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  History,
  PieChart,
  CreditCard,
  Coffee,
  Cpu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState('Muhammad Abdullah Hasyim Musadi');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('USER');

  // Profile Edit Form States
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editOldPassword, setEditOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);

  // Fetch session data client side
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUserName(data.user.name);
            setUserEmail(data.user.email);
            setUserRole(data.user.role || 'USER');
          }
        } else {
          // If 401, redirect to login
          router.push('/login');
        }
      } catch (err) {
        console.error('Session check failed:', err);
      }
    }
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editEmail) {
      setEditError('Nama dan Email wajib diisi');
      return;
    }
    
    setUpdating(true);
    setEditError('');
    setEditSuccess('');
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          name: editName,
          email: editEmail,
          password: editPassword,
          oldPassword: editOldPassword
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui profil');
      }
      
      setUserName(data.user.name);
      setUserEmail(data.user.email);
      setEditSuccess('Profil berhasil diperbarui!');
      
      setTimeout(() => {
        setProfileModalOpen(false);
        setEditSuccess('');
      }, 1500);
    } catch (err: any) {
      setEditError(err.message || 'Terjadi kesalahan');
    } finally {
      setUpdating(false);
    }
  };

  const navItems: SidebarItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Riwayat Transaksi', href: '/dashboard/transactions', icon: History },
    { name: 'Alokasi Cerdas', href: '/dashboard/budget', icon: PieChart },
    { name: 'Manajemen Cicilan', href: '/dashboard/loans', icon: CreditCard },
    { name: 'Mode Anak Kost', href: '/dashboard/anak-kost', icon: Coffee },
  ];

  const visibleNavItems = [
    ...navItems,
    ...(userRole === 'ADMIN' ? [{ name: 'Super Admin', href: '/dashboard/super-admin', icon: ShieldAlert }] : [])
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 relative">
      {/* Mobile Menu Trigger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden absolute top-4 left-4 p-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 z-50 hover:bg-slate-800"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-950 border-r border-slate-900 flex flex-col justify-between transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-64'} 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Branding header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-900/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-white text-base shadow-md shadow-indigo-600/30">
              WM
            </div>
            {!collapsed && (
              <span className="font-semibold text-base tracking-wide text-white whitespace-nowrap bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Wealth Manager
              </span>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-md hover:bg-slate-900 text-slate-400 hover:text-white transition"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group
                  ${isActive 
                    ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/25' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  }
                `}
              >
                <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400 transition'}`}>
                  <Icon size={18} />
                </div>
                {(!collapsed || mobileOpen) && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-900/60 bg-slate-950/80">
          <button
            onClick={() => {
              setEditName(userName);
              setEditEmail(userEmail);
              setEditPassword('');
              setEditOldPassword('');
              setEditError('');
              setEditSuccess('');
              setProfileModalOpen(true);
            }}
            className="flex items-center justify-between mb-3 w-full text-left p-1.5 rounded-lg hover:bg-slate-900/80 transition duration-150 cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Photo placeholder matching details */}
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-900 border border-slate-800 group-hover:border-indigo-500/50 flex items-center justify-center text-indigo-400 font-semibold shadow-inner transition">
                <User size={16} />
              </div>
              {(!collapsed || mobileOpen) && (
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate leading-tight">
                    {userName}
                  </h4>
                  <span className="text-[10px] text-slate-400 group-hover:text-indigo-400 transition font-medium">
                    Edit Profil
                  </span>
                </div>
              )}
            </div>
          </button>
          {(!collapsed || mobileOpen) ? (
            <button
              onClick={handleLogout}
              className="w-full py-1.5 px-3 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={12} />
              Keluar Sesi
            </button>
          ) : (
            <button
              onClick={handleLogout}
              title="Keluar Sesi"
              className="w-full py-2 hover:bg-slate-900 text-rose-400 hover:text-rose-300 transition flex justify-center rounded-lg"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out min-h-screen pb-12
          ${collapsed ? 'lg:pl-20' : 'lg:pl-64'} 
          pl-0 pt-16 lg:pt-0
        `}
      >
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile sidebar backdrop overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
        ></div>
      )}

      {/* Edit Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500 rounded-full blur-3xl opacity-20 -z-10"></div>
            
            <h3 className="text-lg font-bold text-white mb-4">Pengaturan Profil Pengguna</h3>
            
            {editError && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {editError}
              </div>
            )}
            
            {editSuccess && (
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password Lama (Wajib untuk ubah password)</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={editOldPassword}
                    onChange={(e) => setEditOldPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-white text-sm"
                    placeholder="Wajib diisi jika mengubah password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    {showOldPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password Baru (Opsional)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-white text-sm"
                    placeholder="Kosongkan jika tidak diubah"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  disabled={updating}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-medium text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                >
                  {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
