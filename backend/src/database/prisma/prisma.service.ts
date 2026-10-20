import fs from 'node:fs';
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Helper function to dynamically configure SSL based on environment/file presence
function getSslConfig(): boolean | { ca: string; rejectUnauthorized: boolean } {
  const certPath = process.env.RDS_CA_CERT_PATH || '/app/rds-ca-bundle.pem';

  if (fs.existsSync(certPath)) {
    return {
      ca: fs.readFileSync(certPath, 'utf8'),
      rejectUnauthorized: true,
    };
  }

  // Fallback for local development when certificate file is not present locally
  return false;
}

// ─── Dev singleton ────────────────────────────────────────────────────────────
// NestJS hot-reload (HMR) re-instantiates every provider on each code change.
// Without this guard, each reload creates a new PrismaClient and a new pg pool,
// quickly exhausting Neon's 5-connection free-tier limit.
// In production this global is never populated, so a fresh client is used.
const globalForPrisma = globalThis as unknown as {
  _prismaClient: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ssl: getSslConfig(),
  });

  return new PrismaClient({
    adapter,
    // Avoid flooding the console on every HMR cycle with query logs.
    // Switch 'warn' to 'query' temporarily if you need to debug slow queries.
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // In dev, reuse the cached adapter+client across HMR cycles.
    // In production, always build fresh.
    if (
      process.env.NODE_ENV !== 'production' &&
      globalForPrisma._prismaClient
    ) {
      super({
        adapter: new PrismaPg({
          connectionString: process.env.DATABASE_URL,
          ssl: getSslConfig(),
        }),
      });
      // Overwrite the internal engine reference with the cached one so all
      // queries go through the already-connected pool.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cached = globalForPrisma._prismaClient as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)._engine = cached._engine;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)._clientVersion = cached._clientVersion;
      return;
    }

    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      ssl: getSslConfig(),
    });

    super({ adapter });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma._prismaClient = this;
    }
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma._prismaClient = undefined;
    }
  }
}