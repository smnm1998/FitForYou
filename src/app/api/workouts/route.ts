import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 운동 목록 조회
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const userId = parseInt(session.user.id);

        // 전체 운동 데이터 조회 (생성시간 역순)
        const allWorkouts = await prisma.savedWorkout.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                date: true,
                workoutType: true,
                duration: true,
                intensity: true,
                targetMuscles: true,
                exercises: true,
                estimatedCalories: true,
                createdAt: true,
            },
        });

        // 시간별로 그룹화 (1분 이내 생성된 것들은 같은 그룹으로 처리)
        const groupedWorkouts: any[] = [];
        const GROUP_THRESHOLD_MS = 60 * 1000; // 1분

        if (allWorkouts.length > 0) {
            let currentGroup = [allWorkouts[0]];

            for (let i = 1; i < allWorkouts.length; i++) {
                const prevWorkout = allWorkouts[i - 1];
                const currentWorkout = allWorkouts[i];
                const timeDiff =
                    prevWorkout.createdAt.getTime() -
                    currentWorkout.createdAt.getTime();

                if (timeDiff <= GROUP_THRESHOLD_MS) {
                    currentGroup.push(currentWorkout);
                } else {
                    // 현재 그룹을 처리하고 새 그룹 시작
                    const groupData = processGroupData(currentGroup);
                    groupedWorkouts.push(groupData);
                    currentGroup = [currentWorkout];
                }
            }

            // 마지막 그룹 처리
            if (currentGroup.length > 0) {
                const groupData = processGroupData(currentGroup);
                groupedWorkouts.push(groupData);
            }
        }

        // 페이지네이션 적용
        const totalGroups = groupedWorkouts.length;
        const paginatedWorkouts = groupedWorkouts.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,
            data: {
                workouts: paginatedWorkouts,
                pagination: {
                    page,
                    limit,
                    total: totalGroups,
                    pages: Math.ceil(totalGroups / limit),
                },
            },
        });
    } catch (error) {
        console.error("Get workouts error:", error);
        return NextResponse.json(
            { success: false, error: "운동 조회 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// 그룹 데이터 처리 함수
function processGroupData(group: any[]) {
    const firstItem = group[0];
    const lastItem = group[group.length - 1];

    // 그룹 내에서 AI 메타데이터가 있는 항목 찾기
    let aiTitle = null;
    let aiDescription = "개인 맞춤 운동 계획";
    let aiAdvice = null;
    let metadataItem = null;

    // 모든 항목을 순회하여 AI 메타데이터 찾기
    for (const item of group) {
        if (item.targetMuscles) {
            console.log("🔍 [DEBUG] targetMuscles 필드 내용 (ID: " + item.id + "):", item.targetMuscles);
            try {
                const parsed = JSON.parse(item.targetMuscles);
                if (parsed.aiTitle) {
                    console.log("✅ [DEBUG] AI 제목 발견:", parsed.aiTitle);
                    aiTitle = parsed.aiTitle;
                    aiDescription = parsed.aiDescription || aiDescription;
                    aiAdvice = parsed.aiAdvice || null;
                    metadataItem = item;
                    item.targetMuscles = JSON.stringify(parsed.originalTargetMuscles || []); // 원래 타겟근육으로 복원
                    break; // AI 메타데이터를 찾았으므로 중단
                }
            } catch (error) {
                // JSON 파싱 실패는 일반적인 타겟근육 배열이므로 무시하고 계속
                console.log("🔍 [DEBUG] 일반 타겟근육 데이터 (ID: " + item.id + "):", item.targetMuscles);
            }
        }
    }

    // AI 제목이 없는 경우 폴백 제목 생성 (기존 운동용)
    if (!aiTitle) {
        const createdDate = new Date(firstItem.createdAt);
        const dateString = createdDate.toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric"
        });
        const timeString = createdDate.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
        aiTitle = `맞춤형 운동 - ${dateString} ${timeString}`;
    }

    // 주간 운동 데이터 구성
    const weeklyWorkout = group.map((workout) => {
        const workoutDate = new Date(workout.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // targetMuscles와 exercises 파싱
        let targetMuscles: string[] = [];
        let exercises: any[] = [];

        try {
            targetMuscles = workout.targetMuscles
                ? JSON.parse(workout.targetMuscles)
                : [];
        } catch {
            targetMuscles = [];
        }

        try {
            exercises = workout.exercises ? JSON.parse(workout.exercises) : [];
        } catch {
            exercises = [];
        }

        return {
            id: workout.id,
            day: workoutDate.toLocaleDateString("ko-KR", { weekday: "long" }),
            date: workout.date.toISOString().split("T")[0],
            workoutPlan: {
                type: workout.workoutType || "",
                duration: workout.duration || "",
                intensity: workout.intensity || "medium",
                targetMuscles,
                exercises,
                estimatedCalories: workout.estimatedCalories || 0,
            },
            isToday: workoutDate.getTime() === today.getTime(),
        };
    });

    // 통계 계산
    const totalCalories = group.reduce(
        (sum, workout) => sum + (workout.estimatedCalories || 0),
        0
    );
    const avgCalories = Math.round(totalCalories / group.length);
    const isCompleteWeek = group.length === 7;

    return {
        id: `workout_group_${firstItem.createdAt.getTime()}`,
        title: aiTitle,
        description: aiDescription,
        advice: aiAdvice,
        createdAt: firstItem.createdAt.toISOString(),
        weeklyWorkout,
        isCompleteWeek,
        avgCalories,
        totalDays: group.length,
    };
}

// 운동 그룹 삭제
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, error: "삭제할 운동 ID가 필요합니다." },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        // 소유권 확인 및 삭제
        const deleteResult = await prisma.savedWorkout.deleteMany({
            where: {
                id: { in: ids.map((id) => parseInt(id.toString())) },
                userId,
            },
        });

        return NextResponse.json({
            success: true,
            message: `${deleteResult.count}개의 운동이 삭제되었습니다.`,
            deletedCount: deleteResult.count,
        });
    } catch (error) {
        console.error("Delete workouts error:", error);
        return NextResponse.json(
            { success: false, error: "운동 삭제 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
