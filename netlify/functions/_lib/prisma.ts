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

// Runtime config inspection to identify Data Proxy/Accelerate client
const anyPrisma = prisma as any;
console.info('[PRISMA:ENGINE_CONFIG]', {
  dataProxy: anyPrisma?._engineConfig?.dataProxy,
  activeProvider: anyPrisma?._engineConfig?.activeProvider,
  // file paths help pinpoint which client got bundled
  runtimePath: require.resolve('@prisma/client/runtime/binary.js'),
  clientPkg: require('@prisma/client/package.json'),
});

if (!globalThis.__prisma) {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
