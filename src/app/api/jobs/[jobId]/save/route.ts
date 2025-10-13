import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

        const job = await prisma.aiJob.findFirst({
            where: {
                id: jobId,
                userId: userId,
                status: "COMPLETED",
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

        if (job.jobType === "DIET_GENERATION") {
            const savedId = await saveDietResult(userId, result);
            return NextResponse.json({
                success: true,
                message: "식단이 저장되었습니다.",
                redirect: "/diet",
                savedId,
            });
        } else if (job.jobType === "WORKOUT_GENERATION") {
            const savedId = await saveWorkoutResult(userId, result);
            return NextResponse.json({
                success: true,
                message: "운동 계획이 저장되었습니다.",
                redirect: "/workout",
                savedId,
            });
        }

        return NextResponse.json(
            { success: false, error: "지원하지 않는 작업 유형입니다." },
            { status: 400 }
        );
    } catch (error: any) {
        console.error("작업 결과 저장 오류: ", error);
        return NextResponse.json(
            { success: false, error: "작업 결과 저장 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

async function saveDietResult(userId: number, result: any): Promise<string> {
    if (!result.weeklyDiet || !Array.isArray(result.weeklyDiet)) {
        throw new Error("Invalid diet result format");
    }

    console.log("식단 데이터베이스 저장 시작");
    const savedDiets = [];

    for (let index = 0; index < result.weeklyDiet.length; index++) {
        const dayDiet = result.weeklyDiet[index];
        const date = new Date();
        date.setDate(date.getDate() + index);

        let snackData = dayDiet.mealPlan?.snack || null;
        if (index === 0 && result.title) {
            const metadata = {
                aiTitle: result.title,
                aiDescription: result.description,
                originalSnack: dayDiet.mealPlan?.snack,
            };
            snackData = JSON.stringify(metadata);
        }

        const saved = await prisma.savedDiet.create({
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

        savedDiets.push(saved);
    }
    console.log("식단 데이터베이스 저장 완료");
    return savedDiets[0].id.toString();
}

async function saveWorkoutResult(userId: number, result: any): Promise<string> {
    if (!result.weeklyWorkout || !Array.isArray(result.weeklyWorkout)) {
        throw new Error("Invalid workout result format");
    }

    console.log("운동 계획 데이터베이스 저장 시작");
    const savedWorkouts = [];

    for (let index = 0; index < result.weeklyWorkout.length; index++) {
        const dayWorkout = result.weeklyWorkout[index];
        const date = new Date();
        date.setDate(date.getDate() + index);

        let exercisesData = JSON.stringify(
            dayWorkout.workoutPlan?.exercises || []
        );
        if (index === 0 && result.title) {
            const metadata = {
                aiTitle: result.title,
                aiDescription: result.description,
                originalExercises: dayWorkout.workoutPlan?.exercises,
            };
            exercisesData = JSON.stringify(metadata);
        }

        const saved = await prisma.savedWorkout.create({
            data: {
                userId,
                date,
                workoutType: dayWorkout.workoutPlan.type || "",
                duration: dayWorkout.workoutPlan?.duraiton || "",
                intensity: dayWorkout.workoutPla?.intensity || "medium",
                targetMuscles: JSON.stringify(
                    dayWorkout.workoutPlan?.targetMuscles || []
                ),
                exercises: exercisesData,
                estimatedCalories:
                    dayWorkout.workoutPlan?.estimatedCalories || 0,
            },
        });

        savedWorkouts.push(saved);
    }

    console.log("운동 계획 데이터베이스 저장 완료");
    return savedWorkouts[0].id.toString();
}
