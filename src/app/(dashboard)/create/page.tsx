"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeftIcon,
    HomeIcon,
    BoltIcon,
    PaperAirplaneIcon,
    ArrowPathIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface GeneratedContent {
    type: "diet" | "workout";
    data: any;
    isLoading: boolean;
}

interface JobStatus {
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    result?: any;
    error?: string;
    progress?: number;
    createdAt: Date;
    completedAt?: Date;
}

export default function CreatePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pageType = (searchParams.get("type") as "diet" | "workout") || "diet";

    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] =
        useState<GeneratedContent | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
    const resultSectionRef = useRef<HTMLDivElement>(null);

    // 페이지 설정
    const pageConfig = {
        diet: {
            title: "맞춤 식단 생성",
            subtitle: "AI가 당신만의 일주일 식단을 만들어드려요",
            icon: HomeIcon,
            placeholder:
                "예: 다이어트를 위한 저칼로리 식단을 만들어주세요. 견과류 알레르기가 있어요.",
            buttonText: "식단 생성하기",
            examples: [
                "다이어트를 위한 1500kcal 저칼로리 식단",
                "근육량 증가를 위한 고단백 식단",
                "당뇨 환자를 위한 저당 식단",
                "비건 채식주의자를 위한 식단",
            ],
        },
        workout: {
            title: "맞춤 운동 생성",
            subtitle: "AI가 당신만의 일주일 운동 계획을 만들어드려요",
            icon: BoltIcon,
            placeholder:
                "예: 집에서 할 수 있는 전신 근력운동 루틴을 만들어주세요. 헬스장 기구는 없어요.",
            buttonText: "운동 계획 생성하기",
            examples: [
                "집에서 하는 전신 운동 루틴",
                "체중 감량을 위한 유산소 운동",
                "초보자용 근력 운동 프로그램",
                "허리 디스크 환자를 위한 안전한 운동",
            ],
        },
    };

    const config = pageConfig[pageType];
    const IconComponent = config.icon;

    useEffect(() => {
        // 페이지 진입 시 초기화
        setGeneratedContent(null);
        setError(null);
        setPrompt("");
    }, [pageType]);

    const handleBackButton = () => {
        router.push("/add");
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("프롬프트를 입력해주세요.");
            return;
        }

        if (prompt.length > 1000) {
            setError("요청사항이 너무 깁니다. 1000자 이내로 입력해주세요.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedContent(null);
        setCurrentJobId(null);
        setJobStatus(null);

        try {
            console.log(`🚀 ${pageType} 생성 작업 시작:`, prompt);

            // 새로운 비동기 작업 시도, 실패시 기존 방식으로 폴백
            let response;
            let useAsyncJob = true;
            
            try {
                response = await fetch("/api/jobs", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        jobType: pageType === "diet" ? "DIET_GENERATION" : "WORKOUT_GENERATION",
                        prompt: prompt.trim(),
                    }),
                });

                if (!response.ok) {
                    throw new Error('Async job API not available');
                }
            } catch (asyncError) {
                console.warn('🔄 비동기 API 실패, 기존 방식으로 폴백:', asyncError);
                useAsyncJob = false;
                
                // 기존 동기 방식으로 폴백
                const endpoint = pageType === "diet" 
                    ? "/api/ai/generate-diet"
                    : "/api/ai/generate-workout";
                    
                response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        prompt: prompt.trim(),
                        saveToDatabase: false,
                    }),
                });
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            if (data.success) {
                if (useAsyncJob && data.data.jobId) {
                    // 비동기 작업 처리
                    const jobId = data.data.jobId;
                    setCurrentJobId(jobId);
                    
                    toast.success(
                        `🎉 ${
                            pageType === "diet" ? "식단" : "운동 계획"
                        } 생성이 시작되었습니다!`
                    );
                    
                    console.log("✅ 비동기 작업 시작됨:", jobId);
                    
                    // 폴링 시작
                    startJobPolling(jobId);
                } else {
                    // 기존 동기 방식 처리
                    setIsGenerating(false);
                    setGeneratedContent({
                        type: pageType,
                        data: data.data[pageType] || data.data.diet || data.data.workout,
                        isLoading: false,
                    });
                    
                    toast.success(
                        `🎉 ${
                            pageType === "diet" ? "식단" : "운동 계획"
                        }이 생성되었습니다!`
                    );
                    
                    console.log("✅ 동기 작업 완료:", data.data);
                }
                
                // 결과 섹션으로 자동 스크롤
                setTimeout(() => {
                    resultSectionRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }, 100);
            } else {
                throw new Error(data.error || "작업 생성에 실패했습니다.");
            }
        } catch (err: any) {
            console.error("❌ 작업 생성 오류:", err);

            let errorMessage = "작업 생성 중 오류가 발생했습니다.";

            if (err.message.includes("API key")) {
                errorMessage = "AI 서비스 설정에 문제가 있습니다.";
            } else if (err.message.includes("rate limit")) {
                errorMessage =
                    "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
            } else if (err.message.includes("tokens")) {
                errorMessage = "요청이 너무 깁니다. 더 간단하게 입력해주세요.";
            } else if (err.message.includes("Unauthorized")) {
                errorMessage = "로그인이 필요합니다.";
            }

            setError(errorMessage);
            toast.error(errorMessage);
            setIsGenerating(false);
        }
    };

    const handleRegenerateWithSamePrompt = async () => {
        if (prompt.trim()) {
            // 기존 작업 취소
            if (currentJobId && jobStatus?.status && ['PENDING', 'PROCESSING'].includes(jobStatus.status)) {
                await cancelCurrentJob();
            }
            await handleGenerate();
        }
    };

    const startJobPolling = (jobId: string) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/jobs/${jobId}`);
                const data = await response.json();

                if (data.success) {
                    const status = data.data;
                    setJobStatus(status);

                    if (status.status === 'COMPLETED') {
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                        
                        // 결과 표시
                        if (status.result) {
                            setGeneratedContent({
                                type: pageType,
                                data: status.result,
                                isLoading: false,
                            });
                            toast.success(
                                `✅ ${
                                    pageType === "diet" ? "식단" : "운동 계획"
                                }이 완성되었습니다!`
                            );
                        }
                    } else if (status.status === 'FAILED') {
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                        setError(status.error || "생성에 실패했습니다.");
                        toast.error("생성에 실패했습니다.");
                    } else if (status.status === 'CANCELLED') {
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                        toast("작업이 취소되었습니다.", { icon: '🚫' });
                    }
                }
            } catch (error) {
                console.error('폴링 오류:', error);
            }
        }, 2000); // 2초마다 체크

        // 5분 후 타임아웃
        setTimeout(() => {
            clearInterval(pollInterval);
            if (jobStatus?.status === 'PROCESSING') {
                setError("처리 시간이 너무 오래 걸립니다. 다시 시도해주세요.");
                setIsGenerating(false);
            }
        }, 300000); // 5분
    };

    const cancelCurrentJob = async () => {
        if (!currentJobId) return;
        
        try {
            await fetch(`/api/jobs/${currentJobId}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('작업 취소 오류:', error);
        }
    };

    const handleSaveAndNavigate = async () => {
        if (!currentJobId || !generatedContent) return;

        setIsSaving(true);

        try {
            // 작업 결과 저장
            const response = await fetch(`/api/jobs/${currentJobId}/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success(
                    `💾 ${
                        pageType === "diet" ? "식단" : "운동 계획"
                    }이 저장되었습니다!`
                );

                // 해당 페이지로 이동
                if (data.redirect) {
                    router.push(data.redirect);
                } else if (pageType === "diet") {
                    router.push("/diet");
                } else {
                    router.push("/workout");
                }
            } else {
                throw new Error(data.error || "저장에 실패했습니다.");
            }
        } catch (err: any) {
            console.error("❌ 저장 오료:", err);
            toast.error("저장 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    const renderPreview = () => {
        if (!generatedContent?.data) return null;

        const data = generatedContent.data;

        if (pageType === "diet") {
            return (
                <div className="space-y-4">
                    <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-2">
                            📋 {data.title || "맞춤형 식단"}
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {data.description ||
                                "일주일간의 맞춤형 식단입니다."}
                        </p>
                    </div>

                    {data.weeklyDiet && data.weeklyDiet.length > 0 && (
                        <div>
                            <h5 className="font-semibold text-gray-700 mb-3">
                                📅 일주일 식단 미리보기:
                            </h5>
                            <div className="space-y-2">
                                {data.weeklyDiet
                                    .slice(0, 3)
                                    .map((day: any, index: number) => (
                                        <div
                                            key={index}
                                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                        >
                                            <span className="font-medium text-gray-800">
                                                {day.day}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                총{" "}
                                                {day.mealPlan?.totalCalories ||
                                                    0}{" "}
                                                kcal
                                            </span>
                                        </div>
                                    ))}
                                {data.weeklyDiet.length > 3 && (
                                    <div className="text-center text-sm text-gray-500 py-2">
                                        ... 외 {data.weeklyDiet.length - 3}일
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        } else {
            return (
                <div className="space-y-4">
                    <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-2">
                            🏋️ {data.title || "맞춤형 운동 계획"}
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {data.description ||
                                "일주일간의 맞춤형 운동 계획입니다."}
                        </p>
                    </div>

                    {data.weeklyWorkout && data.weeklyWorkout.length > 0 && (
                        <div>
                            <h5 className="font-semibold text-gray-700 mb-3">
                                📅 일주일 운동 미리보기:
                            </h5>
                            <div className="space-y-2">
                                {data.weeklyWorkout
                                    .slice(0, 3)
                                    .map((day: any, index: number) => (
                                        <div
                                            key={index}
                                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                        >
                                            <span className="font-medium text-gray-800">
                                                {day.day}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {day.workoutPlan?.type ||
                                                    "운동"}{" "}
                                                •{" "}
                                                {day.workoutPlan?.duration ||
                                                    "30분"}
                                            </span>
                                        </div>
                                    ))}
                                {data.weeklyWorkout.length > 3 && (
                                    <div className="text-center text-sm text-gray-500 py-2">
                                        ... 외 {data.weeklyWorkout.length - 3}일
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* 뒤로가기 버튼 */}
            <button
                onClick={handleBackButton}
                className="fixed top-8 left-4 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full 
                          flex items-center justify-center shadow-lg hover:bg-primary/90 
                          transition-all duration-200 z-20 hover:transform hover:-translate-y-1"
            >
                <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
            </button>

            <div className="max-w-2xl mx-auto px-5 pt-20">
                {/* 헤더 */}
                <header className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <IconComponent className="w-8 h-8 text-primary" />
                        <h1 className="text-2xl font-bold text-gray-800">
                            {config.title}
                        </h1>
                    </div>
                    <p className="text-gray-600">{config.subtitle}</p>
                </header>

                {/* 프롬프트 입력 섹션 */}
                <section className="mb-8">
                    <div className="card p-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
                            어떤 {pageType === "diet" ? "식단" : "운동"}을
                            원하시나요?
                        </h2>
                        <p className="text-gray-600 text-center mb-6">
                            구체적으로 설명해주시면 더 정확한 추천을 받을 수
                            있어요
                        </p>

                        {/* 예시 프롬프트 */}
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                💡 예시:
                            </h4>
                            <div className="grid gap-2">
                                {config.examples.map((example, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setPrompt(example)}
                                        className="text-left p-3 text-sm bg-gray-50 rounded-lg border border-gray-200 
                                                  hover:bg-primary/10 hover:border-primary/30 transition-colors duration-200
                                                  disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isGenerating}
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 프롬프트 입력 */}
                        <div className="mb-4">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={config.placeholder}
                                className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none
                                          focus:border-primary focus:outline-none transition-colors duration-200
                                          disabled:bg-gray-50 disabled:cursor-not-allowed"
                                rows={4}
                                disabled={isGenerating}
                                maxLength={1000}
                            />
                            <div className="text-right text-xs text-gray-500 mt-1">
                                {prompt.length}/1000
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed
                                      flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                    <span>생성 중...</span>
                                </>
                            ) : (
                                <>
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                    <span>{config.buttonText}</span>
                                </>
                            )}
                        </button>
                    </div>
                </section>

                {/* 생성 결과 섹션 */}
                {generatedContent && (
                    <section
                        ref={resultSectionRef}
                        className="mb-8 animate-in slide-in-from-bottom duration-500"
                    >
                        <div className={`card p-8 border-2 ${generatedContent ? 'border-success bg-green-50/50' : 'border-primary bg-blue-50/50'}`}>
                            <div className="text-center mb-6">
                                {generatedContent ? (
                                    <>
                                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                                            생성 완료! 🎉
                                        </h2>
                                        <p className="text-gray-600">
                                            일주일치{" "}
                                            {pageType === "diet" ? "식단" : "운동 계획"}
                                            이 생성되었습니다
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                                            {jobStatus?.status === 'PROCESSING' ? '생성 중... ⚡' : '준비 중... 🔄'}
                                        </h2>
                                        <p className="text-gray-600">
                                            AI가 당신만의{" "}
                                            {pageType === "diet" ? "식단" : "운동 계획"}
                                            을 만들고 있습니다
                                        </p>
                                        {jobStatus?.progress !== undefined && (
                                            <div className="mt-4">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                                                        style={{ width: `${jobStatus.progress}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-2">
                                                    {jobStatus.progress}% 완료
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200">
                                {generatedContent ? (
                                    renderPreview()
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 mx-auto mb-4">
                                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        <p className="text-gray-600">
                                            {jobStatus?.status === 'PENDING' && '작업 대기 중...'}
                                            {jobStatus?.status === 'PROCESSING' && 'AI가 열심히 작업 중...'}
                                            {!jobStatus && '작업을 시작하는 중...'}
                                        </p>
                                        {jobStatus?.error && (
                                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-red-700 text-sm">{jobStatus.error}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleRegenerateWithSamePrompt}
                                    className="flex-1 py-3 px-4 border-2 border-primary bg-transparent text-gray-800 
                                              rounded-xl font-semibold hover:bg-primary/10 transition-colors duration-200
                                              disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    disabled={isGenerating}
                                >
                                    <ArrowPathIcon className="w-4 h-4" />
                                    <span>다시 생성</span>
                                </button>
                                <button
                                    onClick={handleSaveAndNavigate}
                                    className="flex-2 btn-success flex items-center justify-center gap-2
                                              disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSaving || !generatedContent}
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>저장 중...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckIcon className="w-4 h-4" />
                                            <span>저장하고 확인하기</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* 팁 섹션 */}
                <section className="mb-8">
                    <div className="card p-6 bg-primary/5 border border-primary/30">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            💡 더 좋은 결과를 위한 팁
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">
                                    •
                                </span>
                                목표를 구체적으로 적어주세요 (다이어트, 근력
                                증가 등)
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">
                                    •
                                </span>
                                알레르기나 제한사항이 있다면 꼭 알려주세요
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">
                                    •
                                </span>
                                선호하는 {pageType === "diet" ? "음식" : "운동"}
                                이 있다면 언급해주세요
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">
                                    •
                                </span>
                                현재{" "}
                                {pageType === "diet" ? "식습관" : "운동 경험"}
                                이나 체력 수준을 알려주세요
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}
