import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SigninData } from "@/lib/types";

export async function POST(request: NextRequest) {
    try {
        const body: SigninData = await request.json();
        const { userId, password } = body;

        if (!userId || !password) {
            return NextResponse.json(
                {
                    success: false,
                    error: "아이디와 비밀번호를 모두 입력해주세요.",
                },
                { status: 400 }
            );
        }

        // 사용자 조회 (신체정보 포함)
        const user = await prisma.user.findUnique({
            where: { userId },
            include: {
                addInfo: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "존재하지 않는 아이디입니다." },
                { status: 401 }
            );
        }

        // 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: "비밀번호가 올바르지 않습니다." },
                { status: 401 }
            );
        }

        // 성공 응답 (비밀번호 제외)
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            success: true,
            message: "로그인 성공",
            data: {
                user: userWithoutPassword,
            },
        });
    } catch (error) {
        console.error("Signin error:", error);
        return NextResponse.json(
            { success: false, error: "로그인 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
