import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
// date-fns를 사용하지 않고 네이티브 Date 객체로 처리

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const groupRecordsByTime = (records: { createdAt: Date }[], thresholdMs: number): any[][] => {
            if (records.length === 0) return [];
            
            const groups: any[][] = [];
            let currentGroup: { createdAt: Date }[] = [records[0]];

            for (let i = 1; i < records.length; i++) {
                const previousRecord = records[i-1];
                const currentRecord = records[i];
                const timeDifference = previousRecord.createdAt.getTime() - currentRecord.createdAt.getTime();

                if (timeDifference > thresholdMs) {
                    groups.push(currentGroup);
                    currentGroup = [currentRecord];
                } else {
                    currentGroup.push(currentRecord);
                }
            }
            groups.push(currentGroup);
            return groups;
        };
        const GROUP_THRESHOLD_MS = 60 * 1000;

        const allDiets = await prisma.savedDiet.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });
        const dietGroups = groupRecordsByTime(allDiets, GROUP_THRESHOLD_MS);
        const totalDiets = dietGroups.length;

        const allWorkouts = await prisma.savedWorkout.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });
        const workoutGroups = groupRecordsByTime(allWorkouts, GROUP_THRESHOLD_MS);
        const totalWorkouts = workoutGroups.length;
        
        const now = new Date();
        
        // 이번 주 시작 (월요일)
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + daysToMonday);
        weekStart.setHours(0, 0, 0, 0);
        
        // 이번 주 끝 (일요일)  
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        // 이번 달 시작
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        
        // 이번 달 끝
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const thisWeekWorkouts = await prisma.savedWorkout.count({
            where: { userId, date: { gte: weekStart, lte: weekEnd } }
        });

        const thisMonthCaloriesData = await prisma.savedWorkout.aggregate({
            _sum: { estimatedCalories: true },
            where: { userId, date: { gte: monthStart, lte: monthEnd } }
        });
        const thisMonthCalories = thisMonthCaloriesData._sum.estimatedCalories || 0;

        const overview = {
            totalDiets,
            totalWorkouts,
            thisWeekWorkouts,
            thisMonthCalories,
        };

        return NextResponse.json({
            success: true,
            data: { overview }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        return NextResponse.json(
            { success: false, error: '대시보드 데이터 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}