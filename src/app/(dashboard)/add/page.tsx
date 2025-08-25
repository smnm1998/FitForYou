'use client';

import { useRouter } from 'next/navigation';

export default function AddPage() {
    const router = useRouter();

    const handleCreateDiet = () => {
        router.push('/create?type=diet');
    };

    const handleCreateWorkout = () => {
        router.push('/create?type=workout');
    };

    const handleConsultation = () => {
        // TODO: 상담 기능 구현 (나중에)
        alert('상담 기능은 준비 중입니다! 🚧');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="max-w-2xl mx-auto px-5 pt-20">
                
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">추가하기</h1>
                    <p className="text-gray-600">AI로 새로운 식단과 운동을 만들어보세요</p>
                </header>

                <div className="space-y-5">
                    
                    {/* 식단 생성 카드 */}
                    <div className="card p-8 hover:shadow-lg transition-all duration-200 hover:transform hover:-translate-y-1">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-4">🍽️</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">새로운 식단 생성</h3>
                            <p className="text-gray-600 leading-relaxed">
                                AI가 당신의 건강 상태와 목표에 맞는<br />
                                맞춤형 일주일 식단을 추천해드려요
                            </p>
                        </div>
                        <button 
                            className="w-full btn-primary"
                            onClick={handleCreateDiet}
                        >
                            🍽️ 식단 만들기
                        </button>
                    </div>

                    {/* 운동 생성 카드 */}
                    <div className="card p-8 hover:shadow-lg transition-all duration-200 hover:transform hover:-translate-y-1">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-4">🏋️</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">새로운 운동 생성</h3>
                            <p className="text-gray-600 leading-relaxed">
                                개인 맞춤 운동 루틴을 만들어보세요<br />
                                체력 수준과 환경에 맞춰 제안해드립니다
                            </p>
                        </div>
                        <button 
                            className="w-full btn-primary"
                            onClick={handleCreateWorkout}
                        >
                            🏋️ 운동 만들기
                        </button>
                    </div>

                    {/* 상담 카드 (미래 기능) */}
                    <div className="card p-8 bg-gray-50 border-gray-200 opacity-75">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-4">💬</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">맞춤 상담하기</h3>
                            <p className="text-gray-600 leading-relaxed">
                                궁금한 것을 자유롭게 물어보세요<br />
                                <span className="text-sm text-gray-500">(준비 중)</span>
                            </p>
                        </div>
                        <button 
                            className="w-full py-4 px-6 bg-gray-300 text-gray-500 rounded-xl font-semibold cursor-not-allowed"
                            onClick={handleConsultation}
                        >
                            🚧 준비 중
                        </button>
                    </div>
                </div>

                {/* 도움말 섹션 */}
                <div className="mt-8 card p-6 bg-primary/5 border border-primary/30">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        💡 사용 가이드
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-primary font-bold">1.</span>
                            원하는 타입(식단/운동)을 선택하세요
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary font-bold">2.</span>
                            목표와 제약사항을 구체적으로 입력하세요
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary font-bold">3.</span>
                            AI가 생성한 계획을 확인하고 저장하세요
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary font-bold">4.</span>
                            저장된 계획은 해당 메뉴에서 언제든 확인 가능해요
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}