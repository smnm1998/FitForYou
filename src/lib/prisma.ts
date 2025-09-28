import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Supabase Pooler prepared statement 충돌 해결
export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
        log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
        // prepared statement 충돌을 방지하기 위한 설정
        errorFormat: "minimal",
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
