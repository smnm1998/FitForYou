import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    /**
     * `useSession`, `getSession`에서 반환되는 값입니다.
     */
    interface Session {
        user: {
            /** 사용자의 고유 ID */
            id: string;
        } & DefaultSession["user"]; // 기본 타입(name, email, image)을 유지합니다.
    }
}

declare module "next-auth/jwt" {
    /**
     * JWT 콜백에서 반환되는 토큰의 타입입니다.
     */
    interface JWT {
        /** 사용자의 고유 ID */
        id: string;
    }
}
