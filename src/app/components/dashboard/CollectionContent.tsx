"use client";

import { useState } from "react";
import {
    CalendarIcon,
    HomeIcon,
    BoltIcon,
    FireIcon,
    ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { CollectionSkeleton } from "@/app/components/ui/SkeletonUI";
import { useCollectionData } from "@/lib/hooks/useCollectionData";
import StatCard from "@/app/components/common/StatCard";
import QuickActionCard from "@/app/components/common/QuickActionCard";
import ActivityChart from "@/app/components/dashboard/ActivityChart";
import styles from "./CollectionContent.module.css";

export default function CollectionContent() {
    const [currentDate] = useState(
        new Date().toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
            weekday: "long",
        })
    );

    const { stats, recentDiets, recentWorkouts, isLoading, error } =
        useCollectionData();

    if (isLoading) {
        return <CollectionSkeleton />;
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorContent}>
                    <h2 className={styles.errorTitle}>
                        데이터를 불러올 수 없습니다
                    </h2>
                    <p className={styles.errorMessage}>
                        네트워크 연결을 확인해주세요
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className={styles.retryButton}
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <header className={styles.header}>
                    <h1 className={styles.title}>모아보기</h1>
                    <div className={styles.dateInfo}>
                        <CalendarIcon className={styles.calendarIcon} />
                        <span className={styles.dateText}>{currentDate}</span>
                    </div>
                </header>

                <section className={styles.statsSection}>
                    <div className={styles.statsGrid}>
                        <StatCard
                            icon={<HomeIcon className="w-6 h-6" />}
                            label="저장된 식단"
                            value={stats.totalDiets}
                            href="/diet"
                            iconBgColor="#dcfce7"
                            iconColor="#16a34a"
                        />
                        <StatCard
                            icon={<BoltIcon className="w-6 h-6" />}
                            label="저장된 운동"
                            value={stats.totalWorkouts}
                            href="/workout"
                            iconBgColor="#fed7aa"
                            iconColor="#ea580c"
                        />
                        <StatCard
                            icon={<CalendarIcon className="w-6 h-6" />}
                            label="이번 주 활동"
                            value={stats.thisWeekWorkouts}
                            iconBgColor="#dbeafe"
                            iconColor="#2563eb"
                        />
                        <StatCard
                            icon={<FireIcon className="w-6 h-6" />}
                            label="월간 소모칼로리"
                            value={stats.thisMonthCalories}
                            iconBgColor="#fee2e2"
                            iconColor="#dc2626"
                        />
                    </div>
                </section>

                <ActivityChart stats={stats} />

                <section className={styles.quickActionSection}>
                    <h2 className={styles.sectionTitle}>빠른 액션</h2>
                    <Link href="/add" className={styles.createButton}>
                        <div className={styles.createButtonContent}>
                            <span className={styles.createButtonText}>
                                새로운 계획 만들기
                            </span>
                            <ArrowTrendingUpIcon
                                className={styles.createButtonIcon}
                            />
                        </div>
                    </Link>

                    <div className={styles.actionCards}>
                        {recentDiets.length > 0 ? (
                            <QuickActionCard
                                title={recentDiets[0].title}
                                description={`평균 ${recentDiets[0].avgCalories}kcal • ${recentDiets[0].totalDays}일 계획`}
                                icon={<HomeIcon className="w-6 h-6" />}
                                badge="최근 식단"
                                href="/diet"
                                variant="diet"
                            />
                        ) : (
                            <QuickActionCard
                                title="첫 번째 맞춤 식단을 만들어보세요"
                                description="AI가 당신에게 맞는 식단을 추천해드려요"
                                icon={<HomeIcon className="w-6 h-6" />}
                                badge="식단 생성"
                                href="/add"
                                variant="empty"
                            />
                        )}

                        {recentWorkouts.length > 0 ? (
                            <QuickActionCard
                                title={recentWorkouts[0].title}
                                description={`평균 ${recentWorkouts[0].avgCalories}kcal • ${recentWorkouts[0].totalDays}일 계획`}
                                icon={<BoltIcon className="w-6 h-6" />}
                                badge="최근 운동"
                                href="/workout"
                                variant="workout"
                            />
                        ) : (
                            <QuickActionCard
                                title="첫 번째 맞춤 운동을 만들어보세요"
                                description="AI가 당신에게 맞는 운동을 추천해드려요"
                                icon={<BoltIcon className="w-6 h-6" />}
                                badge="운동 생성"
                                href="/add"
                                variant="empty"
                            />
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
