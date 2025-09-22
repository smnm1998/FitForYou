import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, generateWorkoutPrompt, parseAIResponse } from "@/lib/openai";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { prompt, saveToDatabase = false } = body;

        if (!prompt || prompt.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: "운동 요청사항을 입력해주세요." },
                { status: 400 }
            );
        }

        if (prompt.length > 1000) {
            return NextResponse.json(
                {
                    success: false,
                    error: "요청사항이 너무 깁니다. 1000자 이내로 입력해주세요.",
                },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        // 사용자 프로필 정보 조회
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { addInfo: true },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "사용자 정보를 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        // 사용자 프로필 구성 (null 값을 undefined로 변환)
        const userProfile = {
            gender: user.gender,
            height: user.addInfo?.height ?? undefined, // null을 undefined로 변환
            weight: user.addInfo?.weight ?? undefined, // null을 undefined로 변환
            disease: user.addInfo?.disease ?? undefined, // null을 undefined로 변환
        };

        console.log("👤 사용자 프로필:", userProfile);
        console.log("📝 사용자 요청:", prompt.substring(0, 100) + "...");

        // AI 프롬프트 생성
        const aiPrompt = generateWorkoutPrompt(userProfile, prompt.trim());

        console.log("🤖 OpenAI API 호출 시작...");

        // OpenAI API 호출
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                {
                    role: "system",
                    content: `당신은 전문 트레이너입니다. 사용자의 건강상태와 요구사항에 맞는 맞춤형 일주일 운동 계획을 JSON 형식으로만 제공합니다.
                    
                    중요한 규칙:
                    1. 반드시 유효한 JSON 형식으로만 응답
                    2. intensity는 "low", "medium", "high" 중 하나만 사용
                    3. 건강 상태/제한사항 반드시 고려
                    4. 점진적 강도 증가 원칙 적용
                    5. 휴식과 회복 시간 적절히 배치
                    6. JSON 외의 다른 텍스트는 절대 포함하지 마세요`,
                },
                {
                    role: "user",
                    content: aiPrompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 4000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });

        const aiResponse = completion.choices[0].message.content;

        if (!aiResponse) {
            console.error("❌ OpenAI 응답이 비어있음");
            return NextResponse.json(
                {
                    success: false,
                    error: "AI 응답을 받지 못했습니다. 다시 시도해주세요.",
                },
                { status: 500 }
            );
        }

        console.log("✅ OpenAI 응답 받음 (길이:", aiResponse.length, ")");
        console.log("📄 응답 미리보기:", aiResponse.substring(0, 200) + "...");

        // AI 응답 파싱
        let parsedWorkout;
        try {
            parsedWorkout = parseAIResponse(aiResponse);
            console.log("✅ AI 응답 파싱 성공");
        } catch (parseError) {
            console.error("❌ AI 응답 파싱 실패:", parseError);
            console.error("원본 응답:", aiResponse);
            return NextResponse.json(
                {
                    success: false,
                    error: "AI 응답을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.",
                },
                { status: 500 }
            );
        }

        // AI 채팅 기록 저장
        try {
            await prisma.aiChat.create({
                data: {
                    userId,
                    promptType: "workout",
                    userInput: prompt.trim(),
                    aiResponse: JSON.stringify(parsedWorkout),
                },
            });
            console.log("💾 AI 채팅 기록 저장 완료");
        } catch (chatError) {
            console.error("❌ AI 채팅 기록 저장 실패:", chatError);
            // 기록 저장 실패해도 계속 진행
        }

        // 운동을 데이터베이스에 저장 (옵션)
        if (saveToDatabase && parsedWorkout.weeklyWorkout) {
            try {
                console.log("💾 운동 데이터베이스 저장 시작...");

                // AI가 생성한 제목을 메타데이터로 함께 저장하기 위해
                // 첫 번째 운동에 제목 정보를 targetMuscles 필드에 메타데이터로 저장
                const workoutSavePromises = parsedWorkout.weeklyWorkout.map(
                    async (dayWorkout: any, index: number) => {
                        const date = new Date();
                        date.setDate(date.getDate() + index); // 오늘부터 7일

                        // 첫 번째 운동(오늘)에 AI 제목 정보를 저장
                        let targetMusclesData = JSON.stringify(
                            dayWorkout.workoutPlan?.targetMuscles || []
                        );
                        if (index === 0 && parsedWorkout.title) {
                            // 첫 번째 레코드에만 메타데이터 포함
                            const metadata = {
                                aiTitle: parsedWorkout.title,
                                aiDescription: parsedWorkout.description,
                                aiAdvice: parsedWorkout.advice,
                                originalTargetMuscles:
                                    dayWorkout.workoutPlan?.targetMuscles || [],
                            };
                            targetMusclesData = JSON.stringify(metadata);
                        }

                        return prisma.savedWorkout.create({
                            data: {
                                userId,
                                date,
                                workoutType: dayWorkout.workoutPlan?.type || "",
                                duration:
                                    dayWorkout.workoutPlan?.duration || "",
                                intensity:
                                    dayWorkout.workoutPlan?.intensity ||
                                    "medium",
                                targetMuscles: targetMusclesData,
                                exercises: JSON.stringify(
                                    dayWorkout.workoutPlan?.exercises || []
                                ),
                                estimatedCalories:
                                    dayWorkout.workoutPlan?.estimatedCalories ||
                                    0,
                            },
                        });
                    }
                );

                await Promise.all(workoutSavePromises);
                console.log("✅ 운동 데이터베이스 저장 완료");
            } catch (saveError) {
                console.error("❌ 운동 저장 실패:", saveError);
                // 저장 실패해도 생성된 운동은 반환
            }
        }

        return NextResponse.json({
            success: true,
            message: "맞춤형 운동 계획이 성공적으로 생성되었습니다! 🎉",
            data: {
                workout: parsedWorkout,
                saved: saveToDatabase,
                userProfile: {
                    gender: userProfile.gender,
                    hasPhysicalInfo: !!(
                        userProfile.height && userProfile.weight
                    ),
                    hasHealthInfo: !!userProfile.disease,
                },
            },
        });
    } catch (error: any) {
        console.error("🚨 AI 운동 생성 오류:", error);

        // OpenAI API 에러 구체적 처리
        if (error.code === "invalid_api_key") {
            return NextResponse.json(
                { success: false, error: "AI 서비스 설정에 문제가 있습니다." },
                { status: 500 }
            );
        }

        if (error.code === "rate_limit_exceeded") {
            return NextResponse.json(
                {
                    success: false,
                    error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
                },
                { status: 429 }
            );
        }

        if (error.code === "context_length_exceeded") {
            return NextResponse.json(
                {
                    success: false,
                    error: "요청이 너무 깁니다. 더 간단하게 입력해주세요.",
                },
                { status: 400 }
            );
        }

        if (
            error.message?.includes("network") ||
            error.message?.includes("timeout")
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: "운동 계획 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
            },
            { status: 500 }
        );
    }
}
