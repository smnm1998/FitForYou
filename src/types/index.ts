export interface SignupData {
    userId: string;
    password: string;
    nickname: string;
    gender: "male" | "female";
    height?: number;
    weight?: number;
    disease?: string;
}

export interface SigninData {
    userId: string;
    password: string;
}

export interface UserProfile {
    id: number;
    userId: string;
    nickname: string;
    gender: "male" | "female";
    addInfo?: {
        height?: number;
        weight?: number;
        disease?: string;
    };
    createdAt: Date;
}

export interface ApiResponse<T = unknown> {
    available: boolean;
    success: boolean;
    data?: T;
    message: string;
    error?: string;
}
