import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getDayName(date: Date): string {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    return days[new Date(date).getDay()]
}

function isToday(date: Date): boolean {
    const today = new Date()
    const targetDate = new Date(date)
    return targetDate.toDateString() === today.toDateString()
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) { return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 }); }
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const userId = parseInt(session.user.id)

        const allDiets = await prisma.savedDiet.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })

        const groupedDiets: any[][] = []
        let currentGroup: any[] = []
        const GROUP_THRESHOLD_MS = 60 * 1000 

        for (let i = 0; i < allDiets.length; i++) {
            const currentDiet = allDiets[i]
            if (currentGroup.length === 0) {
                currentGroup.push(currentDiet)
            } else {
                const previousDiet = currentGroup[currentGroup.length - 1]
                const timeDifference = new Date(previousDiet.createdAt).getTime() - new Date(currentDiet.createdAt).getTime()
                if (timeDifference > GROUP_THRESHOLD_MS) {
                    groupedDiets.push(currentGroup)
                    currentGroup = [currentDiet]
                } else {
                    currentGroup.push(currentDiet)
                }
            }
        }
        if (currentGroup.length > 0) {
            groupedDiets.push(currentGroup)
        }

        const dietSets = groupedDiets.map(dietsInGroup => {
            const diets = [...dietsInGroup].reverse()
            const createdDate = diets[0].createdAt.toISOString().split('T')[0]
            const isCompleteWeek = diets.length === 7
            const avgCalories = Math.round(diets.reduce((sum, diet) => sum + (diet.totalCalories || 0), 0) / (diets.length || 1))
            
            let title = ''
            let foundMeta = false
            diets.forEach(diet => {
                if (!foundMeta && diet.snack && typeof diet.snack === 'string') {
                    try {
                        const snackMeta = JSON.parse(diet.snack);
                        if (snackMeta.aiTitle) {
                            title = snackMeta.aiTitle;
                            diet.snack = snackMeta.originalSnack || null;
                            foundMeta = true;
                        }
                    } catch (e) { /* Ignore */ }
                }
            });
            if (!foundMeta) {
                title = avgCalories < 1400 ? '저칼로리 다이어트 식단' : avgCalories > 2000 ? '고칼로리 벌크업 식단' : '균형잡힌 건강 식단';
            }
            return {
                id: `group_${createdDate}_${diets[0].id}`,
                title,
                createdAt: createdDate,
                weeklyDiet: diets.map(diet => ({
                    id: diet.id,
                    day: getDayName(new Date(diet.date)),
                    date: new Date(diet.date).toISOString().split('T')[0],
                    mealPlan: { breakfast: diet.breakfast, lunch: diet.lunch, dinner: diet.dinner, snack: diet.snack, totalCalories: diet.totalCalories },
                    isToday: isToday(new Date(diet.date))
                })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
                isCompleteWeek,
                avgCalories,
                totalDays: diets.length
            }
        })

        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedDietSets = dietSets.slice(startIndex, endIndex)

        return NextResponse.json({ success: true, data: { diets: paginatedDietSets, pagination: { page, limit, total: dietSets.length, pages: Math.ceil(dietSets.length / limit) } } })
    } catch (error) {
        console.error('Get diets error:', error)
        return NextResponse.json({ success: false, error: '식단 목록 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) { return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 }) }
        const body = await request.json()
        const { date, breakfast, lunch, dinner, snack, totalCalories } = body
        if (!date) { return NextResponse.json({ success: false, error: '날짜를 입력해주세요.' }, { status: 400 }) }
        const userId = parseInt(session.user.id)
        const existingDiet = await prisma.savedDiet.findFirst({ where: { userId, date: new Date(date) } })
        if (existingDiet) { return NextResponse.json({ success: false, error: '해당 날짜에 이미 식단이 저장되어 있습니다.' }, { status: 409 }) }
        const diet = await prisma.savedDiet.create({ data: { userId, date: new Date(date), breakfast, lunch, dinner, snack, totalCalories } })
        return NextResponse.json({ success: true, message: '식단이 성공적으로 저장되었습니다.', data: diet })
    } catch (error) {
        console.error('Create diet error:', error)
        return NextResponse.json({ success: false, error: '식단 저장 중 오류가 발생했습니다.' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
        }
        const body = await request.json();
        const { ids } = body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ success: false, error: '삭제할 ID가 없습니다.' }, { status: 400 });
        }
        const userId = parseInt(session.user.id);
        const result = await prisma.savedDiet.deleteMany({
            where: {
                id: { in: ids.map(id => Number(id)) },
                userId: userId,
            },
        });
        if (result.count === 0) {
            return NextResponse.json({ success: false, error: '삭제할 식단을 찾을 수 없거나 권한이 없습니다.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: '식단 그룹이 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('Delete diet group error:', error);
        return NextResponse.json({ success: false, error: '식단 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }
}