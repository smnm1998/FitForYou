import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        return NextResponse.json({
            success: true,
            message: '로그아웃 되었습니다.'
        })
    } catch (error) {
        console.error('Signout Error: ', error)
        return NextResponse.json(
            { success: false, error: '로그아웃 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}