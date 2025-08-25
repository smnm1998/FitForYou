import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { SignupData } from '@/types'

export async function POST(request: NextRequest) {
    try {
        const body: SignupData = await request.json()
        const { userId, password, nickname, gender, height, weight, disease } = body

        if (!userId || !password || !nickname || !gender) {
            return NextResponse.json(
                { success: false, error: '필수 정보를 모두 입력해주세요.' },
                { status: 400 }
            )
        }

        const existingUser = await prisma.user.findUnique({
            where: { userId }
        })

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: '이미 사용 중인 아이디입니다.' },
                { status: 409 }
            )
        }

        const existingNickname = await prisma.user.findFirst({
            where: { nickname }
        })

        if (existingNickname) {
            return NextResponse.json(
                { success: false, error: '이미 사용 중인 닉네임입니다.' },
                { status: 409 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    userId,
                    password: hashedPassword,
                    nickname,
                    gender,
                }
            })

            if (height || weight || disease) {
                await tx.addInfo.create({
                    data: {
                        userId: newUser.id,
                        height,
                        weight,
                        disease,
                    }
                })
            }
            return newUser
        })

        return NextResponse.json({
            success: true,
            message: '회원가입이 성공적으로 완료되었습니다.',
            data: {
                id: user.id,
                userId: user.userId,
                nickname: user.nickname,
                gender: user.gender,
            }
        })
    } catch (error) {
        console.error('Signup error: ', error)
        return NextResponse.json(
            { success: false, error: '회원가입 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}