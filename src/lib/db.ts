import { PrismaClient } from '@prisma/client';
import { neon } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

let _client: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (_client) return _client;

  let connectionString = process.env.DATABASE_URL;

  // Fallback to globalThis / global environment variables (Cloudflare Workers context)
  if (!connectionString && typeof globalThis !== 'undefined') {
    const g = globalThis as any;
    connectionString = g.DATABASE_URL || (g.env && g.env.DATABASE_URL);
  }

  if (!connectionString || connectionString === 'undefined' || connectionString === 'null') {
    throw new Error('DATABASE_URL is not configured. Please set the DATABASE_URL environment variable in your Cloudflare Pages dashboard settings (Variables and Secrets) and redeploy.');
  }

  const sql = neon(connectionString);
  const adapter = new PrismaNeon(sql);
  _client = new PrismaClient({ adapter });
  return _client;
}

// Proxy: prisma.user.findMany() dll bekerja seperti biasa,
// tapi inisialisasi terjadi saat request pertama (bukan saat import/build time)
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    return (getClient() as any)[prop as string];
  },
});
