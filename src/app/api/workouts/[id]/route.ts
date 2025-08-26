import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 운동 상세 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Promise로 변경
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const awaitedParams = await params; // await 추가
        const workoutId = parseInt(awaitedParams.id);
        const userId = parseInt(session.user.id);

        const workout = await prisma.savedWorkout.findFirst({
            where: {
                id: workoutId,
                userId,
            },
        });

        if (!workout) {
            return NextResponse.json(
                { success: false, error: "운동을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        // JSON 필드 파싱
        const parsedWorkout = {
            ...workout,
            targetMuscles: workout.targetMuscles
                ? JSON.parse(workout.targetMuscles)
                : [],
            exercises: workout.exercises ? JSON.parse(workout.exercises) : [],
        };

        return NextResponse.json({
            success: true,
            data: parsedWorkout,
        });
    } catch (error) {
        console.error("Get workout error:", error);
        return NextResponse.json(
            { success: false, error: "운동 조회 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// 운동 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Promise로 변경
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const awaitedParams = await params; // await 추가
        const workoutId = parseInt(awaitedParams.id);
        const userId = parseInt(session.user.id);
        const body = await request.json();
        const {
            workoutType,
            duration,
            intensity,
            targetMuscles,
            exercises,
            estimatedCalories,
        } = body;

        // 소유권 확인
        const existingWorkout = await prisma.savedWorkout.findFirst({
            where: {
                id: workoutId,
                userId,
            },
        });

        if (!existingWorkout) {
            return NextResponse.json(
                { success: false, error: "운동을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        const updatedWorkout = await prisma.savedWorkout.update({
            where: { id: workoutId },
            data: {
                workoutType,
                duration,
                intensity,
                targetMuscles: targetMuscles
                    ? JSON.stringify(targetMuscles)
                    : null,
                exercises: exercises ? JSON.stringify(exercises) : null,
                estimatedCalories,
            },
        });

        // 응답용 데이터 파싱
        const parsedWorkout = {
            ...updatedWorkout,
            targetMuscles: updatedWorkout.targetMuscles
                ? JSON.parse(updatedWorkout.targetMuscles)
                : [],
            exercises: updatedWorkout.exercises
                ? JSON.parse(updatedWorkout.exercises)
                : [],
        };

        return NextResponse.json({
            success: true,
            message: "운동이 성공적으로 수정되었습니다.",
            data: parsedWorkout,
        });
    } catch (error) {
        console.error("Update workout error:", error);
        return NextResponse.json(
            { success: false, error: "운동 수정 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// 운동 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Promise로 변경
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const awaitedParams = await params; // await 추가
        const workoutId = parseInt(awaitedParams.id);
        const userId = parseInt(session.user.id);

        // 소유권 확인
        const existingWorkout = await prisma.savedWorkout.findFirst({
            where: {
                id: workoutId,
                userId,
            },
        });

        if (!existingWorkout) {
            return NextResponse.json(
                { success: false, error: "운동을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        await prisma.savedWorkout.delete({
            where: { id: workoutId },
        });

        return NextResponse.json({
            success: true,
            message: "운동이 성공적으로 삭제되었습니다.",
        });
    } catch (error) {
        console.error("Delete workout error:", error);
        return NextResponse.json(
            { success: false, error: "운동 삭제 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
