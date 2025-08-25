'use client';

import { useState } from 'react';
import { TrashIcon, CalendarIcon, ClockIcon, XMarkIcon, FireIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';

interface SavedDietItem {
    id: string;
    title: string;
    createdAt: string;
    weeklyDiet: WeeklyDiet[];
    isCompleteWeek: boolean;
    avgCalories: number;
    totalDays: number;
}
interface WeeklyDiet {
    id: number | string;
    day: string;
    date: string;
    mealPlan: MealPlan;
    isToday: boolean;
}
interface MealPlan {
    breakfast: string;
    lunch: string;
    dinner: string;
    snack?: string;
    totalCalories: number;
}

export default function DietPage() {
    const [selectedDiet, setSelectedDiet] = useState<SavedDietItem | null>(null);
    const queryClient = useQueryClient();
    
    const { data: dietsData, isLoading, error } = useQuery({
        queryKey: ['saved-diets'],
        queryFn: () => apiClient.getDiets({ limit: 50 }),
    });

    const deleteDietMutation = useMutation<any, Error, SavedDietItem>({
        mutationFn: async (dietToDelete: SavedDietItem) => {
            const idsToDelete = dietToDelete.weeklyDiet.map(day => day.id);
            if (idsToDelete.length === 0) {
                throw new Error('삭제할 식단 항목이 없습니다.');
            }
            return apiClient.deleteDietGroup({ ids: idsToDelete });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-diets'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            toast.success('식단 그룹이 삭제되었습니다.');
        },
        onError: (error: any) => {
            const errorMessage = error.message || '식단 삭제 중 오류가 발생했습니다.';
            toast.error(errorMessage);
        }
    });

    const savedDiets = dietsData?.data?.diets || [];

    const handleDeleteDiet = (diet: SavedDietItem, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`'${diet.title}' 식단 그룹 전체를 삭제하시겠습니까?`)) {
            deleteDietMutation.mutate(diet);
        }
    };

    const handleDietClick = (diet: SavedDietItem) => setSelectedDiet(diet);
    const handleCloseModal = () => setSelectedDiet(null);
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    const getTimeSince = (dateString: string) => {
        const diffDays = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return '오늘';
        if (diffDays === 1) return '1일 전';
        if (diffDays < 7) return `${diffDays}일 전`;
        return `${Math.floor(diffDays / 30)}개월 전`;
    };
    const getMealTypeIcon = (mealType: string) => ({ breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }[mealType] || '🍽️');
    const getMealTypeName = (mealType: string) => ({ breakfast: '아침', lunch: '점심', dinner: '저녁', snack: '간식' }[mealType] || '식사');
    const getUpcomingDietPlan = (weeklyDiet: WeeklyDiet[]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return weeklyDiet
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
                    <h1 className="text-3xl font-black text-gray-800 mb-2">저장된 식단</h1>
                    <p className="text-gray-600">나만의 맞춤 식단 모음</p>
                </header>
                <section>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                    ) : savedDiets.length === 0 ? (
                        <div className="card p-12 text-center"><p className="text-lg font-semibold">저장된 식단이 없습니다.</p><span>새로운 식단을 추가해보세요!</span></div>
                    ) : (
                        <div className="space-y-4">
                            {savedDiets.map((diet: SavedDietItem) => (
                                <div key={diet.id} className="card p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:transform hover:-translate-y-1" onClick={() => handleDietClick(diet)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">{diet.title}</h3>
                                            <div className="flex gap-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4 text-green-500" />{formatDate(diet.createdAt)}</span>
                                                <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4 text-green-500" />{getTimeSince(diet.createdAt)}</span>
                                            </div>
                                        </div>
                                        <button onClick={(e) => handleDeleteDiet(diet, e)} disabled={deleteDietMutation.isPending && deleteDietMutation.variables?.id === diet.id} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200 flex-shrink-0 ml-4 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="식단 삭제">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-gray-600 text-sm">{diet.isCompleteWeek ? '7일 완성' : `${diet.totalDays}일`} 간의 맞춤 식단 계획이 포함되어 있습니다.</p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><FireIcon className="w-3 h-3" />평균 {diet.avgCalories} kcal/일</span>
                                            {diet.isCompleteWeek && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-gray-800">완성된 주간 식단</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            {selectedDiet && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
                    <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex-shrink-0 flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800 truncate">{selectedDiet.title}</h2><button onClick={handleCloseModal} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"><XMarkIcon className="w-5 h-5 text-gray-600" /></button></div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getUpcomingDietPlan(selectedDiet.weeklyDiet).length > 0 ? getUpcomingDietPlan(selectedDiet.weeklyDiet).map((day) => (
                                    <div key={day.id} className={`card p-5 border-2 transition-all ${day.isToday ? 'border-green-500 bg-green-100 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-gray-800">{day.day}</h3>
                                            <div className="flex items-center gap-2"><span className="text-xs text-gray-600">{formatDate(day.date)}</span>{day.isToday && <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">TODAY</span>}</div>
                                        </div>
                                        <div className="space-y-3 mb-4">
                                            {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                                                const mealContent = day.mealPlan[mealType as keyof MealPlan];
                                                if (!mealContent) return null;
                                                const colors = { breakfast: 'bg-yellow-50 border-yellow-400', lunch: 'bg-orange-50 border-orange-400', dinner: 'bg-purple-50 border-purple-400', snack: 'bg-pink-50 border-pink-400' };
                                                return (<div key={mealType} className={`p-3 rounded-lg border-l-4 ${colors[mealType as keyof typeof colors]}`}><div className="flex items-center gap-2 mb-2"><span className="text-lg">{getMealTypeIcon(mealType)}</span><span className="font-semibold text-gray-800 text-sm">{getMealTypeName(mealType)}</span></div><p className="text-xs text-gray-700 leading-relaxed break-words">{mealContent.toString()}</p></div>)
                                            })}
                                        </div>
                                        <div className="flex justify-center"><span className="inline-flex items-center gap-1 px-3 py-2 bg-green-100 text-green-800 text-sm font-semibold rounded-full"><FireIcon className="w-4 h-4" />{day.mealPlan.totalCalories} kcal</span></div>
                                    </div>
                                )) : <div className="md:col-span-2 lg:col-span-3 text-center py-12"><p className="text-lg font-semibold">표시할 식단 계획이 없습니다.</p><p className="text-sm text-gray-500 mt-2">이 식단 계획은 이미 모두 지난 날짜의 계획입니다.</p></div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}