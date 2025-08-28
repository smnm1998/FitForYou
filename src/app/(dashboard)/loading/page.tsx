"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

const logos = [
    { id: 1, src: "/Logo.png", alt: "FitForYou" },
    { id: 2, src: "/Logo.png", alt: "FitForYou" },
    { id: 3, src: "/Logo.png", alt: "FitForYou" },
    { id: 4, src: "/Logo.png", alt: "FitForYou" },
    { id: 5, src: "/Logo.png", alt: "FitForYou" },
];

const loadingMessages = [
    "조금만 기다려주세요...",
    "AI가 맞춤형 계획을 만들고 있어요...",
    "거의 다 됐어요!",
    "최고의 결과를 위해 노력하고 있어요...",
];

export default function LoadingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const type = searchParams.get("type") as "diet" | "workout" | null;
    const jobId = searchParams.get("jobId");
    
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [currentLogoIndex, setCurrentLogoIndex] = useState(0);

    useEffect(() => {
        // 메시지 순환
        const messageInterval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        }, 3000);

        // 로고 순차 애니메이션 (2-3초 간격)
        const logoInterval = setInterval(() => {
            setCurrentLogoIndex((prev) => (prev + 1) % logos.length);
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
                        
                        if (status.status === 'COMPLETED') {
                            console.log('✅ 작업 완료, 결과 페이지로 이동');
                            if (pollingInterval) clearInterval(pollingInterval);
                            
                            // React Query 캐시 무효화
                            queryClient.invalidateQueries({ 
                                queryKey: type === 'diet' ? ["saved-diets"] : ["saved-workouts"] 
                            });
                            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
                            
                            setTimeout(() => {
                                // 결과 페이지로 리다이렉트 (최신 데이터가 저장된 항목의 모달이 열림)
                                const redirectTo = type === 'diet' ? '/diet' : '/workout';
                                router.push(redirectTo);
                            }, 1000);
                        } else if (status.status === 'FAILED') {
                            console.error('❌ 작업 실패:', status.error);
                            if (pollingInterval) clearInterval(pollingInterval);
                            // 에러 페이지 또는 생성 페이지로 돌아가기
                            router.push(`/create?type=${type}&error=generation_failed`);
                        } else {
                            console.log('🔄 작업 진행 중:', status.status, `${status.progress || 0}%`);
                        }
                    } else {
                        console.error('❌ 작업 상태 조회 실패:', data.error);
                        if (pollingInterval) clearInterval(pollingInterval);
                        router.push(`/create?type=${type}&error=status_check_failed`);
                    }
                } catch (error) {
                    console.error('폴링 오류:', error);
                }
            }, 1000); // 1초마다 체크
        } else {
            // jobId가 없는 경우 create 페이지로 돌아가기
            console.error('작업 ID가 없습니다. 생성 페이지로 돌아갑니다.');
            setTimeout(() => {
                router.push(`/create?type=${type}&error=missing_job_id`);
            }, 3000);
        }

        return () => {
            clearInterval(messageInterval);
            clearInterval(logoInterval);
            if (pollingInterval) clearInterval(pollingInterval);
        };
    }, [jobId, type, router]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/10 to-primary/5 flex items-center justify-center p-4 pb-0">
            <div className="text-center max-w-md w-full">
                {/* 애니메이션 로고 - 하나씩 크게 표시 */}
                <div className="relative mb-16 h-40 flex items-center justify-center">
                    {logos.map((logo, index) => (
                        <div
                            key={logo.id}
                            className={`absolute transition-all duration-1000 ease-in-out ${
                                index === currentLogoIndex
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-75'
                            }`}
                        >
                            <div className="w-32 h-32 rounded-full bg-white shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                                <Image
                                    src={logo.src}
                                    alt={logo.alt}
                                    width={80}
                                    height={80}
                                    className="w-20 h-20 object-contain"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* 메시지 */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        {type === 'diet' ? '🍽️ 맞춤 식단' : '🏋️ 운동 계획'} 생성 중
                    </h1>
                    <p className="text-gray-600 text-lg animate-pulse">
                        {loadingMessages[currentMessageIndex]}
                    </p>
                </div>

                {/* 추가 정보 */}
                <div className="text-sm text-gray-500 space-y-2">
                    <p>AI가 당신의 정보를 바탕으로</p>
                    <p>최적의 {type === 'diet' ? '식단' : '운동 계획'}을 만들고 있어요</p>
                </div>
            </div>

        </div>
    );
}