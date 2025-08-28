import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jobProcessor } from "@/lib/job-processor";
import type { JobType } from "@prisma/client";

// 새로운 작업 생성
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { jobType, prompt, userProfile } = body;

        if (!jobType || !prompt) {
            return NextResponse.json(
                { success: false, error: "작업 유형과 프롬프트가 필요합니다." },
                { status: 400 }
            );
        }

        if (!['DIET_GENERATION', 'WORKOUT_GENERATION'].includes(jobType)) {
            return NextResponse.json(
                { success: false, error: "유효하지 않은 작업 유형입니다." },
                { status: 400 }
            );
        }

        if (prompt.length > 1000) {
            return NextResponse.json(
                { success: false, error: "요청사항이 너무 깁니다. 1000자 이내로 입력해주세요." },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        // 새로운 작업 생성
        const jobId = await jobProcessor.createJob(
            userId,
            jobType as JobType,
            prompt.trim(),
            userProfile
        );

        console.log(`📝 새로운 ${jobType} 작업 생성: ${jobId}`);

        return NextResponse.json({
            success: true,
            data: {
                jobId,
                message: `${jobType === 'DIET_GENERATION' ? '식단' : '운동'} 생성 작업이 시작되었습니다.`,
            },
        });

    } catch (error: any) {
        console.error("작업 생성 오류:", error);
        return NextResponse.json(
            { success: false, error: "작업 생성 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}