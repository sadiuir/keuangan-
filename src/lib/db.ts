// Patch fs.readdir untuk Cloudflare Workers (unenv stub throws "not implemented")
// Aman karena dengan driverAdapters, Prisma tidak perlu binary query engine
try {
  const fs = require('fs');
  try { fs.readdirSync('/'); } catch (e: any) {
    if (e?.message?.includes('not implemented')) {
      fs.readdir = (p: any, ...a: any[]) => { const cb = a.pop(); cb?.(null, []); };
      fs.readdirSync = () => [];
    }
  }
} catch {}

const { PrismaClient } = require('../generated/prisma/client');
const { neon } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');

let _client: any = null;

function getClient(): any {
  if (_client) return _client;
  const sql = neon(process.env.DATABASE_URL!);
  _client = new PrismaClient({ adapter: new PrismaNeon(sql) });
  return _client;
}

// Proxy: prisma.user.findMany() dll bekerja seperti biasa,
// tapi inisialisasi terjadi saat request pertama (bukan saat import/build time)
export const prisma: any = new Proxy({} as any, {
  get(_, prop: string | symbol) {
    return (getClient() as any)[prop as string];
  },
});
