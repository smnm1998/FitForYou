import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jobProcessor } from "@/lib/job-processor";
import { prisma } from "@/lib/prisma";

// 데이터베이스 작업을 재시도하는 헬퍼 함수
async function retryDatabaseOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            console.warn(`Database operation failed (attempt ${i + 1}/${maxRetries}):`, error);
            
            // 연결이 닫힌 경우나 네트워크 오류인 경우 재시도
            if (error instanceof Error && 
                (error.message.includes('Server has closed the connection') ||
                 error.message.includes('Connection terminated') ||
                 error.message.includes('ECONNRESET'))) {
                
                // 점진적 대기 시간 (100ms, 200ms, 300ms)
                await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
                continue;
            }
            
            // 다른 종류의 오류는 즉시 던지기
            throw error;
        }
    }
    
    throw lastError;
}

// 작업 상태 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const { jobId } = await params;
        const userId = parseInt(session.user.id);

        // 작업 소유권 확인 (재시도 로직 포함)
        const job = await retryDatabaseOperation(() =>
            prisma.aiJob.findFirst({
                where: {
                    id: jobId,
                    userId: userId,
                },
            })
        );

        if (!job) {
            return NextResponse.json(
                { success: false, error: "작업을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        // 작업 상태 조회 (재시도 로직 포함)
        const jobStatus = await retryDatabaseOperation(() =>
            jobProcessor.getJobStatus(jobId)
        );

        return NextResponse.json({
            success: true,
            data: jobStatus,
        });

    } catch (error: any) {
        console.error("작업 상태 조회 오류:", error);
        return NextResponse.json(
            { success: false, error: "작업 상태 조회 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// 작업 취소
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const { jobId } = await params;
        const userId = parseInt(session.user.id);

        // 작업 소유권 확인 및 취소 (재시도 로직 포함)
        const result = await retryDatabaseOperation(() =>
            prisma.aiJob.updateMany({
                where: {
                    id: jobId,
                    userId: userId,
                    status: { in: ['PENDING', 'PROCESSING'] }, // 완료된 작업은 취소 불가
                },
                data: {
                    status: 'CANCELLED',
                    updatedAt: new Date(),
                },
            })
        );

        if (result.count === 0) {
            return NextResponse.json(
                { success: false, error: "취소할 수 없는 작업입니다." },
                { status: 400 }
            );
        }

        console.log(`🚫 작업 취소됨: ${jobId}`);

        return NextResponse.json({
            success: true,
            message: "작업이 취소되었습니다.",
        });

    } catch (error: any) {
        console.error("작업 취소 오류:", error);
        return NextResponse.json(
            { success: false, error: "작업 취소 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}