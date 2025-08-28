import { ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiClient {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${API_BASE_URL}/api${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 204 || response.headers.get('Content-Length') === '0') {
                return { success: true } as ApiResponse<T>;
            }
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error("API Client Error:", error);
            throw error instanceof Error ? error : new Error(`네트워크 에러가 발생했습니다.`);
        }
    }

    // --- 인증관리 ---
    async signUp(userData: any) {
        return this.request('/auth/signup', { method: 'POST', body: JSON.stringify(userData) });
    }
    async signIn(credentials: any) {
        return this.request('/auth/signin', { method: 'POST', body: JSON.stringify(credentials) });
    }
    async checkUserId(userId: string) {
        return this.request('/auth/check-user-id', { method: 'POST', body: JSON.stringify({ userId }) });
    }
    async checkNickname(nickname: string) {
        return this.request('/auth/check-nickname', { method: 'POST', body: JSON.stringify({ nickname }) });
    }

    // --- 사용자 프로필 ---
    async getProfile() {
        return this.request('/user/profile');
    }
    async updateProfile(profileData: any) {
        return this.request('/user/profile', { method: 'PUT', body: JSON.stringify(profileData) });
    }
    async deleteAccount(password: string) {
        return this.request('/user/profile', { method: 'DELETE', body: JSON.stringify({ password }) });
    }

    // --- AI 생성 ---
    async generateDiet(prompt: string, saveToDatabase = false) {
        return this.request('/ai/generate-diet', { method: 'POST', body: JSON.stringify({ prompt, saveToDatabase }) });
    }
    async generateWorkout(prompt: string, saveToDatabase = false) {
        return this.request('/ai/generate-workout', { method: 'POST', body: JSON.stringify({ prompt, saveToDatabase }) });
    }

    // --- 식단 CRUD ---
    async getDiets(params?: { page?: number; limit?: number; }) {
        const searchParams = new URLSearchParams(params as any);
        const endpoint = `/diets?${searchParams.toString()}`;
        return this.request(endpoint);
    }
    async saveDiet(dietData: any) {
        return this.request('/diets', { method: 'POST', body: JSON.stringify(dietData) });
    }
    async getDiet(id: number) {
        return this.request(`/diets/${id}`);
    }
    async updateDiet(id: number, dietData: any) {
        return this.request(`/diets/${id}`, { method: 'PUT', body: JSON.stringify(dietData) });
    }
    async deleteDiet(id: number) {
        return this.request(`/diets/${id}`, { method: 'DELETE' });
    }
    // [추가] 식단 그룹 삭제 메소드
    async deleteDietGroup(data: { ids: (number | string)[] }) {
        return this.request('/diets', {
            method: 'DELETE',
            body: JSON.stringify(data),
        });
    }

    // --- 운동 CRUD ---
    async getWorkouts(params?: { page?: number; limit?: number; }) {
        const searchParams = new URLSearchParams(params as any);
        const endpoint = `/workouts?${searchParams.toString()}`;
        return this.request(endpoint);
    }
    async saveWorkout(workoutData: any) {
        return this.request('/workouts', { method: 'POST', body: JSON.stringify(workoutData) });
    }
    async getWorkout(id: number) {
        return this.request(`/workouts/${id}`);
    }
    async updateWorkout(id: number, workoutData: any) {
        return this.request(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(workoutData) });
    }
    async deleteWorkout(id: number) {
        return this.request(`/workouts/${id}`, { method: 'DELETE' });
    }
    // [추가] 운동 그룹 삭제 메소드
    async deleteWorkoutGroup(data: { ids: (number | string)[] }) {
        return this.request('/workouts', {
            method: 'DELETE',
            body: JSON.stringify(data),
        });
    }

    // --- 통계 ---
    async getDashboardStats() {
        return this.request('/stats/dashboard');
    }
    async getReports(period: string = 'weekly', type: string = 'all') {
        return this.request(`/stats/reports?period=${period}&type=${type}`);
    }

    // --- 작업 관리 ---
    async createJob(data: {
        jobType: 'DIET_GENERATION' | 'WORKOUT_GENERATION';
        prompt: string;
        userProfile?: any;
    }) {
        return this.request('/jobs', { method: 'POST', body: JSON.stringify(data) });
    }
    
    async getJobStatus(jobId: string) {
        return this.request(`/jobs/${jobId}`);
    }
    
    async cancelJob(jobId: string) {
        return this.request(`/jobs/${jobId}`, { method: 'DELETE' });
    }
    
    async saveJobResult(jobId: string) {
        return this.request(`/jobs/${jobId}/save`, { method: 'POST' });
    }
}

export const apiClient = new ApiClient();