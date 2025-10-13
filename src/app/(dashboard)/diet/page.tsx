"use client";

import { useEffect } from "react";
import { useDietStore } from "@/lib/stores/useDietStore";
import { useDietData } from "@/lib/hooks/useDietData";
import DietCard from "@/app/components/diet/DietCard";
import DietModal from "@/app/components/diet/DietModal";
import styles from "./DietPage.module.css";

export default function DietPage() {
    const {
        selectedDiet,
        hasAutoOpened,
        openDiet,
        closeDiet,
        setHasAutoOpened,
    } = useDietStore();
    const {
        diets,
        isLoading,
        error,
        deleteDiet,
        toggleFavorite,
        toggleThisWeek,
    } = useDietData();

    // 자동 모달 오픈 (로딩 페이지에서 리다이렉트된 경우)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const openId = params.get("openId");

        if (!isLoading && diets.length > 0 && !hasAutoOpened && openId) {
            const targetDiet = diets.find(
                (diet) => diet.id.toString() === openId
            );

            if (targetDiet) {
                openDiet(targetDiet);
                setHasAutoOpened(true);
                window.history.replaceState({}, "", window.location.pathname);
            }
        }
    }, [isLoading, diets, hasAutoOpened, openDiet, setHasAutoOpened]);

    // 컴포넌트 언마운트 시 스크롤 복원
    useEffect(() => {
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const handleDelete = (diet: (typeof diets)[0], e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`'${diet.title}' 식단 그룹 전체를 삭제하시겠습니까?`)) {
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

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.wrapper}>
                    <div className={styles.emptyCard}>
                        <h2 className={styles.emptyTitle}>오류 발생</h2>
                        <p>데이터를 불러올 수 없습니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <header className={styles.header}>
                    <h1 className={styles.title}>저장된 식단</h1>
                    <p className={styles.subtitle}>나만의 맞춤 식단 모음</p>
                </header>

                <section>
                    {isLoading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinner}></div>
                        </div>
                    ) : diets.length === 0 ? (
                        <div className={styles.emptyCard}>
                            <p className={styles.emptyTitle}>
                                저장된 식단이 없습니다.
                            </p>
                            <span>새로운 식단을 추가해보세요!</span>
                        </div>
                    ) : (
                        <div className={styles.cardList}>
                            {diets.map((diet) => (
                                <DietCard
                                    key={diet.id}
                                    diet={diet}
                                    onClick={() => openDiet(diet)}
                                    onDelete={(e) => handleDelete(diet, e)}
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
                </section>
            </div>

            {selectedDiet && (
                <DietModal diet={selectedDiet} onClose={closeDiet} />
            )}
        </div>
    );
}
