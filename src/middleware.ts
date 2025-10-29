import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

    console.log(
        "Middleware SECRET:",
        process.env.NEXTAUTH_SECRET ? "Loaded" : "!!! UNDEFINED !!!"
    );

    // 토큰이 없고, 보호된 경로에 접근하여 할 때 로그인 페이지로 리다이렉션
    if (
        !token &&
        pathname !== "/signin" &&
        pathname !== "/signup" &&
        pathname !== "/"
    ) {
        const url = req.nextUrl.clone();
        url.pathname = "/signin";
        return NextResponse.redirect(url);
    }

    // 토큰이 있는데 로그인/회원가입 페이지에 접근하려 할 때 대시보드로 리다이렉션
    if (token && (pathname === "/signin" || pathname === "/signup")) {
        const url = req.nextUrl.clone();
        url.pathname = "/collection";
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
}

// 경로 지정
export const config = {
    matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
