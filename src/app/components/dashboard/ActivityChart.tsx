"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { useQuery } from "@tanstack/react-query";
import styles from "./ActivityChart.module.css";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface ActivityChartProps {
    stats: {
        totalDiets: number;
        totalWorkouts: number;
        thisWeekWorkouts: number;
        thisMonthCalories: number;
    };
}

interface WeeklyActivityData {
    labels: string[];
    workoutCounts: number[];
    caloriesBurned: number[];
}

export default function ActivityChart({ stats }: ActivityChartProps) {
    // 주간 활동 데이터 조회
    const { data: weeklyData } = useQuery({
        queryKey: ["weekly-activity"],
        queryFn: async () => {
            const response = await fetch("/api/stats/weekly-activity");
            const result = await response.json();
            return result.success ? result.data : null;
        },
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    const activityData = weeklyData as WeeklyActivityData | null;

    // 주간 활동 추이 데이터
    const weeklyChartData = {
        labels: activityData?.labels || [
            "월",
            "화",
            "수",
            "목",
            "금",
            "토",
            "일",
        ],
        datasets: [
            {
                label: "운동 횟수",
                data: activityData?.workoutCounts || [0, 0, 0, 0, 0, 0, 0],
                borderColor: "rgb(249, 115, 22)",
                backgroundColor: "rgba(249, 115, 22, 0.1)",
                fill: true,
                tension: 0.4,
            },
        ],
    };

    // 식단/운동 비율 데이터
    const ratioData = {
        labels: ["식단", "운동"],
        datasets: [
            {
                data: [stats.totalDiets, stats.totalWorkouts],
                backgroundColor: [
                    "rgba(34, 197, 94, 0.8)",
                    "rgba(249, 115, 22, 0.8)",
                ],
                borderColor: ["rgb(34, 197, 94)", "rgb(249, 115, 22)"],
                borderWidth: 2,
            },
        ],
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                padding: 12,
                titleFont: {
                    size: 14,
                },
                bodyFont: {
                    size: 13,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
                grid: {
                    color: "rgba(0, 0, 0, 0.05)",
                },
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom" as const,
                labels: {
                    padding: 15,
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                padding: 12,
            },
        },
    };

    return (
        <div className={styles.container}>
            <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>주간 활동 추이</h3>
                <div className={styles.lineChart}>
                    <Line data={weeklyChartData} options={lineOptions} />
                </div>
            </div>
            <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>식단/운동 비율</h3>
                <div className={styles.doughnutChart}>
                    <Doughnut data={ratioData} options={doughnutOptions} />
                </div>
            </div>
        </div>
    );
}
