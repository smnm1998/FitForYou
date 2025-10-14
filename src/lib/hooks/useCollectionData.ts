import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiClient } from "../api-client";

export interface DashboardStats {
    overview: {
        totalDiets: number;
        totalWorkouts: number;
        thisWeekWorkouts: number;
        thisMonthCalories: number;
    };
}

export interface SavedItem {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    avgCalories: number;
    totalDays: number;
}

export function useCollectionData() {
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const {
        data: dashboardData,
        isLoading: isStatsLoading,
        error: statsError,
    } = useQuery({
        queryKey: ["dashboard-stats", userId],
        queryFn: async () => {
            const response = await apiClient.getDashboardStats();
            return response.data as DashboardStats;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    // 최근 식단
    const { data: recentDiets, isLoading: isDietsLoading } = useQuery({
        queryKey: ["recent-diets", userId],
        queryFn: async () => {
            const response = await fetch("/api/diets?limit=1");
            const result = await response.json();
            return result.success ? result.data.diets : [];
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    // 최근 운동
    const { data: recentWorkouts, isLoading: isWorkoutsLoading } = useQuery({
        queryKey: ["recent-workouts", userId],
        queryFn: async () => {
            const response = await fetch("/api/workouts?limit=1");
            const result = await response.json();
            return result.success ? result.data.workouts : [];
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    const stats = dashboardData?.overview || {
        totalDiets: 0,
        totalWorkouts: 0,
        thisWeekWorkouts: 0,
        thisMonthCalories: 0,
    };

    const isLoading = isStatsLoading || isDietsLoading || isWorkoutsLoading;

    return {
        stats,
        recentDiets: recentDiets || [],
        recentWorkouts: recentWorkouts || [],
        isLoading,
        error: statsError,
    };
}
