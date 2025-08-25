import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function authMiddleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    })

    if (!token) {
        return NextResponse.json(
            { success: false, error: '인증이 필요합니다.' },
            { status: 401 }
        )
    }

    return token
}

export function withAuth(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
    return async (request: NextRequest, context: any) => {
        const authResult = await authMiddleware(request)

        if (authResult instanceof NextResponse) {
            return authResult
        }

        context.user = authResult
        return handler(request, context)
    }
}