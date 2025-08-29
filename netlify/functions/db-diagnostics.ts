// netlify/functions/db-diagnostics.ts
import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

const redact = (u: string) => u.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');

export const handler: Handler = async (event) => {
  const url = process.env.DATABASE_URL || '';
  const isAccel = /^prisma(\+postgres)?:\/\//i.test(url);

  const report: any = {
    nodeVersion: process.versions.node,
    dbUrlScheme: url.split(':')[0] || '',
    dbUrlRedacted: redact(url),
    accelerateExpected: isAccel,
    steps: [] as any[],
  };

  // STEP 1: Check environment variables
  report.steps.push({ 
    step: 'env-check', 
    ok: true, 
    DATABASE_URL: redact(url),
    NODE_ENV: process.env.NODE_ENV,
    PRISMA_CLIENT_ENGINE_TYPE: process.env.PRISMA_CLIENT_ENGINE_TYPE
  });

  // STEP 2: Try to create Prisma client
  try {
    const prisma = new PrismaClient();
    report.steps.push({ 
      step: 'prisma-client-creation', 
      ok: true,
      clientVersion: (prisma as any)?._clientVersion
    });
    
    // STEP 3: Try a simple query
    try {
      await prisma.$queryRaw`SELECT 1`;
      report.steps.push({ step: 'prisma-query', ok: true });
    } catch (e: any) {
      report.steps.push({
        step: 'prisma-query',
        ok: false,
        code: e.code,
        message: e.message,
        meta: e.meta ?? null,
      });
    }
    
    await prisma.$disconnect();
  } catch (e: any) {
    report.steps.push({
      step: 'prisma-client-creation',
      ok: false,
      error: e.message,
      stack: e.stack?.split('\n').slice(0, 3).join('\n'),
    });
  }

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(report, null, 2),
  };
};
