import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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
        const { id } = await params;
        const dietId = parseInt(id);
        const { field } = await request.json();

        if (!["isFavorite", "isThisWeek"].includes(field)) {
            return NextResponse.json(
                { success: false, error: "잘못된 필드입니다." },
                { status: 400 }
            );
        }

        // 현재 값 조회
        const diet = await prisma.savedDiet.findFirst({
            where: { id: dietId, userId },
            select: { isFavorite: true, isThisWeek: true },
        });

        if (!diet) {
            return NextResponse.json(
                { success: false, error: "식단을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        // 토글
        const updated = await prisma.savedDiet.update({
            where: { id: dietId },
            data: {
                [field]: !diet[field as keyof typeof diet],
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
        console.error("식단 토글 오류: ", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
