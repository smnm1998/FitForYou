import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DB 작업 재시도 헬퍼
async function retryDatabaseOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3
): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            console.warn(
                `데이터베이스 접속에 실패했습니다 (시도회수: ${
                    i + 1
                } / ${maxRetries})`,
                error
            );

            if (error instanceof Error && error.message.includes("중복 선언")) {
                await new Promise((resolve) =>
                    setTimeout(resolve, 100 * (i + 1))
                );
                continue;
            }

            throw error;
        }
    }
    throw lastError;
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const userId = parseInt(session.user.id);
        const now = new Date();

        // 이번 주 시작 (월요일 기준)
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + daysToMonday);
        weekStart.setHours(0, 0, 0, 0);

        // 이번 주 끝 (일요일)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // 주간 운동 데이터 조회 (날짜별 그룹핑)
        const weeklyWorkouts = await retryDatabaseOperation(() =>
            prisma.savedWorkout.findMany({
                where: {
                    userId,
                    date: {
                        gte: weekStart,
                        lte: weekEnd,
                    },
                },
                select: {
                    date: true,
                    estimatedCalories: true,
                },
                orderBy: {
                    date: "asc",
                },
            })
        ).catch((err) => {
            console.error("이번 주 운동 루틴을 불러오는 데 실패했습니다", err);
            return [];
        });

        // 요일별 데이터 집계
        const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
        const dailyCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
        const dailyCalories: number[] = [0, 0, 0, 0, 0, 0, 0];

        weeklyWorkouts.forEach((workout) => {
            const workoutDate = new Date(workout.date);
            const dayIndex = workoutDate.getDay();
            // 일요일: 0 -> 6, 월요일: 1 -> 0 으로 변환
            const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;

            dailyCounts[adjustedIndex]++;
            dailyCalories[adjustedIndex] += workout.estimatedCalories || 0;
        });

        return NextResponse.json({
            success: true,
            data: {
                labels: weekDays,
                workoutCounts: dailyCounts,
                caloriesBurend: dailyCalories,
            },
        });
    } catch (error) {
        console.error("주간 활동 오류 발생: ", error);
        return NextResponse.json(
            {
                success: false,
                error: "주간 활동 데이터 조회 중 오류가 발생했습니다.",
            },
            { status: 500 }
        );
    }
}
