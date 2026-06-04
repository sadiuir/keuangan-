import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const envKeys = Object.keys(process.env);
    
    // Check database connection string safely
    const dbUrl = process.env.DATABASE_URL;
    const dbUrlStatus = dbUrl 
      ? {
          present: true,
          length: dbUrl.length,
          startsWith: dbUrl.substring(0, 15),
          isStringUndefined: dbUrl === 'undefined',
          isStringNull: dbUrl === 'null'
        }
      : { present: false };

    // Check globalThis env values
    const g = globalThis as any;
    const globalDbUrl = g.DATABASE_URL || (g.env && g.env.DATABASE_URL);
    const globalDbUrlStatus = globalDbUrl
      ? {
          present: true,
          length: globalDbUrl.length,
          startsWith: globalDbUrl.substring(0, 15)
        }
      : { present: false };

    return NextResponse.json({
      message: "Debug environment variables securely",
      nodeEnv: process.env.NODE_ENV,
      envKeys,
      databaseUrlStatus: dbUrlStatus,
      globalDatabaseUrlStatus: globalDbUrlStatus,
      globalKeys: Object.keys(g).filter(k => k !== 'console' && k !== 'global' && k !== 'process'),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
