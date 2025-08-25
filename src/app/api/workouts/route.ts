import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getDayName(date: Date): string {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return days[new Date(date).getDay()];
}

function isToday(date: Date): boolean {
    const today = new Date();
    const targetDate = new Date(date);
    return targetDate.toDateString() === today.toDateString();
}

function getMostCommonType(types: string[]): string {
    if (types.length === 0) return '맞춤형 운동 계획';
    
    const typeCount = types.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(typeCount).sort(([, a], [, b]) => b - a)[0][0];
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) { return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 }); }
        
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const userId = parseInt(session.user.id);

        const allWorkouts = await prisma.savedWorkout.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });

        const groupedWorkouts: any[][] = [];
        let currentGroup: any[] = [];
        const GROUP_THRESHOLD_MS = 60 * 1000;

        for (let i = 0; i < allWorkouts.length; i++) {
            const currentWorkout = allWorkouts[i];
            if (currentGroup.length === 0) {
                currentGroup.push(currentWorkout);
            } else {
                const previousWorkout = currentGroup[currentGroup.length - 1];
                const timeDifference = new Date(previousWorkout.createdAt).getTime() - new Date(currentWorkout.createdAt).getTime();
                if (timeDifference > GROUP_THRESHOLD_MS) {
                    groupedWorkouts.push(currentGroup);
                    currentGroup = [currentWorkout];
                } else {
                    currentGroup.push(currentWorkout);
                }
            }
        }
        if (currentGroup.length > 0) {
            groupedWorkouts.push(currentGroup);
        }

        const workoutSets = groupedWorkouts.map(workoutsInGroup => {
            const workouts = [...workoutsInGroup].reverse();
            const createdDate = workouts[0].createdAt.toISOString().split('T')[0];
            const isCompleteWeek = workouts.length === 7;
            const avgCalories = Math.round(workouts.reduce((sum, workout) => sum + (workout.estimatedCalories || 0), 0) / (workouts.length || 1));
            
            let title = '';
            let foundMeta = false;

            workouts.forEach(workout => {
                if (!foundMeta && workout.targetMuscles && typeof workout.targetMuscles === 'string') {
                    try {
                        const meta = JSON.parse(workout.targetMuscles);
                        if (meta.aiTitle) {
                            title = meta.aiTitle;
                            workout.targetMuscles = JSON.stringify(meta.originalTargetMuscles || []);
                            foundMeta = true;
                        }
                    } catch (e) { /* Ignore */ }
                }
            });

            if (!foundMeta) {
                const workoutTypes = workouts.map(w => w.workoutType).filter(Boolean);
                title = getMostCommonType(workoutTypes);
            }

            return {
                id: `group_${createdDate}_${workouts[0].id}`,
                title,
                createdAt: createdDate,
                weeklyWorkout: workouts.map(workout => ({
                    id: workout.id,
                    day: getDayName(new Date(workout.date)),
                    date: new Date(workout.date).toISOString().split('T')[0],
                    workoutPlan: {
                        type: workout.workoutType,
                        duration: workout.duration,
                        intensity: workout.intensity,
                        targetMuscles: workout.targetMuscles ? JSON.parse(workout.targetMuscles) : [],
                        exercises: workout.exercises ? JSON.parse(workout.exercises) : [],
                        estimatedCalories: workout.estimatedCalories
                    },
                    isToday: isToday(new Date(workout.date))
                })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
                isCompleteWeek,
                avgCalories,
                totalDays: workouts.length
            };
        });

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedWorkoutSets = workoutSets.slice(startIndex, endIndex);

        return NextResponse.json({ success: true, data: { workouts: paginatedWorkoutSets, pagination: { page, limit, total: workoutSets.length, pages: Math.ceil(workoutSets.length / limit) } } });
    } catch (error) {
        console.error('Get workouts error:', error);
        return NextResponse.json({ success: false, error: '운동 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) { return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 }); }
        
        const body = await request.json();
        const { date, workoutType, duration, intensity, targetMuscles, exercises, estimatedCalories } = body;
        if (!date) { return NextResponse.json({ success: false, error: '날짜를 입력해주세요.' }, { status: 400 }); }
        
        const userId = parseInt(session.user.id);
        const existingWorkout = await prisma.savedWorkout.findFirst({ where: { userId, date: new Date(date) } });
        if (existingWorkout) { return NextResponse.json({ success: false, error: '해당 날짜에 이미 운동이 저장되어 있습니다.' }, { status: 409 }); }
        
        const workout = await prisma.savedWorkout.create({
            data: { userId, date: new Date(date), workoutType, duration, intensity, targetMuscles: targetMuscles ? JSON.stringify(targetMuscles) : null, exercises: exercises ? JSON.stringify(exercises) : null, estimatedCalories }
        });

        const parsedWorkout = { ...workout, targetMuscles: workout.targetMuscles ? JSON.parse(workout.targetMuscles) : [], exercises: workout.exercises ? JSON.parse(workout.exercises) : [] };
        return NextResponse.json({ success: true, message: '운동이 성공적으로 저장되었습니다.', data: parsedWorkout });
    } catch (error) {
        console.error('Create workout error:', error);
        return NextResponse.json({ success: false, error: '운동 저장 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) { return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 }); }
        
        const body = await request.json();
        const { ids } = body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) { return NextResponse.json({ success: false, error: '삭제할 ID가 없습니다.' }, { status: 400 }); }
        
        const userId = parseInt(session.user.id);
        const result = await prisma.savedWorkout.deleteMany({
            where: {
                id: { in: ids.map(id => Number(id)) },
                userId: userId,
            },
        });

        if (result.count === 0) { return NextResponse.json({ success: false, error: '삭제할 운동을 찾을 수 없거나 권한이 없습니다.' }, { status: 404 }); }
        
        return NextResponse.json({ success: true, message: '운동 그룹이 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('Delete workout group error:', error);
        return NextResponse.json({ success: false, error: '운동 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }
}