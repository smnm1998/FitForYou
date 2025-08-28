import { prisma } from '@/lib/prisma';
import { openai, generateDietPrompt, generateWorkoutPrompt, parseAIResponse } from '@/lib/openai';
import type { JobType, JobStatus } from '@prisma/client';

export interface JobProcessor {
    processJob(jobId: string): Promise<void>;
    getJobStatus(jobId: string): Promise<JobStatusResponse>;
    createJob(userId: number, jobType: JobType, prompt: string, userProfile?: any): Promise<string>;
}

export interface JobStatusResponse {
    id: string;
    status: JobStatus;
    result?: any;
    error?: string;
    progress?: number;
    createdAt: Date;
    completedAt?: Date;
}

class AIJobProcessor implements JobProcessor {
    private processingJobs = new Set<string>();

    async createJob(userId: number, jobType: JobType, prompt: string, userProfile?: any): Promise<string> {
        const job = await prisma.aiJob.create({
            data: {
                userId,
                jobType,
                prompt: prompt.trim(),
                userProfile: userProfile || null,
                status: 'PENDING',
                priority: 1,
            },
        });

        // 백그라운드에서 작업 시작 (응답을 기다리지 않음)
        this.processJobInBackground(job.id).catch(error => {
            console.error(`Background job ${job.id} failed:`, error);
        });

        return job.id;
    }

    async getJobStatus(jobId: string): Promise<JobStatusResponse> {
        const job = await prisma.aiJob.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            throw new Error('Job not found');
        }

