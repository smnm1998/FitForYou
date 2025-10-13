import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const userId = parseInt(session.user.id);
        const workoutId = parseInt(params.id);
        const { field } = await request.json();

        if (!["isFavorite", "isThisWeek"].includes(field)) {
            return NextResponse.json(
                { success: false, error: "잘못된 필드입니다." },
                { status: 400 }
            );
        }

        // 현재 값 조회
        const workout = await prisma.savedWorkout.findFirst({
            where: { id: workoutId, userId },
            select: { isFavorite: true, isThisWeek: true },
        });

        if (!workout) {
            return NextResponse.json(
                { success: false, error: "운동을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        // 토글
        const updated = await prisma.savedWorkout.update({
            where: { id: workoutId },
            data: {
                [field]: !workout[field as keyof typeof workout],
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                isFavorite: updated.isFavorite,
                isThisWeek: updated.isThisWeek,
            },
        });
    } catch (error) {
        console.error("운동 토글 오류: ", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
