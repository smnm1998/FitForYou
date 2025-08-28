import { NextRequest, NextResponse } from "next/server";
import { jobProcessor } from "@/lib/job-processor";

// 실패한 작업들 재시도 (관리자용)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { limit = 10 } = body;

        // 실패한 작업들 재시도
        await jobProcessor.retryFailedJobs(limit);

        console.log(`🔄 실패한 작업 재시도 완료 (최대 ${limit}개)`);

        return NextResponse.json({
            success: true,
            message: `실패한 작업들을 재시도했습니다. (최대 ${limit}개)`,
        });

    } catch (error: any) {
        console.error("작업 재시도 오류:", error);
        return NextResponse.json(
            { success: false, error: "작업 재시도 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}