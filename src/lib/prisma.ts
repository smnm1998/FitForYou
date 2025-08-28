// src/lib/prisma.ts

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
                // 수정된 부분: NODE_ENV 조건 분기를 제거하고 DATABASE_URL만 사용하도록 변경
                url: process.env.DATABASE_URL,
            },
        },
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
