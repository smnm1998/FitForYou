'use client';

// 기본 스켈레톤 컴포넌트
export const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}></div>
);

// 모아보기 페이지 전용 스켈레톤 UI
export function CollectionSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 p-5">
            <div className="max-w-2xl mx-auto">
                
                {/* 헤더 스켈레톤 */}
                <header className="flex justify-between items-center mb-6 pt-5">
                    <Skeleton className="h-9 w-32" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-4 h-4 rounded" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                </header>

                {/* 주요 통계 스켈레톤 */}
                <section className="mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="card p-5">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-11 h-11 rounded-xl" />
                                    <div className="flex-1">
                                        <Skeleton className="h-4 w-20 mb-2" />
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 오늘의 추천 스켈레톤 */}
                <section className="mb-6">
                    <Skeleton className="h-6 w-24 mb-4" />
                    <div className="space-y-4">
                        {[1, 2].map((item) => (
                            <div key={item} className="card p-5">
                                <div className="flex items-start gap-3">
                                    <Skeleton className="w-5 h-5 rounded mt-1" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Skeleton className="h-5 w-16 rounded-md" />
                                        </div>
                                        <Skeleton className="h-5 w-48 mb-1" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 빠른 액션 스켈레톤 */}
                <section className="mb-6">
                    <Skeleton className="h-6 w-20 mb-4" />
                    <div className="space-y-3">
                        <div className="card p-4">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="w-6 h-6 rounded" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {[1, 2].map((item) => (
                                <div key={item} className="card p-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <Skeleton className="w-6 h-6 rounded" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 건강 팁 스켈레톤 */}
                <section className="mb-6">
                    <div className="card p-4 bg-primary/5 border border-primary/30">
                        <Skeleton className="h-5 w-28 mb-2" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}