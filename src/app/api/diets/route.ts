import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 식단 상세 조회
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const params = await context.params;
        const dietId = parseInt(params.id);
        const userId = parseInt(session.user.id);

        const diet = await prisma.savedDiet.findFirst({
            where: {
                id: dietId,
                userId,
            },
        });

        if (!diet) {
            return NextResponse.json(
                { success: false, error: "식단을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: diet,
        });
    } catch (error) {
        console.error("Get diet error:", error);
        return NextResponse.json(
            { success: false, error: "식단 조회 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// 식단 수정
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const params = await context.params;
        const dietId = parseInt(params.id);
        const userId = parseInt(session.user.id);
        const body = await request.json();
        const { breakfast, lunch, dinner, snack, totalCalories } = body;

        // 소유권 확인
        const existingDiet = await prisma.savedDiet.findFirst({
            where: {
                id: dietId,
                userId,
            },
        });

        if (!existingDiet) {
            return NextResponse.json(
                { success: false, error: "식단을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        const updatedDiet = await prisma.savedDiet.update({
            where: { id: dietId },
            data: {
                breakfast,
                lunch,
                dinner,
                snack,
                totalCalories,
            },
        });

        return NextResponse.json({
            success: true,
            message: "식단이 성공적으로 수정되었습니다.",
            data: updatedDiet,
        });
    } catch (error) {
        console.error("Update diet error:", error);
        return NextResponse.json(
            { success: false, error: "식단 수정 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// 식단 삭제
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const params = await context.params;
        const dietId = parseInt(params.id);
        const userId = parseInt(session.user.id);

        // 소유권 확인
        const existingDiet = await prisma.savedDiet.findFirst({
            where: {
                id: dietId,
                userId,
            },
        });

        if (!existingDiet) {
            return NextResponse.json(
                { success: false, error: "식단을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        await prisma.savedDiet.delete({
            where: { id: dietId },
        });

        return NextResponse.json({
            success: true,
            message: "식단이 성공적으로 삭제되었습니다.",
        });
    } catch (error) {
        console.error("Delete diet error:", error);
        return NextResponse.json(
            { success: false, error: "식단 삭제 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
