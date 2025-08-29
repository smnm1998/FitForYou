"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const loadingMessages = [
    "조금만 기다려주세요...",
    "AI가 맞춤형 계획을 만들고 있어요...",
    "거의 다 됐어요!",
    "최고의 결과를 위해 노력하고 있어요...",
];

const icons = [
    { emoji: "🏃‍♂️", name: "운동" },
    { emoji: "🍎", name: "영양" },
    { emoji: "💪", name: "근력" },
    { emoji: "🧘‍♀️", name: "웰빙" },
    { emoji: "⚡", name: "에너지" },
];

export default function LoadingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const type = searchParams.get("type") as "diet" | "workout" | null;
    const jobId = searchParams.get("jobId");

    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [currentIconIndex, setCurrentIconIndex] = useState(0);

    useEffect(() => {
        // 메시지 순환
        const messageInterval = setInterval(() => {
            setCurrentMessageIndex(
                (prev) => (prev + 1) % loadingMessages.length
            );
        }, 3000);

        // 아이콘 순환 (오른쪽 페이드 애니메이션)
        const iconInterval = setInterval(() => {
            setCurrentIconIndex((prev) => (prev + 1) % icons.length);
        }, 2500);

        // 작업 상태 폴링 (jobId가 있는 경우)
        let pollingInterval: NodeJS.Timeout | null = null;
        if (jobId) {
            pollingInterval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/jobs/${jobId}`);
                    const data = await response.json();

                    if (data.success) {
                        const status = data.data;

                        if (status.status === "COMPLETED") {
                            console.log("✅ 작업 완료, 결과 페이지로 이동");
                            if (pollingInterval) clearInterval(pollingInterval);

                            // React Query 캐시 무효화
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
                                // 결과 페이지로 리다이렉트 (최신 데이터가 저장된 항목의 모달이 열림)
                                const redirectTo =
                                    type === "diet"
                                        ? "/diet?auto-open=true"
                                        : "/workout?auto-open=true";
                                router.push(redirectTo);
                            }, 1000);
                        } else if (status.status === "FAILED") {
                            console.error("❌ 작업 실패:", status.error);
                            if (pollingInterval) clearInterval(pollingInterval);
                            // 에러 페이지 또는 생성 페이지로 돌아가기
                            router.push(
                                `/create?type=${type}&error=generation_failed`
                            );
                        } else {
                            console.log(
                                "🔄 작업 진행 중:",
                                status.status,
                                `${status.progress || 0}%`
                            );
                        }
                    } else {
                        console.error("❌ 작업 상태 조회 실패:", data.error);
                        if (pollingInterval) clearInterval(pollingInterval);
                        router.push(
                            `/create?type=${type}&error=status_check_failed`
                        );
                    }
                } catch (error) {
                    console.error("폴링 오류:", error);
                }
            }, 1000); // 1초마다 체크
        } else {
            // jobId가 없는 경우 create 페이지로 돌아가기
            console.error("작업 ID가 없습니다. 생성 페이지로 돌아갑니다.");
            setTimeout(() => {
                router.push(`/create?type=${type}&error=missing_job_id`);
            }, 3000);
        }

        return () => {
            clearInterval(messageInterval);
            clearInterval(iconInterval);
            if (pollingInterval) clearInterval(pollingInterval);
        };
    }, [jobId, type, router, queryClient]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/10 to-primary/5 flex items-center justify-center p-6">
            <div className="text-center max-w-lg w-full">
                {/* 아이콘 애니메이션 */}
                <div className="mb-16 h-28 flex items-center justify-center relative">
                    {icons.map((icon, index) => (
                        <div
                            key={index}
                            className={`absolute transition-all duration-1000 ease-in-out ${
                                index === currentIconIndex
                                    ? "opacity-100 translate-x-0 scale-100"
                                    : index < currentIconIndex
                                    ? "opacity-0 -translate-x-8 scale-95"
                                    : "opacity-0 translate-x-8 scale-95"
                            }`}
                        >
                            <div className="w-40 h-40 mx-auto rounded-full bg-white shadow-xl flex items-center justify-center">
                                <span className="text-7xl">{icon.emoji}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 메시지 */}
                <div>
                    <p className="text-gray-700 text-base font-medium animate-pulse">
                        {loadingMessages[currentMessageIndex]}
                    </p>
                </div>
            </div>
        </div>
    );
}
