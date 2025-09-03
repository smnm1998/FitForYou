import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

export interface JobStatus {
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    result?: any;
    error?: string;
    progress?: number;
    createdAt: Date;
    completedAt?: Date;
}

export interface UseAsyncJobOptions {
    onSuccess?: (result: any) => void;
    onError?: (error: string) => void;
    onStatusChange?: (status: JobStatus) => void;
    pollingInterval?: number;
    maxPollingTime?: number;
}

export function useAsyncJob(options: UseAsyncJobOptions = {}) {
    const {
        onSuccess,
        onError,
        onStatusChange,
        pollingInterval = 2000,
        maxPollingTime = 30000, // 30초 (Vercel 무료 버전 제한 고려)
    } = options;

    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 폴링 타이머 관리
    const [pollingTimer, setPollingTimer] = useState<NodeJS.Timeout | null>(null);
    const [timeoutTimer, setTimeoutTimer] = useState<NodeJS.Timeout | null>(null);

    // 폴링 정리
    const clearPolling = useCallback(() => {
        if (pollingTimer) {
            clearInterval(pollingTimer);
            setPollingTimer(null);
        }
        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            setTimeoutTimer(null);
        }
    }, [pollingTimer, timeoutTimer]);

    // 작업 상태 폴링 시작
    const startPolling = useCallback((jobId: string) => {
        clearPolling();

        console.log(`🔄 작업 폴링 시작: ${jobId}`);

        const pollTimer = setInterval(async () => {
            try {
                const response = await apiClient.getJobStatus(jobId);
                
                if (response.success) {
                    const status = response.data as JobStatus;
                    setJobStatus(status);
                    onStatusChange?.(status);

                    if (status.status === 'COMPLETED') {
                        clearPolling();
                        setIsLoading(false);
                        
                        if (status.result) {
                            onSuccess?.(status.result);
                            toast.success('작업이 완료되었습니다! 🎉');
                        }
                    } else if (status.status === 'FAILED') {
                        clearPolling();
                        setIsLoading(false);
                        const errorMsg = status.error || '작업이 실패했습니다.';
                        setError(errorMsg);
                        onError?.(errorMsg);
                        toast.error('작업이 실패했습니다.');
                    } else if (status.status === 'CANCELLED') {
                        clearPolling();
                        setIsLoading(false);
                        toast('작업이 취소되었습니다.', { icon: '🚫' });
                    }
                }
            } catch (error) {
                console.error('폴링 오류:', error);
                // 폴링 오류는 일시적일 수 있으므로 계속 시도
            }
        }, pollingInterval);

        const timeoutId = setTimeout(() => {
            clearPolling();
            setIsLoading(false);
            const timeoutError = '처리 시간이 너무 오래 걸립니다. 다시 시도해주세요.';
            setError(timeoutError);
            onError?.(timeoutError);
            toast.error(timeoutError);
        }, maxPollingTime);

        setPollingTimer(pollTimer);
        setTimeoutTimer(timeoutId);
    }, [clearPolling, onSuccess, onError, onStatusChange, pollingInterval, maxPollingTime]);

    // 새로운 작업 생성
    const createJob = useCallback(async (
        jobType: 'DIET_GENERATION' | 'WORKOUT_GENERATION',
        prompt: string,
        userProfile?: any
    ) => {
        if (isLoading) {
            toast.error('이미 진행 중인 작업이 있습니다.');
            return null;
        }

        setIsLoading(true);
        setError(null);
        setJobStatus(null);
        setCurrentJobId(null);

        try {
            console.log(`🚀 ${jobType} 작업 생성 시작:`, prompt.substring(0, 50) + '...');

            const response = await apiClient.createJob({
                jobType,
                prompt: prompt.trim(),
                userProfile,
            });

            if (response.success) {
                const jobId = (response.data as any).jobId;
                setCurrentJobId(jobId);
                
                toast.success(
                    `${jobType === 'DIET_GENERATION' ? '식단' : '운동 계획'} 생성이 시작되었습니다!`
                );
                
                // 폴링 시작
                startPolling(jobId);
                
                return jobId;
            } else {
                throw new Error(response.error || '작업 생성에 실패했습니다.');
            }
        } catch (err: any) {
            console.error('❌ 작업 생성 오류:', err);
            setIsLoading(false);
            
            const errorMessage = err.message || '작업 생성 중 오류가 발생했습니다.';
            setError(errorMessage);
            onError?.(errorMessage);
            toast.error(errorMessage);
            
            return null;
        }
    }, [isLoading, startPolling, onError]);

    // 현재 작업 취소
    const cancelJob = useCallback(async () => {
        if (!currentJobId) return false;

        try {
            const response = await apiClient.cancelJob(currentJobId);
            
            if (response.success) {
                clearPolling();
                setIsLoading(false);
                toast('작업이 취소되었습니다.', { icon: '🚫' });
                return true;
            } else {
                toast.error('작업 취소에 실패했습니다.');
                return false;
            }
        } catch (error) {
            console.error('작업 취소 오류:', error);
            toast.error('작업 취소 중 오류가 발생했습니다.');
            return false;
        }
    }, [currentJobId, clearPolling]);

    // 작업 결과 저장
    const saveJobResult = useCallback(async () => {
        if (!currentJobId || !jobStatus?.result) return null;

        try {
            const response = await apiClient.saveJobResult(currentJobId);
            
            if (response.success) {
                toast.success('저장이 완료되었습니다! 💾');
                return response;
            } else {
                throw new Error(response.error || '저장에 실패했습니다.');
            }
        } catch (error: any) {
            console.error('결과 저장 오류:', error);
            toast.error('저장 중 오류가 발생했습니다.');
            return null;
        }
    }, [currentJobId, jobStatus]);

    // 컴포넌트 언마운트시 정리
    useEffect(() => {
        return () => {
            clearPolling();
        };
    }, [clearPolling]);

    return {
        // 상태
        currentJobId,
        jobStatus,
        isLoading,
        error,
        
        // 액션
        createJob,
        cancelJob,
        saveJobResult,
        
        // 유틸리티
        clearPolling,
    };
}