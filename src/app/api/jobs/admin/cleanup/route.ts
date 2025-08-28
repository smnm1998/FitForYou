import { NextRequest, NextResponse } from "next/server";
import { jobProcessor } from "@/lib/job-processor";

// 오래된 작업 정리 (관리자용)
export async function DELETE(request: NextRequest) {
    try {
        // 30일 이상 된 완료/실패한 작업 정리
        await jobProcessor.cleanupOldJobs();

        console.log("🧹 오래된 작업 정리 완료");

        return NextResponse.json({
            success: true,
            message: "오래된 작업들이 정리되었습니다.",
        });

    } catch (error: any) {
        console.error("작업 정리 오류:", error);
        return NextResponse.json(
            { success: false, error: "작업 정리 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}