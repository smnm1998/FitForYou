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
        // Vercel 배포 시 이미지 최적화 활성화
        unoptimized: false,
        // 허용할 도메인 (필요시)
        remotePatterns: [],
    },

    // 환경 변수 설정
    env: {
        CUSTOM_KEY: process.env.CUSTOM_KEY,
    },

    output: "standalone",
};

module.exports = nextConfig;
