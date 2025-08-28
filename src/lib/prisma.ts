import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Supabase Pooler prepared statement 충돌 해결
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
        db: {
            url: process.env.NODE_ENV === 'production' 
                ? process.env.DIRECT_URL  // 프로덕션에서는 Direct URL 사용
                : process.env.DATABASE_URL
        }
    }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma