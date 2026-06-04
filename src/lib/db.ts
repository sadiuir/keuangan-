import { PrismaClient } from '@prisma/client';
import { neon } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

let _client: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (_client) return _client;

  let connectionString = process.env.DATABASE_URL;

  console.log('--- DATABASE CONNECTION INITIALIZATION ---');
  console.log('process.env.DATABASE_URL present:', !!connectionString);

  // Fallback to globalThis / global environment variables (Cloudflare Workers context)
  if (!connectionString && typeof globalThis !== 'undefined') {
    const g = globalThis as any;
    connectionString = g.DATABASE_URL || (g.env && g.env.DATABASE_URL);
    console.log('Fallback to globalThis.DATABASE_URL present:', !!connectionString);
  }

  // Hardcoded connection string fallback as a last resort
  if (!connectionString || connectionString === 'undefined' || connectionString === 'null') {
    console.log('Using hardcoded Neon connection string fallback');
    connectionString = "postgresql://neondb_owner:npg_Bc9XAslyxe2O@ep-hidden-firefly-aogobpz0.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
  }

  if (connectionString) {
    console.log('Connection string format check - starts with:', connectionString.substring(0, 15));
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
