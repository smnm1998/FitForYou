import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// API 및 데이터베이스 연결 상태 확인
export async function GET(request: NextRequest) {
    try {
        // 데이터베이스 연결 테스트
        await prisma.$connect();
        
        // AiJob 테이블 존재 여부 확인
        try {
            await prisma.aiJob.count();
            
            return NextResponse.json({
                success: true,
                status: "healthy",
                database: "connected",
                aiJobTable: "exists",
                timestamp: new Date().toISOString(),
            });
        } catch (tableError: any) {
            console.error("AiJob table error:", tableError);
            
            return NextResponse.json({
                success: false,
                status: "partial",
                database: "connected", 
                aiJobTable: "missing",
                error: "AiJob table not found",
                tableError: tableError.message,
                timestamp: new Date().toISOString(),
            }, { status: 500 });
        }
        
    } catch (error: any) {
        console.error("Health check failed:", error);
        
        return NextResponse.json({
            success: false,
            status: "unhealthy",
            database: "disconnected",
            error: error.message,
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}