import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const { nickname } = await request.json()

        if (!nickname) {
            return NextResponse.json(
                { success: false, error: '닉네임을 입력해주세요.' },
                { status: 400 }
            )
        }

        if (nickname.length < 2) {
            return NextResponse.json({
                success: true,
                available: false,
                message: '닉네임은 2자 이상이어야 합니다.'
            })
        }

        const existingNickname = await prisma.user.findFirst({
            where: { nickname }
        })

        return NextResponse.json({
            success: true,
            available: !existingNickname,
            message: existingNickname
                ? '이미 사용 중인 닉네임입니다.'
                : '사용 가능한 닉네임입니다.'
        })
    } catch (error) {
        console.error('Check Nickname Error', error)
        return NextResponse.json(
            { success: false, error: '닉네임 확인 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}