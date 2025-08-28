import { NextRequest, NextResponse } from "next/server";

// 환경변수 상태 확인 (보안을 위해 실제 값은 숨김)
export async function GET(request: NextRequest) {
    try {
        const envCheck = {
            NODE_ENV: process.env.NODE_ENV,
            DATABASE_URL: process.env.DATABASE_URL ? "✅ 설정됨" : "❌ 누락",
            DIRECT_URL: process.env.DIRECT_URL ? "✅ 설정됨" : "❌ 누락", 
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ 설정됨" : "❌ 누락",
            NEXTAUTH_URL: process.env.NEXTAUTH_URL || "❌ 누락",
            OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✅ 설정됨" : "❌ 누락",
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json({
            success: true,
            environment: envCheck,
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}