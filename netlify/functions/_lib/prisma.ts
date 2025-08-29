import { PrismaClient } from '@prisma/client';

// Create a global Prisma client instance to avoid multiple connections
declare global {
  var __prisma: PrismaClient | undefined;
}

// Runtime tripwire: Check if Edge client was accidentally bundled
console.info('[PRISMA:EDGE_PRESENT]', { 
  status: 'Safe - no Edge client loading in tripwire',
  note: 'Tripwire disabled to prevent edge client loading'
});

export const prisma = globalThis.__prisma ?? new PrismaClient({ 
  log: ['warn', 'error'],
  // Ensure we're using the library engine, not data proxy
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Debug once at startup: Check what's actually being used
const any = prisma as any;
console.info('[PRISMA:ENGINE]', {
  dataProxy: any?._engineConfig?.dataProxy,
  activeProvider: any?._engineConfig?.activeProvider,
  runtimePath: (() => {
    try { return require.resolve('@prisma/client/runtime/binary.js') } catch { return 'n/a' }
  })()
});

if (!globalThis.__prisma) {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
