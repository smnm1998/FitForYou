import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json()
        

        if (!userId) {
            return NextResponse.json(
                { success: false, error: '아이디를 입력해주세요.' },
                { status: 400 }
            )
        }

        if (userId.length < 4) {
            return NextResponse.json({
                success: true,
                available: false,
                message: '아이디는 4자 이상이어야 합니다.'
            })
        }

        // 데이터베이스에서 검색
        const existingUser = await prisma.user.findUnique({
            where: { userId }
        })


        const response = {
            success: true,
            available: !existingUser,
            message: existingUser
                ? '이미 사용 중인 아이디입니다.'
                : '사용 가능한 아이디입니다.'
        }


        return NextResponse.json(response)
        
    } catch (error) {
        console.error('❌ check User Id Error', error)
        return NextResponse.json(
            { success: false, error: '아이디 확인 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}