"use client";

import { useState, useEffect } from "react";
import {
    TrashIcon,
    ClockIcon,
    XMarkIcon,
    FireIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api-client";

// 저장된 운동 항목 타입
interface SavedWorkoutItem {
    id: string;
    title: string;
    description: string;
    advice?: {
        tips: string[];
        warnings: string[];
        summary: string;
    };
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
    intensity: "low" | "medium" | "high";
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
    const [selectedWorkout, setSelectedWorkout] =
        useState<SavedWorkoutItem | null>(null);
    const queryClient = useQueryClient();
    const [hasAutoOpened, setHasAutoOpened] = useState(false);

    const {
        data: workoutsData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["saved-workouts"],
        queryFn: async () => {
            const response = await apiClient.getWorkouts({ limit: 50 });
            return response.data as { workouts: SavedWorkoutItem[] }; // 타입 캐스팅 추가
        },
    });

    const deleteWorkoutMutation = useMutation<unknown, Error, SavedWorkoutItem>(
        {
            mutationFn: async (workoutToDelete: SavedWorkoutItem) => {
                const idsToDelete = workoutToDelete.weeklyWorkout.map(
                    (day) => day.id
                );
                if (idsToDelete.length === 0) {
                    throw new Error("삭제할 운동 항목이 없습니다.");
                }
                return apiClient.deleteWorkoutGroup({ ids: idsToDelete });
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["saved-workouts"] });
                queryClient.invalidateQueries({
                    queryKey: ["dashboard-stats"],
                });
                toast.success("운동 그룹이 삭제되었습니다.");
            },
            onError: (error: unknown) => {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "운동 삭제 중 오류가 발생했습니다.";
                toast.error(errorMessage);
            },
        }
    );

    const savedWorkouts = workoutsData?.workouts || [];

    // 로딩 페이지에서 리다이렉션된 경우에만 자동으로 모달 열기
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const openId = params.get("openId"); // ✅ openId로 변경

        if (
            !isLoading &&
            savedWorkouts.length > 0 &&
            !hasAutoOpened &&
            openId
        ) {
            // ✅ ID로 정확한 운동 찾기
            const targetWorkout = savedWorkouts.find(
                (workout) => workout.id.toString() === openId
            );

            if (targetWorkout) {
                setSelectedWorkout(targetWorkout);
                setHasAutoOpened(true);
                document.body.style.overflow = "hidden";

                // URL에서 파라미터 제거
                window.history.replaceState({}, "", window.location.pathname);
            } else {
                console.warn(`운동 ID ${openId}를 찾을 수 없습니다.`);
            }
        }
    }, [isLoading, savedWorkouts, hasAutoOpened]);

    // 컴포넌트 언마운트 시 body 스크롤 복원
    useEffect(() => {
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const handleDeleteWorkout = (
        workout: SavedWorkoutItem,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();
        if (confirm(`'${workout.title}' 운동 그룹 전체를 삭제하시겠습니까?`)) {
            deleteWorkoutMutation.mutate(workout);
        }
    };

    const handleWorkoutClick = (workout: SavedWorkoutItem) => {
        setSelectedWorkout(workout);
        // 모달 열릴 때 body 스크롤 방지
        document.body.style.overflow = "hidden";
    };

    const handleCloseModal = () => {
        setSelectedWorkout(null);
        // 모달 닫힐 때 body 스크롤 복원
        document.body.style.overflow = "unset";
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
        });
    const getTimeSince = (dateString: string) => {
        const diffDays = Math.floor(
            (new Date().getTime() - new Date(dateString).getTime()) /
                (1000 * 60 * 60 * 24)
        );
        if (diffDays === 0) return "오늘";
        if (diffDays === 1) return "1일 전";
        if (diffDays < 7) return `${diffDays}일 전`;
        return `${Math.floor(diffDays / 30)}개월 전`;
    };
    const getIntensityColor = (intensity: string) =>
        ({
            low: "bg-green-100 text-green-800",
            medium: "bg-yellow-100 text-yellow-800",
            high: "bg-red-100 text-red-800",
        }[intensity] || "bg-gray-100 text-gray-800");
    const getIntensityText = (intensity: string) =>
        ({ low: "저강도", medium: "중강도", high: "고강도" }[intensity] ||
        "보통");
    const getUpcomingWorkoutPlan = (weeklyWorkout: WeeklyWorkout[]) => {
        // 중복된 날짜 제거를 위한 Map 사용
        const uniqueWorkouts = new Map<string, WeeklyWorkout>();

        weeklyWorkout.forEach((day) => {
            const dateKey = day.date;
            if (!uniqueWorkouts.has(dateKey)) {
                uniqueWorkouts.set(dateKey, day);
            }
        });

        return Array.from(uniqueWorkouts.values()).sort((a, b) => {
            if (a.isToday) return -1;
            if (b.isToday) return 1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
                <div className="text-center">
                    <h2 className="text-xl font-bold">오류 발생</h2>
                    <p>데이터를 불러올 수 없습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="max-w-2xl mx-auto px-5 pt-20">
                <header className="text-left mb-6">
                    <h1 className="text-3xl font-black text-gray-800 mb-2">
                        저장된 운동
                    </h1>
                    <p className="text-gray-600">나만의 맞춤 운동 모음</p>
                </header>
                <section>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : savedWorkouts.length === 0 ? (
                        <div className="card p-12 text-center">
                            <p className="text-lg font-semibold">
                                저장된 운동이 없습니다.
                            </p>
                            <span>새로운 운동을 추가해보세요!</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {savedWorkouts.map((workout: SavedWorkoutItem) => (
                                <div
                                    key={workout.id}
                                    className="card p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:transform hover:-translate-y-1"
                                    onClick={() => handleWorkoutClick(workout)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                                                <span className="text-xl">
                                                    💪
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">
                                                    {workout.title}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <ClockIcon className="w-3 h-3 text-orange-500" />
                                                        {getTimeSince(
                                                            workout.createdAt
                                                        )}
                                                    </span>
                                                    <span className="text-gray-400">
                                                        •
                                                    </span>
                                                    <span>
                                                        {formatDate(
                                                            workout.createdAt
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) =>
                                                handleDeleteWorkout(workout, e)
                                            }
                                            disabled={
                                                deleteWorkoutMutation.isPending &&
                                                deleteWorkoutMutation.variables
                                                    ?.id === workout.id
                                            }
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200 flex-shrink-0 ml-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="운동 삭제"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-gray-600 text-sm">
                                            {workout.isCompleteWeek
                                                ? "7일 완성"
                                                : `${workout.totalDays}일`}{" "}
                                            간의 맞춤 운동 계획이 포함되어
                                            있습니다.
                                        </p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                <FireIcon className="w-3 h-3" />
                                                평균 {workout.avgCalories}{" "}
                                                kcal/일
                                            </span>
                                            {workout.isCompleteWeek && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-gray-800">
                                                    완성된 주간 운동
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            {selectedWorkout && (
                <div
                    key={selectedWorkout.id}
                    className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4"
                >
                    <div className="bg-white rounded-3xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-500 ease-out border border-gray-200/50 overflow-hidden">
                        <div className="flex-shrink-0 flex justify-between items-center p-4 sm:p-6 border-b border-gray-200/60 bg-gradient-to-r from-orange-50/80 to-amber-50/80 backdrop-blur-sm">
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                                    <span className="text-lg sm:text-xl">
                                        🏋️
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
                                        {selectedWorkout.title}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium truncate">
                                        {selectedWorkout.totalDays}일 맞춤 운동
                                        계획
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="w-8 h-8 sm:w-10 sm:h-10 bg-white/90 hover:bg-white rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 group flex-shrink-0 ml-2"
                            >
                                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-gray-800 transition-colors" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gray-50/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 조언 섹션 - 조언이 있고 유효한 데이터를 가진 경우에만 표시 */}
                                {selectedWorkout.advice &&
                                    selectedWorkout.advice.summary && (
                                        <div className="md:col-span-2 rounded-3xl p-6 bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                                                    <span className="text-white text-lg">
                                                        💪
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">
                                                        AI 운동 조언
                                                    </h3>
                                                    <p className="text-xs text-gray-500">
                                                        개인 맞춤 트레이닝
                                                        가이드
                                                    </p>
                                                </div>
                                            </div>

                                            {/* 전체 요약 */}
                                            <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border-l-4 border-orange-500">
                                                <div className="flex items-start gap-2 mb-2">
                                                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <span className="text-white text-xs">
                                                            📋
                                                        </span>
                                                    </div>
                                                    <h4 className="font-semibold text-orange-900 text-sm">
                                                        핵심 요약
                                                    </h4>
                                                </div>
                                                <p className="text-sm text-orange-800 leading-relaxed ml-8">
                                                    {
                                                        selectedWorkout.advice
                                                            .summary
                                                    }
                                                </p>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                {/* 팁들 */}
                                                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                                            <span className="text-white text-xs">
                                                                ✨
                                                            </span>
                                                        </div>
                                                        <h4 className="font-semibold text-emerald-900 text-sm">
                                                            운동 팁
                                                        </h4>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        {selectedWorkout.advice.tips.map(
                                                            (tip, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex items-start gap-2.5"
                                                                >
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                                                                    <p className="text-sm text-emerald-800 leading-relaxed">
                                                                        {tip}
                                                                    </p>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 주의사항 */}
                                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                                                            <span className="text-white text-xs">
                                                                ⚠️
                                                            </span>
                                                        </div>
                                                        <h4 className="font-semibold text-amber-900 text-sm">
                                                            주의사항
                                                        </h4>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        {selectedWorkout.advice.warnings.map(
                                                            (
                                                                warning,
                                                                index
                                                            ) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex items-start gap-2.5"
                                                                >
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0"></div>
                                                                    <p className="text-sm text-amber-800 leading-relaxed">
                                                                        {
                                                                            warning
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                {(() => {
                                    const upcomingWorkouts =
                                        getUpcomingWorkoutPlan(
                                            selectedWorkout.weeklyWorkout
                                        );

                                    if (upcomingWorkouts.length === 0) {
                                        return (
                                            <div className="md:col-span-2 text-center py-12">
                                                <p className="text-lg font-semibold">
                                                    표시할 운동 계획이 없습니다.
                                                </p>
                                                <p className="text-sm text-gray-500 mt-2">
                                                    이 운동 계획은 이미 모두
                                                    지난 날짜의 계획입니다.
                                                </p>
                                            </div>
                                        );
                                    }

                                    return upcomingWorkouts.map((day) => (
                                        <div
                                            key={day.id}
                                            className={`rounded-2xl p-5 border-2 transition-all duration-300 hover:shadow-lg ${
                                                day.isToday
                                                    ? "border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg ring-2 ring-orange-200"
                                                    : "border-gray-200 hover:border-orange-300 bg-white hover:shadow-md"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-bold text-gray-800">
                                                    {day.day}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-600">
                                                        {formatDate(day.date)}
                                                    </span>
                                                    {day.isToday && (
                                                        <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full shadow-md">
                                                            오늘
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-3 mb-4">
                                                <h4 className="font-semibold text-gray-800 break-words">
                                                    {day.workoutPlan.type}
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {
                                                            day.workoutPlan
                                                                .duration
                                                        }
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${getIntensityColor(
                                                            day.workoutPlan
                                                                .intensity
                                                        )}`}
                                                    >
                                                        {getIntensityText(
                                                            day.workoutPlan
                                                                .intensity
                                                        )}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-md">
                                                        <FireIcon className="w-3 h-3" />
                                                        {
                                                            day.workoutPlan
                                                                .estimatedCalories
                                                        }{" "}
                                                        kcal
                                                    </span>
                                                </div>
                                                {day.workoutPlan.targetMuscles
                                                    .length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-600 mb-1">
                                                            타겟 근육:
                                                        </p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {day.workoutPlan.targetMuscles.map(
                                                                (
                                                                    muscle,
                                                                    index
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-md"
                                                                    >
                                                                        {muscle}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {Array.isArray(day.workoutPlan.exercises) && day.workoutPlan.exercises.map(
                                                    (exercise, index) => (
                                                        <div
                                                            key={index}
                                                            className="p-4 bg-gray-50 rounded-xl border-l-4 border-orange-400 transition-all hover:shadow-sm"
                                                        >
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="font-medium text-gray-800 text-sm break-words">
                                                                    {
                                                                        exercise.name
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                                                {exercise.sets &&
                                                                    exercise.reps && (
                                                                        <span className="bg-white px-2 py-1 rounded">
                                                                            {
                                                                                exercise.sets
                                                                            }
                                                                            세트
                                                                            ×{" "}
                                                                            {
                                                                                exercise.reps
                                                                            }
                                                                        </span>
                                                                    )}
                                                                {exercise.duration && (
                                                                    <span className="bg-white px-2 py-1 rounded">
                                                                        {
                                                                            exercise.duration
                                                                        }
                                                                    </span>
                                                                )}
                                                                {exercise.rest && (
                                                                    <span className="bg-red-50 text-red-600 px-2 py-1 rounded">
                                                                        휴식:{" "}
                                                                        {
                                                                            exercise.rest
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {exercise.description && (
                                                                <p className="text-xs text-gray-600 mt-1 leading-relaxed break-words">
                                                                    {
                                                                        exercise.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
