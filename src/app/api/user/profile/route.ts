import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// 프로필 조회
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: '인증이 필요합니다.' },
                { status: 401 }
            )
        }

        // [수정] include와 select를 동시에 사용할 수 없으므로, 관계 데이터를 가져오는 include로 통일합니다.
        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: { addInfo: true },
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: '사용자를 찾을 수 없습니다.' },
                { status: 404 }
            )
        }
        
        // password 필드를 응답에서 제외합니다.
        const { password, ...userWithoutPassword } = user;

        return NextResponse.json({
            success: true,
            data: userWithoutPassword
        })

    } catch (error) {
        console.error('Get profile error:', error)
        return NextResponse.json(
            { success: false, error: '프로필 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}

// 프로필 수정
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: '인증이 필요합니다.' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { nickname, height, weight, disease, currentPassword, newPassword } = body

        const userId = parseInt(session.user.id)
        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (!user) {
            return NextResponse.json(
                { success: false, error: '사용자를 찾을 수 없습니다.' },
                { status: 404 }
            )
        }

        // 비밀번호 변경이 요청된 경우
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ success: false, error: '현재 비밀번호를 입력해주세요.' }, { status: 400 });
            }
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
            if (!isCurrentPasswordValid) {
                return NextResponse.json({ success: false, error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 400 });
            }
        }

        // 닉네임 중복 확인 (본인 제외)
        if (nickname && nickname !== user.nickname) {
            const existingNickname = await prisma.user.findFirst({ where: { nickname, NOT: { id: userId } } });
            if (existingNickname) {
                return NextResponse.json({ success: false, error: '이미 사용 중인 닉네임입니다.' }, { status: 409 });
            }
        }
        
        // [개선] 트랜잭션 로직을 단순화하고 불필요한 DB 조회를 제거합니다.
        await prisma.$transaction(async (tx) => {
            // 1. 기본 사용자 정보 업데이트
            const updateData: any = {}
            if (nickname) updateData.nickname = nickname
            if (newPassword) updateData.password = await bcrypt.hash(newPassword, 12)

            if (Object.keys(updateData).length > 0) {
                await tx.user.update({
                    where: { id: userId },
                    data: updateData,
                })
            }

            // 2. 신체정보 업데이트 (upsert 사용)
            await tx.addInfo.upsert({
                where: { userId },
                update: {
                    ...(height !== undefined && { height: height || null }),
                    ...(weight !== undefined && { weight: weight || null }),
                    ...(disease !== undefined && { disease: disease || null })
                },
                create: {
                    userId,
                    height,
                    weight,
                    disease
                }
            })
        });

        // [개선] 트랜잭션 완료 후, 업데이트된 전체 정보를 한 번만 조회하여 반환합니다.
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { addInfo: true },
        })

        const { password, ...userWithoutPassword } = updatedUser!;

        return NextResponse.json({
            success: true,
            message: '프로필이 성공적으로 업데이트되었습니다.',
            data: userWithoutPassword
        })

    } catch (error) {
        console.error('Update profile error:', error)
        return NextResponse.json(
            { success: false, error: '프로필 업데이트 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}

// 회원 탈퇴 (기존 코드와 동일, 문제 없음)
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json()
        const { password } = body

        if (!password) {
            return NextResponse.json({ success: false, error: '비밀번호를 입력해주세요.' }, { status: 400 });
        }

        const userId = parseInt(session.user.id)
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ success: false, error: '비밀번호가 올바르지 않습니다.' }, { status: 400 });
        }

        await prisma.user.delete({ where: { id: userId } });

        return NextResponse.json({ success: true, message: '회원 탈퇴가 완료되었습니다.' });

    } catch (error) {
        console.error('Delete user error:', error)
        return NextResponse.json({ success: false, error: '회원 탈퇴 중 오류가 발생했습니다.' }, { status: 500 });
    }
}