'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { 
  Cpu, 
  Play, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to load logs');
  return res.json();
});

export default function AdminPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/cron/logs', fetcher, {
    refreshInterval: 8000 // refresh logs every 8s
  });

  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<any>(null);
  const [triggerError, setTriggerError] = useState('');

  const handleTriggerCron = async () => {
    setTriggering(true);
    setTriggerResult(null);
    setTriggerError('');

    try {
      // Fetch CRON_SECRET from local API session or env
      // We pass the secret query param. For safety we read the secret key from the client 
      // or make a GET request to trigger the cron job.
      // Since CRON_SECRET is stored in env, we trigger '/api/cron/auto-debet?secret=musad_cron_secret_2026_admin_automation_key'
      const secret = 'musad_cron_secret_2026_admin_automation_key';
      const res = await fetch(`/api/cron/auto-debet?secret=${secret}`, {
        method: 'POST',
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Eksekusi cron gagal');
      }

      setTriggerResult(resData);
      mutate(); // refresh logs
    } catch (err: any) {
      setTriggerError(err.message || 'Gagal memicu administrator virtual');
    } finally {
      setTriggering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
          <p className="text-slate-400 text-sm">Membuat Panel Administrator Virtual...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="max-w-md p-6 glass-panel rounded-2xl border-rose-500/20 text-center">
          <AlertCircle className="text-rose-500 mx-auto mb-3" size={40} />
          <h2 className="text-lg font-bold text-white mb-1">Gagal Memuat Log Admin</h2>
          <p className="text-slate-400 text-sm">Koneksi database tidak sah</p>
        </div>
      </div>
    );
  }

  const { logs = [] } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Cpu className="text-indigo-400" size={24} />
          Virtual Administrator (Cron Panel)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Picu tugas otomatisasi latar belakang secara manual atau pantau rekam jejak pekerjaan harian.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trigger Panel */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl space-y-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Play className="text-indigo-400" size={16} />
              Picu Auto-Debet Manual
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Jalankan Administrator Virtual saat ini untuk memotong cicilan yang jatuh tempo.</p>
          </div>

          {triggerError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <strong>Error:</strong> {triggerError}
            </div>
          )}

          {triggerResult && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono space-y-1">
              <div><strong>Success:</strong> {triggerResult.message}</div>
              <div>Processed: {triggerResult.processedCount} | Failed: {triggerResult.failedCount}</div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleTriggerCron}
              disabled={triggering}
              className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {triggering ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Mengeksekusi...
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  Jalankan Auto-Debet
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center italic">
              * Operasi ini divalidasi oleh token CRON_SECRET dan mengikuti prinsip ACID All-Or-Nothing.
            </p>
          </div>
        </div>

        {/* Logs Console List */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-900 shadow-xl flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="text-indigo-400" size={16} />
              Console Log Pekerjaan Latar Belakang
            </h3>
            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Clock size={10} /> Live Monitoring
            </span>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px] text-slate-400 bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-20 text-slate-600 italic">
                &gt; Console empty. Belum ada catatan tugas otomatisasi.
              </div>
            ) : (
              logs.map((log: any) => {
                const dateStr = new Date(log.executedAt).toLocaleString('id-ID');
                const isSuccess = log.status === 'SUCCESS';
                
                return (
                  <div key={log.id} className="border-b border-slate-900/60 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans">{dateStr}</span>
                      <span className={`inline-flex items-center gap-1 font-sans font-bold text-[9px] px-1.5 py-0.5 rounded border
                        ${isSuccess 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}
                      >
                        {isSuccess ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {log.status}
                      </span>
                    </div>
                    <div className="mt-1.5 text-slate-300 leading-relaxed break-all">
                      &gt; {log.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
