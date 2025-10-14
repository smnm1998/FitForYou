"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useDietData } from "@/lib/hooks/useDietData";
import { useDietStore } from "@/lib/stores/useDietStore";
import DietCard from "@/app/components/diet/DietCard";
import DietModal from "@/app/components/diet/DietModal";
import styles from "./FavoritesModal.module.css";

interface FavoritesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = "diet" | "workout";

export default function FavoritesModal({
    isOpen,
    onClose,
}: FavoritesModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>("diet");
    const { diets, isLoading, deleteDiet, toggleFavorite, toggleThisWeek } =
        useDietData();
    const { selectedDiet, openDiet, closeDiet } = useDietStore();

    if (!isOpen) return null;

    // 즐겨찾기만 필터링
    const favoriteDiets = diets.filter((diet) => diet.isFavorite);

    const handleDelete = (diet: (typeof diets)[0], e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`'${diet.title}' 식단을 삭제하시겠습니까?`)) {
            deleteDiet(diet);
        }
    };

    const handleToggleFavorite = (firstDietId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFavorite(firstDietId);
    };

    const handleToggleThisWeek = (firstDietId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        toggleThisWeek(firstDietId);
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>즐겨찾기</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <XMarkIcon className={styles.closeIcon} />
                    </button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${
                            activeTab === "diet" ? styles.tabActive : ""
                        }`}
                        onClick={() => setActiveTab("diet")}
                    >
                        식단
                    </button>
                    <button
                        className={`${styles.tab} ${
                            activeTab === "workout" ? styles.tabActive : ""
                        }`}
                        onClick={() => setActiveTab("workout")}
                    >
                        운동
                    </button>
                </div>

                <div className={styles.content}>
                    {activeTab === "diet" && (
                        <>
                            {isLoading ? (
                                <div className={styles.loading}>
                                    <div className={styles.spinner}></div>
                                </div>
                            ) : favoriteDiets.length === 0 ? (
                                <div className={styles.empty}>
                                    <p>즐겨찾기한 식단이 없습니다.</p>
                                </div>
                            ) : (
                                <div className={styles.cardList}>
                                    {favoriteDiets.map((diet) => (
                                        <DietCard
                                            key={diet.id}
                                            diet={diet}
                                            onClick={() => openDiet(diet)}
                                            onDelete={(e) =>
                                                handleDelete(diet, e)
                                            }
                                            onToggleFavorite={(e) =>
                                                handleToggleFavorite(
                                                    diet.firstDietId,
                                                    e
                                                )
                                            }
                                            onToggleThisWeek={(e) =>
                                                handleToggleThisWeek(
                                                    diet.firstDietId,
                                                    e
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === "workout" && (
                        <div className={styles.empty}>
                            <p>운동 즐겨찾기는 준비 중입니다.</p>
                        </div>
                    )}
                </div>
            </div>

            {selectedDiet && (
                <DietModal diet={selectedDiet} onClose={closeDiet} />
            )}
        </>
    );
}
