import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 식단 목록 조회
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

        // 전체 식단 데이터 조회 (생성시간 역순)
        const allDiets = await prisma.savedDiet.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                date: true,
                breakfast: true,
                lunch: true,
                dinner: true,
                snack: true,
                totalCalories: true,
                createdAt: true,
            },
        });

        // 시간별로 그룹화 (1분 이내 생성된 것들은 같은 그룹으로 처리)
        const groupedDiets: any[] = [];
        const GROUP_THRESHOLD_MS = 60 * 1000; // 1분

        if (allDiets.length > 0) {
            let currentGroup = [allDiets[0]];

            for (let i = 1; i < allDiets.length; i++) {
                const prevDiet = allDiets[i - 1];
                const currentDiet = allDiets[i];
                const timeDiff =
                    prevDiet.createdAt.getTime() -
                    currentDiet.createdAt.getTime();

                if (timeDiff <= GROUP_THRESHOLD_MS) {
                    currentGroup.push(currentDiet);
                } else {
                    // 현재 그룹을 처리하고 새 그룹 시작
                    const groupData = processGroupData(currentGroup);
                    groupedDiets.push(groupData);
                    currentGroup = [currentDiet];
                }
            }

            // 마지막 그룹 처리
            if (currentGroup.length > 0) {
                const groupData = processGroupData(currentGroup);
                groupedDiets.push(groupData);
            }
        }

        // 페이지네이션 적용
        const totalGroups = groupedDiets.length;
        const paginatedDiets = groupedDiets.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,
            data: {
                diets: paginatedDiets,
                pagination: {
                    page,
                    limit,
                    total: totalGroups,
                    pages: Math.ceil(totalGroups / limit),
                },
            },
        });
    } catch (error) {
        console.error("Get diets error:", error);
        return NextResponse.json(
            { success: false, error: "식단 조회 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// 그룹 데이터 처리 함수
function processGroupData(group: any[]) {
    const firstItem = group[0];
    const lastItem = group[group.length - 1];

    // 첫 번째 아이템의 snack에서 AI 메타데이터 추출 시도
    let aiTitle = "맞춤형 식단";
    let aiDescription = "개인 맞춤 식단 계획";

    if (firstItem.snack) {
        try {
            const parsed = JSON.parse(firstItem.snack);
            if (parsed.aiTitle) {
                aiTitle = parsed.aiTitle;
                aiDescription = parsed.aiDescription || aiDescription;
                firstItem.snack = parsed.originalSnack; // 원래 간식 정보로 복원
            }
        } catch {
            // JSON 파싱 실패시 그냥 원본 사용
        }
    }

    // 주간 식단 데이터 구성
    const weeklyDiet = group.map((diet) => {
        const dietDate = new Date(diet.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return {
            id: diet.id,
            day: dietDate.toLocaleDateString("ko-KR", { weekday: "long" }),
            date: diet.date.toISOString().split("T")[0],
            mealPlan: {
                breakfast: diet.breakfast || "",
                lunch: diet.lunch || "",
                dinner: diet.dinner || "",
                snack: diet.snack || null,
                totalCalories: diet.totalCalories || 0,
            },
            isToday: dietDate.getTime() === today.getTime(),
        };
    });

    // 통계 계산
    const totalCalories = group.reduce(
        (sum, diet) => sum + (diet.totalCalories || 0),
        0
    );
    const avgCalories = Math.round(totalCalories / group.length);
    const isCompleteWeek = group.length === 7;

    return {
        id: `diet_group_${firstItem.createdAt.getTime()}`,
        title: aiTitle,
        description: aiDescription,
        createdAt: firstItem.createdAt.toISOString(),
        weeklyDiet,
        isCompleteWeek,
        avgCalories,
        totalDays: group.length,
    };
}

// 식단 그룹 삭제
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
                { success: false, error: "삭제할 식단 ID가 필요합니다." },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        // 소유권 확인 및 삭제
        const deleteResult = await prisma.savedDiet.deleteMany({
            where: {
                id: { in: ids.map((id) => parseInt(id.toString())) },
                userId,
            },
        });

        return NextResponse.json({
            success: true,
            message: `${deleteResult.count}개의 식단이 삭제되었습니다.`,
            deletedCount: deleteResult.count,
        });
    } catch (error) {
        console.error("Delete diets error:", error);
        return NextResponse.json(
            { success: false, error: "식단 삭제 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
