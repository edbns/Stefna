// netlify/functions/db-diagnostics.ts
import type { Handler } from '@netlify/functions';
import prisma from '../../lib/prisma';

// Optional: only if you have 'pg' installed. If not, comment the pg block.
let pg;
try { pg = require('pg'); } catch {}

const redact = (u: string) => u.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');

export const handler: Handler = async (event) => {
  const url = process.env.DATABASE_URL || '';
  const isAccel = /^prisma(\+postgres)?:\/\//i.test(url);

  const report: any = {
    nodeVersion: process.versions.node,
    prismaClientVersion: (prisma as any)?._clientVersion,
    dbUrlScheme: url.split(':')[0] || '',
    dbUrlRedacted: redact(url),
    accelerateExpected: isAccel,
    steps: [] as any[],
  };

  // STEP 1: Quick PG connect (bypasses Prisma) to prove Neon creds work
  if (pg) {
    try {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      const { rows } = await client.query('select now() as now, version()');
      await client.end();
      report.steps.push({ step: 'pg-connect', ok: true, info: rows[0] });
    } catch (e: any) {
      report.steps.push({ step: 'pg-connect', ok: false, error: e.message });
    }
  } else {
    report.steps.push({ step: 'pg-connect', ok: false, error: 'pg not installed; skipped' });
  }

  // STEP 2: Minimal Prisma call
  try {
    await prisma.$queryRaw`SELECT 1`;
    report.steps.push({ step: 'prisma-$queryRaw', ok: true });
  } catch (e: any) {
    report.steps.push({
      step: 'prisma-$queryRaw',
      ok: false,
      code: e.code,
      clientVersion: e.clientVersion,
      message: e.message,
      meta: e.meta ?? null,
      stack: e.stack?.split('\n').slice(0, 6).join('\n'),
    });
  }

  // STEP 3: Example model call (adjust to a tiny table you always have)
  try {
    await prisma.$executeRaw`SELECT 1`;
    report.steps.push({ step: 'prisma-$executeRaw', ok: true });
  } catch (e: any) {
    report.steps.push({ step: 'prisma-$executeRaw', ok: false, message: e.message, code: e.code });
  }

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(report, null, 2),
  };
};