        return {
            id: job.id,
            status: job.status,
            result: job.result,
            error: job.error || undefined,
            progress: this.calculateProgress(job.status),
            createdAt: job.createdAt,
            completedAt: job.completedAt || undefined,
        };
    }

    private calculateProgress(status: JobStatus): number {
        switch (status) {
            case 'PENDING': return 0;
            case 'PROCESSING': return 50;
            case 'COMPLETED': return 100;
            case 'FAILED': 
            case 'CANCELLED': return 0;
            default: return 0;
        }
    }

    private async processJobInBackground(jobId: string): Promise<void> {
        // 중복 처리 방지
        if (this.processingJobs.has(jobId)) {
            return;
        }

        this.processingJobs.add(jobId);

        try {
            await this.processJob(jobId);
        } finally {
            this.processingJobs.delete(jobId);
        }
    }

    async processJob(jobId: string): Promise<void> {
        const job = await prisma.aiJob.findUnique({
            where: { id: jobId },
            include: { user: { include: { addInfo: true } } },
        });

        if (!job) {
            console.error(`Job ${jobId} not found`);
            return;
        }

        if (job.status !== 'PENDING') {
            console.log(`Job ${jobId} already processed (status: ${job.status})`);
            return;
        }

        // 최대 재시도 체크
        if (job.attempts >= job.maxRetries) {
            await prisma.aiJob.update({
                where: { id: jobId },
                data: {
                    status: 'FAILED',
                    error: 'Maximum retry attempts exceeded',
                    updatedAt: new Date(),
                },
            });
            return;
        }

        try {
            // 작업 상태를 PROCESSING으로 변경
            await prisma.aiJob.update({
                where: { id: jobId },
                data: {
                    status: 'PROCESSING',
                    startedAt: new Date(),
                    attempts: { increment: 1 },
                    updatedAt: new Date(),
                },
            });

            console.log(`🚀 Processing job ${jobId} (${job.jobType})`);

            // 사용자 프로필 구성
            const userProfile = {
                gender: job.user.gender,
                height: job.user.addInfo?.height ?? undefined,
                weight: job.user.addInfo?.weight ?? undefined,
                disease: job.user.addInfo?.disease ?? undefined,
            };

            let aiPrompt: string;
            let promptType: string;

            // 작업 타입에 따른 프롬프트 생성
            switch (job.jobType) {
                case 'DIET_GENERATION':
                    aiPrompt = generateDietPrompt(userProfile, job.prompt);
                    promptType = 'diet';
                    break;
                case 'WORKOUT_GENERATION':
                    aiPrompt = generateWorkoutPrompt(userProfile, job.prompt);
                    promptType = 'workout';
                    break;
                default:
                    throw new Error(`Unsupported job type: ${job.jobType}`);
            }

            // OpenAI API 호출 (최적화된 설정)
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo", // 더 빠른 모델 사용
                messages: [
                    {
                        role: "system",
                        content: this.getSystemPrompt(job.jobType),
                    },
                    {
                        role: "user",
                        content: aiPrompt,
                    },
                ],
                temperature: 0.5, // 더 일관된 응답
                max_tokens: 2000, // 토큰 수 최적화
                top_p: 0.9,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            const aiResponse = completion.choices[0].message.content;

            if (!aiResponse) {
                throw new Error('Empty response from OpenAI');
            }

            console.log(`✅ OpenAI response received for job ${jobId} (${aiResponse.length} chars)`);

            // AI 응답 파싱
            const parsedResult = parseAIResponse(aiResponse);

            // AI 채팅 기록 저장
            try {
                await prisma.aiChat.create({
                    data: {
                        userId: job.userId,
                        promptType: promptType as any,
                        userInput: job.prompt,
                        aiResponse: JSON.stringify(parsedResult),
                    },
                });
            } catch (chatError) {
                console.error('Failed to save AI chat history:', chatError);
                // 기록 저장 실패해도 계속 진행
            }

            // 작업 완료 처리
            await prisma.aiJob.update({
                where: { id: jobId },
                data: {
                    status: 'COMPLETED',
                    result: parsedResult,
                    completedAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            console.log(`✅ Job ${jobId} completed successfully`);

        } catch (error: any) {
            console.error(`❌ Job ${jobId} failed:`, error);

            const errorMessage = this.getErrorMessage(error);

            await prisma.aiJob.update({
                where: { id: jobId },
                data: {
                    status: 'FAILED',
                    error: errorMessage,
                    updatedAt: new Date(),
                },
            });
        }
    }

    private getSystemPrompt(jobType: JobType): string {
        switch (jobType) {
            case 'DIET_GENERATION':
                return `당신은 전문 영양사입니다. 사용자의 건강상태와 요구사항에 맞는 맞춤형 일주일 식단을 JSON 형식으로만 제공합니다.
                    
                    중요한 규칙:
                    1. 반드시 유효한 JSON 형식으로만 응답
                    2. 실제 존재하는 한국 음식으로만 구성
                    3. 건강 상태/제한사항 반드시 고려
                    4. 칼로리는 성별, 키, 몸무게 고려하여 설정
                    5. JSON 외의 다른 텍스트는 절대 포함하지 마세요`;
            
            case 'WORKOUT_GENERATION':
                return `당신은 전문 트레이너입니다. 사용자의 체력과 요구사항에 맞는 맞춤형 일주일 운동계획을 JSON 형식으로만 제공합니다.
                    
                    중요한 규칙:
                    1. 반드시 유효한 JSON 형식으로만 응답
                    2. 사용자의 체력 수준과 건강 상태 반드시 고려
                    3. 점진적 강도 증가 원칙 적용
                    4. 휴식과 회복 시간 적절히 배치
                    5. JSON 외의 다른 텍스트는 절대 포함하지 마세요`;
            
            default:
                return 'You are a helpful AI assistant.';
        }
    }

    private getErrorMessage(error: any): string {
        if (error.code === "invalid_api_key") {
            return "AI 서비스 설정에 문제가 있습니다.";
        }

        if (error.code === "rate_limit_exceeded") {
            return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
        }

        if (error.code === "context_length_exceeded") {
            return "요청이 너무 깁니다. 더 간단하게 입력해주세요.";
        }

        if (error.message?.includes("network") || error.message?.includes("timeout")) {
            return "네트워크 오류가 발생했습니다. 다시 시도해주세요.";
        }

        return error.message || "처리 중 오류가 발생했습니다.";
    }

    // 실패한 작업 재시도
    async retryFailedJobs(limit: number = 10): Promise<void> {
        const failedJobs = await prisma.aiJob.findMany({
            where: {
                status: 'FAILED',
                attempts: { lt: prisma.aiJob.fields.maxRetries },
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });

        console.log(`Found ${failedJobs.length} failed jobs to retry`);

        for (const job of failedJobs) {
            try {
                await prisma.aiJob.update({
                    where: { id: job.id },
                    data: {
                        status: 'PENDING',
                        error: null,
                        updatedAt: new Date(),
                    },
                });

                // 백그라운드에서 재처리
                this.processJobInBackground(job.id).catch(error => {
                    console.error(`Retry job ${job.id} failed:`, error);
                });
            } catch (error) {
                console.error(`Failed to retry job ${job.id}:`, error);
            }
        }
    }

    // 오래된 완료된 작업 정리 (30일 이상)
    async cleanupOldJobs(): Promise<void> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await prisma.aiJob.deleteMany({
            where: {
                status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] },
                completedAt: { lt: thirtyDaysAgo },
            },
        });

        console.log(`Cleaned up ${result.count} old jobs`);
    }
}

// 싱글톤 인스턴스
export const jobProcessor = new AIJobProcessor();