/** @type {import('next').NextConfig} */
const nextConfig = {
    // 타입스크립트 설정
    typescript: {
        // 빌드 시 타입 에러 무시하지 않기
        ignoreBuildErrors: false,
    },

    // ESLint 설정
    eslint: {
        // 빌드 시 ESLint 에러 무시하지 않기
        ignoreDuringBuilds: false,
        // ESLint 설정 디렉토리 지정
        dirs: ["pages", "src"],
    },

    // 이미지 최적화 설정 추가
    images: {
        // 이미지 최적화 유지 (기본값)
        unoptimized: false,
        // 기본 로더 사용 (Vercel의 Image Optimization)
        loader: "default",
        // 이미지 형식 설정
        formats: ["image/avif", "image/webp"],
        // 디바이스 크기 설정
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        // 이미지 크기 설정
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        // 원격 패턴이 비어있어도 명시적으로 선언
        remotePatterns: [],
        // 정적 이미지 import 허용
        disableStaticImages: false,
    },

    // 환경 변수 설정
    env: {
        CUSTOM_KEY: process.env.CUSTOM_KEY,
    },
};

module.exports = nextConfig;
