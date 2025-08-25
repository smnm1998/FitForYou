import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: '인증이 필요합니다.' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || 'weekly' // weekly, monthly, yearly
        const type = searchParams.get('type') || 'all' // diet, workout, all

        const userId = parseInt(session.user.id)
        
        let startDate: Date
        let groupFormat: string
        
        switch (period) {
            case 'monthly':
                startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1) // 최근 12개월
                groupFormat = 'YYYY-MM'
                break
            case 'yearly':
                startDate = new Date(new Date().getFullYear() - 2, 0, 1) // 최근 3년
                groupFormat = 'YYYY'
                break
            default: // weekly
                startDate = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000) // 최근 12주
                groupFormat = 'YYYY-WW'
        }

        const reports = await generateReports(userId, startDate, period, type)

        return NextResponse.json({
            success: true,
            data: {
                period,
                type,
                reports
            }
        })

    } catch (error) {
        console.error('Reports error:', error)
        return NextResponse.json(
            { success: false, error: '리포트 생성 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}

async function generateReports(userId: number, startDate: Date, period: string, type: string) {
    // 기간별 데이터 집계 로직
    // 실제 구현에서는 더 복잡한 집계 쿼리 필요
    
    if (type === 'diet' || type === 'all') {
        const dietReports = await prisma.savedDiet.findMany({
            where: {
                userId,
                date: { gte: startDate }
            },
            select: {
                date: true,
                totalCalories: true,
                createdAt: true
            }
        })
        
        return { dietReports }
    }
    
    if (type === 'workout' || type === 'all') {
        const workoutReports = await prisma.savedWorkout.findMany({
            where: {
                userId,
                date: { gte: startDate }
            },
            select: {
                date: true,
                duration: true,
                estimatedCalories: true,
                intensity: true,
                createdAt: true
            }
        })
        
        return { workoutReports }
    }
    
    return {}
}