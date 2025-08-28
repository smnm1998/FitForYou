import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 완료된 작업의 결과를 데이터베이스에 저장
export async function POST(
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

        // 완료된 작업 조회
        const job = await prisma.aiJob.findFirst({
            where: {
                id: jobId,
                userId: userId,
                status: 'COMPLETED',
            },
        });

        if (!job) {
            return NextResponse.json(
                { success: false, error: "완료된 작업을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        if (!job.result) {
            return NextResponse.json(
                { success: false, error: "작업 결과가 없습니다." },
                { status: 400 }
            );
        }

        const result = job.result as any;

        if (job.jobType === 'DIET_GENERATION') {
            // 식단 저장
            await saveDietResult(userId, result);
            
            return NextResponse.json({
                success: true,
                message: "식단이 저장되었습니다!",
                redirect: "/diet",
            });

        } else if (job.jobType === 'WORKOUT_GENERATION') {
            // 운동 계획 저장
            await saveWorkoutResult(userId, result);
            
            return NextResponse.json({
                success: true,
                message: "운동 계획이 저장되었습니다!",
                redirect: "/workout",
            });
        }

        return NextResponse.json(
            { success: false, error: "지원하지 않는 작업 유형입니다." },
            { status: 400 }
        );

    } catch (error: any) {
        console.error("작업 결과 저장 오류:", error);
        return NextResponse.json(
            { success: false, error: "작업 결과 저장 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

async function saveDietResult(userId: number, result: any) {
    if (!result.weeklyDiet || !Array.isArray(result.weeklyDiet)) {
        throw new Error('Invalid diet result format');
    }

    console.log("💾 식단 데이터베이스 저장 시작...");

    const dietSavePromises = result.weeklyDiet.map(
        async (dayDiet: any, index: number) => {
            const date = new Date();
            date.setDate(date.getDate() + index); // 오늘부터 7일

            // 첫 번째 식단(오늘)에 AI 제목 정보를 snack 필드에 메타데이터로 저장
            let snackData = dayDiet.mealPlan?.snack || null;
            if (index === 0 && result.title) {
                const metadata = {
                    aiTitle: result.title,
                    aiDescription: result.description,
                    originalSnack: dayDiet.mealPlan?.snack,
                };
                snackData = JSON.stringify(metadata);
            }

            return prisma.savedDiet.create({
                data: {
                    userId,
                    date,
                    breakfast: dayDiet.mealPlan?.breakfast || "",
                    lunch: dayDiet.mealPlan?.lunch || "",
                    dinner: dayDiet.mealPlan?.dinner || "",
                    snack: snackData,
                    totalCalories: dayDiet.mealPlan?.totalCalories || 0,
                },
            });
        }
    );

    await Promise.all(dietSavePromises);
    console.log("✅ 식단 데이터베이스 저장 완료");
}

async function saveWorkoutResult(userId: number, result: any) {
    if (!result.weeklyWorkout || !Array.isArray(result.weeklyWorkout)) {
        throw new Error('Invalid workout result format');
    }

    console.log("💾 운동 계획 데이터베이스 저장 시작...");

    const workoutSavePromises = result.weeklyWorkout.map(
        async (dayWorkout: any, index: number) => {
            const date = new Date();
            date.setDate(date.getDate() + index); // 오늘부터 7일

            // 첫 번째 운동에 AI 제목 정보를 exercises 필드에 메타데이터로 저장
            let exercisesData = JSON.stringify(dayWorkout.workoutPlan?.exercises || []);
            if (index === 0 && result.title) {
                const metadata = {
                    aiTitle: result.title,
                    aiDescription: result.description,
                    originalExercises: dayWorkout.workoutPlan?.exercises,
                };
                exercisesData = JSON.stringify(metadata);
            }

            return prisma.savedWorkout.create({
                data: {
                    userId,
                    date,
                    workoutType: dayWorkout.workoutPlan?.type || "",
                    duration: dayWorkout.workoutPlan?.duration || "",
                    intensity: dayWorkout.workoutPlan?.intensity || 'medium',
                    targetMuscles: JSON.stringify(dayWorkout.workoutPlan?.targetMuscles || []),
                    exercises: exercisesData,
                    estimatedCalories: dayWorkout.workoutPlan?.estimatedCalories || 0,
                },
            });
        }
    );

    await Promise.all(workoutSavePromises);
    console.log("✅ 운동 계획 데이터베이스 저장 완료");
}