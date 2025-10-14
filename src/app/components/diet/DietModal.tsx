"use client";

import { XMarkIcon, FireIcon } from "@heroicons/react/24/outline";
import { SavedDietItem, WeeklyDiet, MealPlan } from "@/lib/types/diet";
import styles from "./DietModal.module.css";

interface DietModalProps {
    diet: SavedDietItem;
    onClose: () => void;
}

export default function DietModal({ diet, onClose }: DietModalProps) {
    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
        });

    const getMealTypeIcon = (mealType: string) => {
        const icons: Record<string, string> = {
            breakfast: "🌅",
            lunch: "☀️",
            dinner: "🌙",
            snack: "🍪",
        };
        return icons[mealType] || "🍽️";
    };

    const getMealTypeName = (mealType: string) => {
        const names: Record<string, string> = {
            breakfast: "아침",
            lunch: "점심",
            dinner: "저녁",
            snack: "간식",
        };
        return names[mealType] || mealType;
    };

    const getUpcomingDietPlan = (weeklyDiet: WeeklyDiet[]) => {
        const uniqueDiets = new Map<string, WeeklyDiet>();
        weeklyDiet.forEach((day) => {
            const dateKey = day.date;
            if (!uniqueDiets.has(dateKey)) {
                uniqueDiets.set(dateKey, day);
            }
        });

        return Array.from(uniqueDiets.values()).sort((a, b) => {
            if (a.isToday) return -1;
            if (b.isToday) return 1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    };

    const upcomingDiets = getUpcomingDietPlan(diet.weeklyDiet);

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.iconWrapper}>
                            <span className={styles.icon}>🍽️</span>
                        </div>
                        <div className={styles.titleSection}>
                            <h2 className={styles.title}>{diet.title}</h2>
                            <p className={styles.subtitle}>
                                {diet.totalDays}일 맞춤 식단 계획
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <XMarkIcon className={styles.closeIcon} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.contentGrid}>
                        {/* AI 조언 섹션 */}
                        {diet.advice && diet.advice.summary && (
                            <div className={styles.adviceSection}>
                                <div className={styles.adviceHeader}>
                                    <div className={styles.adviceIconWrapper}>
                                        <span>💡</span>
                                    </div>
                                    <div>
                                        <h3 className={styles.adviceTitle}>
                                            AI 영양 조언
                                        </h3>
                                        <p className={styles.adviceSubtitle}>
                                            개인 맞춤 식단 가이드
                                        </p>
                                    </div>
                                </div>

                                <div className={styles.summary}>
                                    <div className={styles.summaryIcon}>
                                        <span>📋</span>
                                    </div>
                                    <h4 className={styles.summaryTitle}>
                                        핵심 요약
                                    </h4>
                                    <p className={styles.summaryText}>
                                        {diet.advice.summary}
                                    </p>
                                </div>

                                <div className={styles.adviceGrid}>
                                    <div className={styles.tipsSection}>
                                        <div className={styles.tipsHeader}>
                                            <span className={styles.tipsIcon}>
                                                ✨
                                            </span>
                                            <h4>추천 사항</h4>
                                        </div>
                                        <div className={styles.tipsList}>
                                            {diet.advice.tips.map(
                                                (tip, index) => (
                                                    <div
                                                        key={index}
                                                        className={
                                                            styles.tipItem
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.bullet
                                                            }
                                                        ></div>
                                                        <p>{tip}</p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.warningsSection}>
                                        <div className={styles.warningsHeader}>
                                            <span
                                                className={styles.warningIcon}
                                            >
                                                ⚠️
                                            </span>
                                            <h4>주의사항</h4>
                                        </div>
                                        <div className={styles.warningsList}>
                                            {diet.advice.warnings.map(
                                                (warning, index) => (
                                                    <div
                                                        key={index}
                                                        className={
                                                            styles.warningItem
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.bullet
                                                            }
                                                        ></div>
                                                        <p>{warning}</p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 식단 카드들 */}
                        {upcomingDiets.length > 0 ? (
                            upcomingDiets.map((day) => (
                                <div
                                    key={day.id}
                                    className={`${styles.dayCard} ${
                                        day.isToday ? styles.todayCard : ""
                                    }`}
                                >
                                    <div className={styles.dayHeader}>
                                        <h3 className={styles.dayTitle}>
                                            {day.day}
                                        </h3>
                                        <div className={styles.dayMeta}>
                                            <span className={styles.dayDate}>
                                                {formatDate(day.date)}
                                            </span>
                                            {day.isToday && (
                                                <span
                                                    className={
                                                        styles.todayBadge
                                                    }
                                                >
                                                    오늘
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.meals}>
                                        {[
                                            "breakfast",
                                            "lunch",
                                            "dinner",
                                            "snack",
                                        ].map((mealType) => {
                                            let mealContent =
                                                day.mealPlan[
                                                    mealType as keyof MealPlan
                                                ];

                                            if (
                                                mealType === "snack" &&
                                                typeof mealContent === "string"
                                            ) {
                                                try {
                                                    const parsed =
                                                        JSON.parse(mealContent);
                                                    if (
                                                        parsed.originalSnack !==
                                                        undefined
                                                    ) {
                                                        mealContent =
                                                            parsed.originalSnack;
                                                    }
                                                } catch {}
                                            }

                                            if (!mealContent) return null;

                                            return (
                                                <div
                                                    key={mealType}
                                                    className={`${
                                                        styles.mealCard
                                                    } ${
                                                        styles[
                                                            `meal${
                                                                mealType
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                mealType.slice(
                                                                    1
                                                                )
                                                            }`
                                                        ]
                                                    }`}
                                                >
                                                    <div
                                                        className={
                                                            styles.mealHeader
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.mealIcon
                                                            }
                                                        >
                                                            {getMealTypeIcon(
                                                                mealType
                                                            )}
                                                        </span>
                                                        <span
                                                            className={
                                                                styles.mealName
                                                            }
                                                        >
                                                            {getMealTypeName(
                                                                mealType
                                                            )}
                                                        </span>
                                                    </div>
                                                    <p
                                                        className={
                                                            styles.mealContent
                                                        }
                                                    >
                                                        {String(mealContent)}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className={styles.calorieFooter}>
                                        <span className={styles.calorieBadge}>
                                            <FireIcon
                                                className={styles.calorieIcon}
                                            />
                                            {day.mealPlan.totalCalories} kcal
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <p className={styles.emptyTitle}>
                                    표시할 식단 계획이 없습니다.
                                </p>
                                <p className={styles.emptyText}>
                                    이 식단 계획은 이미 모두 지난 날짜의
                                    계획입니다.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
