"use client";

import { useState } from "react";
import {
    CalendarIcon,
    HomeIcon,
    BoltIcon,
    FireIcon,
    ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import { CollectionSkeleton } from "@/app/components/ui/SkeletonUI";

interface DashboardStats {
    overview: {
        totalDiets: number;
        totalWorkouts: number;
        thisWeekWorkouts: number;
        thisMonthCalories: number;
    };
}

interface SavedDietItem {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    avgCalories: number;
    totalDays: number;
}

interface SavedWorkoutItem {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    avgCalories: number;
    totalDays: number;
}

export default function CollectionContent() {
    const [currentDate] = useState(
        new Date().toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
            weekday: "long",
        })
    );

    // 대시보드 통계 데이터 조회
    const {
        data: dashboardData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            const response = await apiClient.getDashboardStats();
            return response.data as DashboardStats;
        },
        staleTime: 5 * 60 * 1000, // 5분간 캐시
        retry: 2,
    });

    // 최근 저장된 식단 데이터 조회 (최대 1개)
    const {
        data: recentDiets,
        isLoading: isDietsLoading,
    } = useQuery({
        queryKey: ["recent-diets"],
        queryFn: async () => {
            const response = await fetch("/api/diets?limit=1");
            const result = await response.json();
            return result.success ? result.data.diets : [];
        },
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    // 최근 저장된 운동 데이터 조회 (최대 1개)
    const {
        data: recentWorkouts,
        isLoading: isWorkoutsLoading,
    } = useQuery({
        queryKey: ["recent-workouts"],
        queryFn: async () => {
            const response = await fetch("/api/workouts?limit=1");
            const result = await response.json();
            return result.success ? result.data.workouts : [];
        },
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    // 로딩 중일 때 스켈레톤 UI 표시
    if (isLoading) {
        return <CollectionSkeleton />;
    }

    // 에러 처리
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        데이터를 불러올 수 없습니다
                    </h2>
                    <p className="text-gray-600 mb-4">
                        네트워크 연결을 확인해주세요
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    const stats = dashboardData?.overview || {
        totalDiets: 0,
        totalWorkouts: 0,
        thisWeekWorkouts: 0,
        thisMonthCalories: 0,
    };

    return (
        <div className="min-h-screen bg-gray-50 p-5">
            <div className="max-w-2xl mx-auto">
                {/* 헤더 */}
                <header className="flex justify-between items-center mb-6 pt-5">
                    <h1 className="text-3xl font-black text-gray-800">
                        모아보기
                    </h1>
                    <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {currentDate}
                        </span>
                    </div>
                </header>

                {/* 주요 통계 */}
                <section className="mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            href="/diet"
                            className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:transform hover:-translate-y-1 block"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <HomeIcon className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-600 font-medium">
                                        저장된 식단
                                    </p>
                                    <h3 className="text-2xl font-bold text-gray-800 truncate">
                                        {stats.totalDiets}
                                    </h3>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/workout"
                            className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:transform hover:-translate-y-1 block"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <BoltIcon className="w-6 h-6 text-orange-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-600 font-medium">
                                        저장된 운동
                                    </p>
                                    <h3 className="text-2xl font-bold text-gray-800 truncate">
                                        {stats.totalWorkouts}
                                    </h3>
                                </div>
                            </div>
                        </Link>

                        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <CalendarIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-600 font-medium">
                                        이번 주 활동
                                    </p>
                                    <h3 className="text-2xl font-bold text-gray-800 truncate">
                                        {stats.thisWeekWorkouts}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FireIcon className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-600 font-medium">
                                        월간 소모칼로리
                                    </p>
                                    <h3 className="text-2xl font-bold text-gray-800 truncate">
                                        {stats.thisMonthCalories}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 오늘의 추천 */}
                <section className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        오늘의 추천
                    </h2>
                    <div className="space-y-4">
                        {/* 식단 추천 */}
                        {!isDietsLoading && recentDiets && recentDiets.length > 0 ? (
                            <Link
                                href="/diet"
                                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm
                                                hover:shadow-lg transition-all duration-200 hover:transform
                                                hover:-translate-y-1 block"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <HomeIcon className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-md">
                                                최근 식단
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-800 mb-1 leading-tight truncate">
                                            {recentDiets[0].title}
                                        </h3>
                                        <p className="text-sm text-gray-600 leading-relaxed truncate">
                                            평균 {recentDiets[0].avgCalories}kcal • {recentDiets[0].totalDays}일 계획
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <Link
                                href="/add"
                                className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-dashed border-green-300
                                                hover:border-green-400 transition-all duration-200 hover:transform
                                                hover:-translate-y-1 block"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <HomeIcon className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-md">
                                                식단 생성
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-800 mb-1 leading-tight">
                                            첫 번째 맞춤 식단을 만들어보세요
                                        </h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            AI가 당신에게 맞는 식단을 추천해드려요
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* 운동 추천 */}
                        {!isWorkoutsLoading && recentWorkouts && recentWorkouts.length > 0 ? (
                            <Link
                                href="/workout"
                                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm
                                                    hover:shadow-lg transition-all duration-200 hover:transform
                                                    hover:-translate-y-1 block"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <BoltIcon className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded-md">
                                                최근 운동
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-800 mb-1 leading-tight truncate">
                                            {recentWorkouts[0].title}
                                        </h3>
                                        <p className="text-sm text-gray-600 leading-relaxed truncate">
                                            평균 {recentWorkouts[0].avgCalories}kcal • {recentWorkouts[0].totalDays}일 계획
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <Link
                                href="/add"
                                className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-5 border-2 border-dashed border-orange-300
                                                    hover:border-orange-400 transition-all duration-200 hover:transform
                                                    hover:-translate-y-1 block"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <BoltIcon className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-2 py-1 rounded-md">
                                                운동 생성
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-800 mb-1 leading-tight">
                                            첫 번째 맞춤 운동을 만들어보세요
                                        </h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            AI가 당신에게 맞는 운동을 추천해드려요
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                </section>

                {/* 빠른 액션 */}
                <section className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        빠른 액션
                    </h2>
                    <div className="space-y-3">
                        <Link href="/add" className="w-full block">
                            <div
                                className="bg-yellow-400 hover:bg-yellow-500 rounded-2xl p-4 border border-yellow-300 shadow-sm
                                transition-all duration-200 hover:transform hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-800 text-lg">
                                        새로운 계획 만들기
                                    </span>
                                    <ArrowTrendingUpIcon className="w-6 h-6 text-gray-800 flex-shrink-0" />
                                </div>
                            </div>
                        </Link>

                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                href="/diet"
                                className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:bg-gray-50 
                                            transition-all duration-200 hover:transform hover:-translate-y-1 block"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <HomeIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                                    <span className="text-sm font-semibold text-gray-800">
                                        식단 보기
                                    </span>
                                </div>
                            </Link>

                            <Link
                                href="/workout"
                                className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:bg-gray-50 
                                                transition-all duration-200 hover:transform hover:-translate-y-1 block"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <BoltIcon className="w-6 h-6 text-orange-600 flex-shrink-0" />
                                    <span className="text-sm font-semibold text-gray-800">
                                        운동 보기
                                    </span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* 건강 팁 */}
                <section className="mb-6">
                    <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                            오늘의 건강 팁
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            규칙적인 운동과 균형 잡힌 식단은 건강한 생활의
                            기본입니다. 꾸준히 실천해보세요!
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
