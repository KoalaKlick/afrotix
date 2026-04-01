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
    prismaVersion: string | undefined;
};

const PRISMA_VERSION = "ticket_color_added";

const poolMax = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "15", 10);

const pool =
    globalForPrisma.pool ??
    new Pool({
        connectionString,
        max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
    });

import { logDB } from "./logger";

const adapter = globalForPrisma.adapter ?? new PrismaPg(pool);

// Check if we need to force recreate the client for logging updates in dev
if (process.env.NODE_ENV !== "production") {
    if (globalForPrisma.prisma && globalForPrisma.prismaVersion !== PRISMA_VERSION) {
        // Silently disconnect old client to clear old listeners
        globalForPrisma.prisma.$disconnect().catch(() => {});
        globalForPrisma.prisma = undefined;
    }
    globalForPrisma.prismaVersion = PRISMA_VERSION;
}

// Create a type-safe global for the logger handler
const globalForLogs = globalThis as unknown as {
    prismaQueryHandler: ((e: PrismaQueryEvent) => void) | undefined;
};

// Define the handler that extracts operation and table
const currentQueryHandler = (e: PrismaQueryEvent) => {
    const { query, duration, params } = e;
    const DEBUG_SQL = process.env.DEBUG_PRISMA_SQL === "true";

    let operation = "QUERY";
    let table = "database";

    try {
        const firstWord = query.trim().split(/\s+/)[0].toUpperCase();
        if (["SELECT", "UPDATE", "INSERT", "DELETE"].includes(firstWord)) {
            operation = firstWord;
            const tableMatch = query.match(/(?:FROM|UPDATE|INTO|DELETE\s+FROM)\s+"(?:public"\.)?"?([^"'\s]+)"?/i);
            if (tableMatch?.[1]) {
                table = tableMatch[1];
            }
        }
    } catch (_) {}

    logDB(operation, table, duration);

    if (DEBUG_SQL) {
        logger.debug({ query, params, duration }, "Full Prisma SQL");
    }
};

// Update the global handler so the existing Prisma client uses the newest logic
globalForLogs.prismaQueryHandler = currentQueryHandler;

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

    // Attach a delegator that calls the newest global handler
    client.$on("query", (e: PrismaQueryEvent) => {
        globalForLogs.prismaQueryHandler?.(e);
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
