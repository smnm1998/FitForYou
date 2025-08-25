import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./global.css";
import Providers from "@/app/components/providers/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "FitForYou - 맞춤형 건강 관리 시스템",
    description: "AI 기반 개인 맞춤형 식단 및 운동 관리 서비스",
    keywords: "건강관리, 식단, 운동, AI, 맞춤형",
    authors: [{ name: "FitForYou Team" }],
    viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body className={inter.className}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}