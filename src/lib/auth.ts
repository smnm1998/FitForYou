import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
    debug: process.env.NODE_ENV === "development",
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                userId: { label: "User ID", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.userId || !credentials?.password) {
                        return null;
                    }

                    const user = await prisma.user.findUnique({
                        where: { userId: credentials.userId },
                        include: { addInfo: true },
                    });

                    if (!user) {
                        return null;
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        return null;
                    }

                    return {
                        id: user.id.toString(),
                        email: user.userId,
                        name: user.nickname,
                        image: null,
                    };
                } catch (error) {
                    console.error("❌ 인증 오류:", error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/signin",
    },
    callbacks: {
        async redirect({ url, baseUrl }) {
            // 로그인 성공 후 /collection으로 리다이렉트
            if (url.startsWith("/") || url.startsWith(baseUrl)) {
                return `${baseUrl}/collection`;
            }
            return baseUrl;
        },
        async jwt({ token, user }) {
            if (user) {
                token.userId = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.userId as string;
            }
            return session;
        },
    },
};
