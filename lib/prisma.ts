import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/lib/generated/prisma";
import { logger } from "./logger";

type PrismaQueryEvent = {
  query: string;
  params: string;
  duration: number;
};

type PrismaLogEvent = {
  message: string;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize Prisma");
}

const globalForPrisma = globalThis as unknown as {
  pool: Pool | undefined;
  adapter: PrismaPg | undefined;
  prisma: PrismaClient | undefined;
};

const poolMax = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "5", 10);

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

const adapter = globalForPrisma.adapter ?? new PrismaPg(pool);

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

  client.$on("query", (e: PrismaQueryEvent) => {
    logger.debug(
      { query: e.query, params: e.params, duration: e.duration },
      "Prisma Query",
    );
  });

  client.$on("info", (e: PrismaLogEvent) => {
    logger.info({ message: e.message }, "Prisma Info");
  });

  client.$on("warn", (e: PrismaLogEvent) => {
    logger.warn({ message: e.message }, "Prisma Warn");
  });

  client.$on("error", (e: PrismaLogEvent) => {
    logger.error({ message: e.message }, "Prisma Error");
  });

  return client;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool = pool;
  globalForPrisma.adapter = adapter;
  globalForPrisma.prisma = prisma;
}

export default prisma;
