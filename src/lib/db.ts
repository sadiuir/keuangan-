import { PrismaClient } from '../generated/prisma/client';

let _client: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (_client) return _client;

  if (process.env.NODE_ENV === 'production') {
    // Cloudflare Workers: Neon HTTP mode (hanya dipanggil saat request, bukan build time)
    const { neon } = require('@neondatabase/serverless');
    const { PrismaNeon } = require('@prisma/adapter-neon');
    const sql = neon(process.env.DATABASE_URL!);
    _client = new PrismaClient({ adapter: new PrismaNeon(sql) });
  } else {
    // Development: pg Pool
    const { Pool } = require('pg');
    const { PrismaPg } = require('@prisma/adapter-pg');
    const globalAny = global as any;
    if (!globalAny.globalPrisma) {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      globalAny.globalPrisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    }
    _client = globalAny.globalPrisma;
  }

  return _client!;
}

// Proxy: prisma.user.findMany() dll bekerja seperti biasa,
// tapi inisialisasi terjadi saat request pertama (bukan saat import)
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    return (getClient() as any)[prop as string];
  },
});

export type { Decimal } from '../generated/prisma/client/runtime/library';
