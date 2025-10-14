"use client";

import { useRouter } from "next/navigation";
import ActionCard from "@/app/components/common/ActionCard";
import styles from "./AddPage.module.css";

export default function AddPage() {
    const router = useRouter();
    const handleCreateDiet = () => {
        router.push("/create?type=diet");
    };
    const handleCreateWorkout = () => {
        router.push("/create?type=workout");
    };
    const handleConsultation = () => {
        alert("상담 기능은 준비 중입니다!");
    };

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <header className={styles.header}>
                    <h1 className={styles.title}>추가하기</h1>
                    <p className={styles.subtitle}>
                        AI로 새로운 식단과 운동을 만들어보세요!
                    </p>
                </header>
                <div className={styles.cardList}>
                    <ActionCard
                        icon="🍽️"
                        title="새로운 식단 생성"
                        description="AI가 당산의 건강 상태와 목표에 맞는 맞춤형 일주일 식단을 추천해드려요!"
                        buttonText="🍽️ 식단 만들기"
                        onClick={handleCreateDiet}
                    />
                    <ActionCard
                        icon="🏋️"
                        title="새로운 운동 생성"
                        description="개인 맞춤 운동 루틴을 만들어보세요 체력 수준과 환경에 맞춰 제안해드립니다"
                        buttonText="🏋️ 운동 만들기"
                        onClick={handleCreateWorkout}
                    />

                    <ActionCard
                        icon="💬"
                        title="맞춤 상담하기"
                        description="궁금한 것을 자유롭게 물어보세요 (준비 중)"
                        buttonText="🚧 준비 중"
                        onClick={handleConsultation}
                        disabled
                    />
                </div>
                <div className={styles.guideSection}>
                    <h3 className={styles.guideTitle}>💡 사용 가이드</h3>
                    <ul className={styles.guideList}>
                        <li className={styles.guideItem}>
                            <span className={styles.guideNumber}>1.</span>
                            원하는 타입(식단/운동)을 선택하세요
                        </li>
                        <li className={styles.guideItem}>
                            <span className={styles.guideNumber}>2.</span>
                            목표와 제약사항을 구체적으로 입력하세요
                        </li>
                        <li className={styles.guideItem}>
                            <span className={styles.guideNumber}>3.</span>
                            AI가 생성한 계획을 확인하고 저장하세요
                        </li>
                        <li className={styles.guideItem}>
                            <span className={styles.guideNumber}>4.</span>
                            저장된 계획은 해당 메뉴에서 언제든 확인 가능해요
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
