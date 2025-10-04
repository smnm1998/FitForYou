"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import styles from "./LoadingPage.module.css";

const getMessageByProgress = (progress: number): string => {
    if (progress < 10) return "요청을 처리하고 있어요...";
    if (progress < 30) return "AI가 데이터를 분석하고 있어요...";
    if (progress < 50) return "맞춤형 계획을 설계하고 있어요...";
    if (progress < 70) return "세부 내용을 조정하고 있어요...";
    if (progress < 90) return "거의 다 됐어요...";
    return "최종 확인 중이에요...";
};

export default function LoadingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const type = searchParams.get("type") as "diet" | "workout" | null;
    const jobId = searchParams.get("jobId");

    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("요청을 처리하고 있어요...");

    useEffect(() => {
        let pollingInterval: NodeJS.Timeout | null = null;

        if (jobId) {
            pollingInterval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/jobs/${jobId}`);
                    const data = await response.json();

                    if (data.success) {
                        const status = data.data;

                        // 진행도
                        const currentProgress = status.progress || 0;
                        setProgress(currentProgress);
                        setMessage(getMessageByProgress(currentProgress));

                        if (status.status === "COMPLETED") {
                            console.log("✅ 작업 완료, 저장 API 호출 중...");
                            if (pollingInterval) clearInterval(pollingInterval);

                            // 완료 메시지
                            setProgress(100);
                            setMessage("완료되었습니다! 🎉");

                            // 저장 API 호출 -> savedId 획득
                            const saveResponse = await fetch(
                                `/api/jobs/${jobId}/save`,
                                { method: "POST" }
                            );
                            const saveData = await saveResponse.json();

                            if (saveData.success && saveData.savedId) {
                                queryClient.invalidateQueries({
                                    queryKey:
                                        type === "diet"
                                            ? ["saved-diets"]
                                            : ["saved-workouts"],
                                });
                                queryClient.invalidateQueries({
                                    queryKey: ["dashboard-stats"],
                                });

                                setTimeout(() => {
                                    const redirectTo =
                                        type === "diet"
                                            ? `/diet?openId=${saveData.savedId}`
                                            : `/workout?openId=${saveData.savedId}`;
                                    router.push(redirectTo);
                                }, 1000);
                            } else {
                                console.error("저장 실패: ", saveData.error);
                                router.push(
                                    `/create?type=${type}&error=save_failed`
                                );
                            }
                        } else if (status.status === "FAILED") {
                            console.error("❌ 작업 실패: ", status.error);
                            if (pollingInterval) clearInterval(pollingInterval);
                            router.push(
                                `/create?type=${type}&error=generation_failed`
                            );
                        }
                    } else {
                        console.error("❌ 작업 상태 조회 실패: ", data.error);
                        if (pollingInterval) clearInterval(pollingInterval);
                        router.push(
                            `/create?type=${type}&error=status_check_failed`
                        );
                    }
                } catch (error) {
                    console.error("폴링 오류: ", error);
                }
            }, 1000);
        } else {
            console.error("작업 ID가 없습니다.");
            setTimeout(() => {
                router.push(`/create?type=${type}&error=missing_job_id`);
            }, 3000);
        }

        return () => {
            if (pollingInterval) clearInterval(pollingInterval);
        };
    }, [jobId, type, router, queryClient]);

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.iconWrapper}>
                    <div className={styles.iconCircle}>
                        <ArrowPathIcon className={styles.spinIcon} />
                    </div>
                </div>

                <div className={styles.progressBarWrapper}>
                    <div className={styles.progressBarBg}>
                        <div
                            className={styles.progressBarFill}
                            style={{ width: `${progress}%` }}
                        ></div>
                        <p className={styles.progressText}>{progress}%</p>
                    </div>
                </div>
                <p className={styles.message}>{message}</p>
            </div>
        </div>
    );
}
