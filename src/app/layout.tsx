import type { Metadata, Viewport } from "next";
import "./global.css";
import Providers from "@/app/components/providers/Providers";

// Viewport 설정 분리
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    title: "FitForYou - 맞춤형 건강 관리 시스템",
    description: "AI 기반 개인 맞춤형 식단 및 운동 관리 서비스",
    keywords: "건강관리, 식단, 운동, AI, 맞춤형",
    authors: [{ name: "FitForYou Team" }],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
