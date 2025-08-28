import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// NextAuth 디버깅용 API
export async function GET(request: NextRequest) {
    try {
        // 환경변수 체크
        const envStatus = {
            NODE_ENV: process.env.NODE_ENV,
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ 있음" : "❌ 없음",
            NEXTAUTH_URL: process.env.NEXTAUTH_URL || "❌ 없음",
            DATABASE_URL: process.env.DATABASE_URL ? "✅ 있음" : "❌ 없음",
        };

        // 데이터베이스 연결 테스트
        let dbStatus = "❌ 연결 실패";
        let userCount = 0;
        
        try {
            await prisma.$connect();
            userCount = await prisma.user.count();
            dbStatus = "✅ 연결 성공";
        } catch (dbError: any) {
            console.error("DB 연결 오류:", dbError);
            dbStatus = `❌ ${dbError.message}`;
        }

        return NextResponse.json({
            success: true,
            environment: envStatus,
            database: {
                status: dbStatus,
                userCount: userCount,
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error("디버깅 API 오류:", error);
        
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}