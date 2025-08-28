import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
// date-fns를 사용하지 않고 네이티브 Date 객체로 처리

// 데이터베이스 작업을 재시도하는 헬퍼 함수
async function retryDatabaseOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            console.warn(`Database operation failed (attempt ${i + 1}/${maxRetries}):`, error);
            
            // prepared statement 오류인 경우 잠시 대기 후 재시도
            if (error instanceof Error && error.message.includes('prepared statement')) {
                await new Promise(resolve => setTimeout(resolve, 100 * (i + 1))); // 점진적 대기
                continue;
            }
            
            // 다른 종류의 오류는 즉시 던지기
            throw error;
        }
    }
    
    throw lastError;
}

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

        // 병렬로 데이터 조회하여 성능 향상 (재시도 로직 포함)
        const [allDiets, allWorkouts] = await Promise.all([
            retryDatabaseOperation(() => 
                prisma.savedDiet.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                })
            ).catch(err => {
                console.error('Error fetching diets:', err);
                return []; // 실패 시 빈 배열 반환
            }),
            retryDatabaseOperation(() =>
                prisma.savedWorkout.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                })
            ).catch(err => {
                console.error('Error fetching workouts:', err);
                return []; // 실패 시 빈 배열 반환
            })
        ]);

        const dietGroups = groupRecordsByTime(allDiets, GROUP_THRESHOLD_MS);
        const totalDiets = dietGroups.length;
        
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

        // 이번 주/월 데이터도 병렬로 조회 (재시도 로직 포함)
        const [thisWeekWorkouts, thisMonthCaloriesData] = await Promise.all([
            retryDatabaseOperation(() =>
                prisma.savedWorkout.count({
                    where: { userId, date: { gte: weekStart, lte: weekEnd } }
                })
            ).catch(err => {
                console.error('Error fetching week workouts:', err);
                return 0;
            }),
            retryDatabaseOperation(() =>
                prisma.savedWorkout.aggregate({
                    _sum: { estimatedCalories: true },
                    where: { userId, date: { gte: monthStart, lte: monthEnd } }
                })
            ).catch(err => {
                console.error('Error fetching month calories:', err);
                return { _sum: { estimatedCalories: 0 } };
            })
        ]);
        
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