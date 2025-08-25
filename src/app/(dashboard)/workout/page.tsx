'use client';

import { useState } from 'react';
import { TrashIcon, CalendarIcon, ClockIcon, XMarkIcon, FireIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';

// 저장된 운동 항목 타입
interface SavedWorkoutItem {
    id: string;
    title: string;
    createdAt: string;
    weeklyWorkout: WeeklyWorkout[];
    isCompleteWeek: boolean;
    avgCalories: number;
    totalDays: number;
}

interface Exercise {
    name: string;
    sets?: number;
    reps?: string;
    duration?: string;
    rest?: string;
    description?: string;
}

interface WorkoutPlan {
    type: string;
    duration: string;
    intensity: 'low' | 'medium' | 'high';
    targetMuscles: string[];
    exercises: Exercise[];
    estimatedCalories: number;
}

interface WeeklyWorkout {
    id: number | string;
    day: string;
    date: string;
    workoutPlan: WorkoutPlan;
    isToday: boolean;
}

export default function WorkoutPage() {
    const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkoutItem | null>(null);
    const queryClient = useQueryClient();
    
    const { data: workoutsData, isLoading, error } = useQuery({
        queryKey: ['saved-workouts'],
        queryFn: () => apiClient.getWorkouts({ limit: 50 }),
    });

    const deleteWorkoutMutation = useMutation<any, Error, SavedWorkoutItem>({
        mutationFn: async (workoutToDelete: SavedWorkoutItem) => {
            const idsToDelete = workoutToDelete.weeklyWorkout.map(day => day.id);
            if (idsToDelete.length === 0) {
                throw new Error('삭제할 운동 항목이 없습니다.');
            }
            return apiClient.deleteWorkoutGroup({ ids: idsToDelete });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-workouts'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            toast.success('운동 그룹이 삭제되었습니다.');
        },
        onError: (error: any) => {
            const errorMessage = error.message || '운동 삭제 중 오류가 발생했습니다.';
            toast.error(errorMessage);
        }
    });

    const savedWorkouts = workoutsData?.data?.workouts || [];

    const handleDeleteWorkout = (workout: SavedWorkoutItem, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`'${workout.title}' 운동 그룹 전체를 삭제하시겠습니까?`)) {
            deleteWorkoutMutation.mutate(workout);
        }
    };

    const handleWorkoutClick = (workout: SavedWorkoutItem) => setSelectedWorkout(workout);
    const handleCloseModal = () => setSelectedWorkout(null);
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    const getTimeSince = (dateString: string) => {
        const diffDays = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return '오늘';
        if (diffDays === 1) return '1일 전';
        if (diffDays < 7) return `${diffDays}일 전`;
        return `${Math.floor(diffDays / 30)}개월 전`;
    };
    const getIntensityColor = (intensity: string) => ({ low: 'bg-green-100 text-green-800', medium: 'bg-yellow-100 text-yellow-800', high: 'bg-red-100 text-red-800' }[intensity] || 'bg-gray-100 text-gray-800');
    const getIntensityText = (intensity: string) => ({ low: '저강도', medium: '중강도', high: '고강도' }[intensity] || '보통');
    const getUpcomingWorkoutPlan = (weeklyWorkout: WeeklyWorkout[]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return weeklyWorkout
            .filter(day => new Date(day.date) >= today)
            .sort((a, b) => {
                if (a.isToday) return -1;
                if (b.isToday) return 1;
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            });
    };

    if (error) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5"><div className="text-center"><h2 className="text-xl font-bold">오류 발생</h2><p>데이터를 불러올 수 없습니다.</p></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="max-w-2xl mx-auto px-5 pt-20">
                <header className="text-left mb-6">
                    <h1 className="text-3xl font-black text-gray-800 mb-2">저장된 운동</h1>
                    <p className="text-gray-600">나만의 맞춤 운동 모음</p>
                </header>
                <section>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                    ) : savedWorkouts.length === 0 ? (
                        <div className="card p-12 text-center"><p className="text-lg font-semibold">저장된 운동이 없습니다.</p><span>새로운 운동을 추가해보세요!</span></div>
                    ) : (
                        <div className="space-y-4">
                            {savedWorkouts.map((workout: SavedWorkoutItem) => (
                                <div key={workout.id} className="card p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:transform hover:-translate-y-1" onClick={() => handleWorkoutClick(workout)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">{workout.title}</h3>
                                            <div className="flex gap-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4 text-orange-500" />{formatDate(workout.createdAt)}</span>
                                                <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4 text-orange-500" />{getTimeSince(workout.createdAt)}</span>
                                            </div>
                                        </div>
                                        <button onClick={(e) => handleDeleteWorkout(workout, e)} disabled={deleteWorkoutMutation.isPending && deleteWorkoutMutation.variables?.id === workout.id} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200 flex-shrink-0 ml-4 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="운동 삭제">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-gray-600 text-sm">{workout.isCompleteWeek ? '7일 완성' : `${workout.totalDays}일`} 간의 맞춤 운동 계획이 포함되어 있습니다.</p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><FireIcon className="w-3 h-3" />평균 {workout.avgCalories} kcal/일</span>
                                            {workout.isCompleteWeek && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-gray-800">완성된 주간 운동</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            {selectedWorkout && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
                    <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex-shrink-0 flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800 truncate">{selectedWorkout.title}</h2><button onClick={handleCloseModal} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"><XMarkIcon className="w-5 h-5 text-gray-600" /></button></div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getUpcomingWorkoutPlan(selectedWorkout.weeklyWorkout).length > 0 ? getUpcomingWorkoutPlan(selectedWorkout.weeklyWorkout).map((day) => (
                                    <div key={day.id} className={`card p-5 border-2 transition-all ${day.isToday ? 'border-orange-400 bg-orange-100 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-gray-800">{day.day}</h3>
                                            <div className="flex items-center gap-2"><span className="text-xs text-gray-600">{formatDate(day.date)}</span>{day.isToday && <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">TODAY</span>}</div>
                                        </div>
                                        <div className="space-y-3 mb-4">
                                            <h4 className="font-semibold text-gray-800 break-words">{day.workoutPlan.type}</h4>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md"><ClockIcon className="w-3 h-3" />{day.workoutPlan.duration}</span>
                                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${getIntensityColor(day.workoutPlan.intensity)}`}>{getIntensityText(day.workoutPlan.intensity)}</span>
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-md"><FireIcon className="w-3 h-3" />{day.workoutPlan.estimatedCalories} kcal</span>
                                            </div>
                                            {day.workoutPlan.targetMuscles.length > 0 && (<div><p className="text-xs font-medium text-gray-600 mb-1">타겟 근육:</p><div className="flex flex-wrap gap-1">{day.workoutPlan.targetMuscles.map((muscle, index) => (<span key={index} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-md">{muscle}</span>))}</div></div>)}
                                        </div>
                                        <div className="space-y-2">
                                            {day.workoutPlan.exercises.map((exercise, index) => (<div key={index} className="p-3 bg-gray-50 rounded-lg border-l-4 border-orange-400"><div className="flex justify-between items-start mb-1"><span className="font-medium text-gray-800 text-sm break-words">{exercise.name}</span></div><div className="flex flex-wrap gap-2 text-xs text-gray-600">{exercise.sets && exercise.reps && <span className="bg-white px-2 py-1 rounded">{exercise.sets}세트 × {exercise.reps}</span>}{exercise.duration && <span className="bg-white px-2 py-1 rounded">{exercise.duration}</span>}{exercise.rest && <span className="bg-red-50 text-red-600 px-2 py-1 rounded">휴식: {exercise.rest}</span>}</div>{exercise.description && <p className="text-xs text-gray-600 mt-1 leading-relaxed break-words">{exercise.description}</p>}</div>))}
                                        </div>
                                    </div>
                                )) : <div className="md:col-span-2 lg:col-span-3 text-center py-12"><p className="text-lg font-semibold">표시할 운동 계획이 없습니다.</p><p className="text-sm text-gray-500 mt-2">이 운동 계획은 이미 모두 지난 날짜의 계획입니다.</p></div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}