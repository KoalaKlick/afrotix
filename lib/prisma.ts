import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/lib/generated/prisma";
import { logger } from "./logger";

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const client = new PrismaClient({
    adapter,
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
    ],
  });

  // @ts-expect-error - Prisma types
  client.$on("query", (e: any) => {
    logger.debug(
      { query: e.query, params: e.params, duration: e.duration },
      "Prisma Query",
    );
  });

  // @ts-expect-error - Prisma types
  client.$on("info", (e: any) => {
    logger.info({ message: e.message }, "Prisma Info");
  });

  // @ts-expect-error - Prisma types
  client.$on("warn", (e: any) => {
    logger.warn({ message: e.message }, "Prisma Warn");
  });

  // @ts-expect-error - Prisma types
  client.$on("error", (e: any) => {
    logger.error({ message: e.message }, "Prisma Error");
  });

  return client;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
