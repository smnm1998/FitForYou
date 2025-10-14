"use client";

import {
    TrashIcon,
    CalendarIcon,
    ClockIcon,
    FireIcon,
    StarIcon as StarOutline,
} from "@heroicons/react/24/outline";
import {
    StarIcon as StarSolid,
    CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { SavedDietItem } from "@/lib/types/diet";
import styles from "./DietCard.module.css";

interface DietCardProps {
    diet: SavedDietItem;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onToggleFavorite: (e: React.MouseEvent) => void;
    onToggleThisWeek: (e: React.MouseEvent) => void;
}

export default function DietCard({
    diet,
    onClick,
    onDelete,
    onToggleFavorite,
    onToggleThisWeek,
}: DietCardProps) {
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
        return `${Math.floor(diffDays / 30)}개워 전`;
    };

    return (
        <div className={styles.card} onClick={onClick}>
            <div className={styles.cardHeader}>
                <div className={styles.cardInfo}>
                    <div className={styles.iconWrapper}>
                        <span className={styles.icon}>🍽️</span>
                    </div>
                    <div className={styles.titleSection}>
                        <h3 className={styles.title}>{diet.title}</h3>
                        <div className={styles.meta}>
                            <span className={styles.metaItem}>
                                <ClockIcon className={styles.metaIcon} />
                                {getTimeSince(diet.createdAt)}
                            </span>
                            <span className={styles.separator}>•</span>
                            <span>{formatDate(diet.createdAt)}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.actions}>
                    <button
                        onClick={onToggleFavorite}
                        className={`${styles.actionBtn} ${
                            diet.isFavorite ? styles.active : ""
                        }`}
                        aria-label="즐겨찾기"
                    >
                        {diet.isFavorite ? (
                            <StarSolid className={styles.actionIcon} />
                        ) : (
                            <StarOutline className={styles.actionIcon} />
                        )}
                    </button>
                    <button
                        onClick={onToggleThisWeek}
                        className={`${styles.actionBtn} ${
                            diet.isThisWeek ? styles.activeGreen : ""
                        }`}
                        aria-label="이번 주"
                    >
                        <CheckCircleIcon className={styles.actionIcon} />
                    </button>
                    <button
                        onClick={onDelete}
                        className={styles.deleteBtn}
                        aria-label="식단 삭제"
                    >
                        <TrashIcon className={styles.actionIcon} />
                    </button>
                </div>
            </div>
            <div className={styles.cardBody}>
                <p className={styles.description}>
                    {diet.isCompleteWeek
                        ? "7일 완성"
                        : `${diet.totalDays}일`}
                    간의 맞춤 식단 계획이 포함되어 있습니다.
                </p>
                <div className={styles.badges}>
                    <span className={styles.calorieBadge}>
                        <FireIcon className={styles.badgeIcon} />
                        평균 {diet.avgCalories} kcal/일
                    </span>
                    {diet.isCompleteWeek && (
                        <span className={styles.weekBadge}>
                            완성된 주간 식단
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
