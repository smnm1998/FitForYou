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
                isFavorite: true,
                isThisWeek: true,
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

        console.log("📤 [DEBUG] API 응답 데이터 개수:", paginatedDiets.length);
        if (paginatedDiets.length > 0) {
            console.log("📤 [DEBUG] 첫 번째 식단 구조:", {
                id: paginatedDiets[0].id,
                title: paginatedDiets[0].title,
                hasAdvice: !!paginatedDiets[0].advice,
                advice: paginatedDiets[0].advice,
            });
        }

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

    // 그룹 내에서 AI 메타데이터가 있는 항목 찾기
    let aiTitle = null;
    let aiDescription = "개인 맞춤 식단 계획";
    let aiAdvice = null;
    let metadataItem = null;

    // 모든 항목을 순회하여 AI 메타데이터 찾기
    for (const item of group) {
        if (item.snack) {
            console.log(
                "🔍 [DEBUG] snack 필드 내용 (ID: " + item.id + "):",
                item.snack
            );
            try {
                const parsed = JSON.parse(item.snack);
                if (parsed.aiTitle) {
                    console.log("✅ [DEBUG] AI 제목 발견:", parsed.aiTitle);
                    console.log("✅ [DEBUG] AI 조언 발견:", parsed.aiAdvice);
                    aiTitle = parsed.aiTitle;
                    aiDescription = parsed.aiDescription || aiDescription;
                    aiAdvice = parsed.aiAdvice || null;
                    metadataItem = item;
                    item.snack = parsed.originalSnack; // 원래 간식 정보로 복원
                    break; // AI 메타데이터를 찾았으므로 중단
                }
            } catch (error) {
                // JSON 파싱 실패는 일반적인 간식 텍스트이므로 무시하고 계속
                console.log(
                    "🔍 [DEBUG] 일반 간식 텍스트 (ID: " + item.id + "):",
                    item.snack
                );
            }
        }
    }

    // AI 제목이 없는 경우 폴백 제목 생성 (기존 식단용)
    if (!aiTitle) {
        const createdDate = new Date(firstItem.createdAt);
        const dateString = createdDate.toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
        });
        const timeString = createdDate.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        aiTitle = `맞춤형 식단 - ${dateString} ${timeString}`;
        console.log("🔄 [DEBUG] 폴백 제목 생성:", aiTitle);
    }

    console.log("📋 [DEBUG] 최종 AI 제목:", aiTitle);

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
        firstDietId: firstItem.id,
        title: aiTitle,
        description: aiDescription,
        advice: aiAdvice,
        createdAt: firstItem.createdAt.toISOString(),
        weeklyDiet,
        isCompleteWeek,
        avgCalories,
        totalDays: group.length,
        isFavorite: firstItem.isFavorite || false,
        isThisWeek: firstItem.isThisWeek || false,
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
