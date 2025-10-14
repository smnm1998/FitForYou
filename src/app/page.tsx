import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import styles from "./HomePage.module.css";

export const metadata: Metadata = {
    title: "FitForYou - 시작하기",
    description: "내 하루와 건강을 나답게, 모든 것을 당신에게 핏하게",
};

export default function HomePage() {
    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                {/* 로고 */}
                <div className={styles.logoSection}>
                    <Image
                        src="/logo.png"
                        alt="FitForYou 로고"
                        width={300}
                        height={120}
                        priority
                        className={styles.logoImage}
                    />
                </div>

                {/* 소개 텍스트 */}
                <div className={styles.introText}>
                    <p className={styles.tagline}>
                        내 하루와 건강을 나답게, 모든 것을 당신에게 핏하게
                    </p>
                    <p className={styles.tagline}>지금 시작해보세요!</p>
                </div>
            </div>

            {/* 버튼 섹션 */}
            <div className={styles.buttonSection}>
                <div className={styles.buttonContainer}>
                    <Link href="/signin" className={styles.startButton}>
                        시작하기
                    </Link>
                    {/* 회원가입 */}
                    <div className={styles.signupContainer}>
                        <p className={styles.signupText}>
                            아직 계정이 없으신가요?
                            <Link href="/signup" className={styles.signupLink}>
                                회원가입
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
