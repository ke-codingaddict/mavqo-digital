import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { getServerEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaModels?: string };

/** Identifies the generated client, so a dev server picks up `prisma generate` without a restart. */
const MODELS = Object.keys(Prisma.ModelName).join(",");

function createClient() {
  const adapter = new PrismaPg({ connectionString: getServerEnv().DATABASE_URL });
  return new PrismaClient({ adapter });
}

/** Lazily-created singleton (reused across hot reloads in development). */
export function db(): PrismaClient {
  if (!globalForPrisma.prisma || globalForPrisma.prismaModels !== MODELS) {
    void globalForPrisma.prisma?.$disconnect();
    globalForPrisma.prisma = createClient();
    globalForPrisma.prismaModels = MODELS;
  }
  return globalForPrisma.prisma;
}
