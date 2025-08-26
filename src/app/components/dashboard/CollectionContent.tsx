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
                                            추천 식단
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-1 leading-tight truncate">
                                        근력 증가를 위한 고단백 식단
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed truncate">
                                        오늘 섭취하기 좋은 식단입니다
                                    </p>
                                </div>
                            </div>
                        </Link>

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
                                            추천 운동
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-1 leading-tight truncate">
                                        전신 근력 운동 루틴
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed truncate">
                                        예상 소모 칼로리: 320 kcal
                                    </p>
                                </div>
                            </div>
                        </Link>
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
