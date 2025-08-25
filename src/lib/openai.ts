import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined in environment variables')
}

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// AI 프롬프트 생성 헬퍼 함수들
export interface UserProfile {
    gender: 'male' | 'female'
    height?: number
    weight?: number
    disease?: string
}

export function generateDietPrompt(userProfile: UserProfile, userInput: string): string {
    const { gender, height, weight, disease } = userProfile
    
    const basePrompt = `당신은 전문 영양사입니다. 다음 정보를 바탕으로 맞춤형 일주일 식단을 JSON 형식으로 작성해주세요.

사용자 정보:
- 성별: ${gender === 'male' ? '남성' : '여성'}
${height ? `- 키: ${height}cm` : ''}
${weight ? `- 몸무게: ${weight}kg` : ''}
${disease ? `- 건강 상태/제한사항: ${disease}` : ''}

사용자 요청: ${userInput}

응답은 반드시 다음 JSON 형식으로만 제공해주세요:

{
  "title": "식단 제목 (예: 다이어트 저칼로리 식단)",
  "description": "식단에 대한 간단한 설명",
  "weeklyDiet": [
    {
      "day": "월요일",
      "date": "2025-06-16",
      "mealPlan": {
        "breakfast": "아침식사 메뉴 상세 설명",
        "lunch": "점심식사 메뉴 상세 설명", 
        "dinner": "저녁식사 메뉴 상세 설명",
        "snack": "간식 (선택사항)",
        "totalCalories": 1800
      }
    },
    {
      "day": "화요일",
      "date": "2025-06-17",
      "mealPlan": {
        "breakfast": "아침식사 메뉴",
        "lunch": "점심식사 메뉴", 
        "dinner": "저녁식사 메뉴",
        "snack": "간식",
        "totalCalories": 1750
      }
    },
    {
      "day": "수요일",
      "date": "2025-06-18",
      "mealPlan": {
        "breakfast": "아침식사 메뉴",
        "lunch": "점심식사 메뉴", 
        "dinner": "저녁식사 메뉴",
        "snack": "간식",
        "totalCalories": 1820
      }
    },
    {
      "day": "목요일",
      "date": "2025-06-19",
      "mealPlan": {
        "breakfast": "아침식사 메뉴",
        "lunch": "점심식사 메뉴", 
        "dinner": "저녁식사 메뉴",
        "snack": "간식",
        "totalCalories": 1780
      }
    },
    {
      "day": "금요일",
      "date": "2025-06-20",
      "mealPlan": {
        "breakfast": "아침식사 메뉴",
        "lunch": "점심식사 메뉴", 
        "dinner": "저녁식사 메뉴",
        "snack": "간식",
        "totalCalories": 1800
      }
    },
    {
      "day": "토요일",
      "date": "2025-06-21",
      "mealPlan": {
        "breakfast": "아침식사 메뉴",
        "lunch": "점심식사 메뉴", 
        "dinner": "저녁식사 메뉴",
        "snack": "간식",
        "totalCalories": 1900
      }
    },
    {
      "day": "일요일",
      "date": "2025-06-22",
      "mealPlan": {
        "breakfast": "아침식사 메뉴",
        "lunch": "점심식사 메뉴", 
        "dinner": "저녁식사 메뉴",
        "snack": "간식",
        "totalCalories": 1850
      }
    }
  ],
  "nutritionTips": [
    "영양 조언 1",
    "영양 조언 2", 
    "영양 조언 3"
  ]
}

주의사항:
- 실제 존재하는 한국 음식으로만 구성
- 칼로리는 성별, 키, 몸무게를 고려하여 적절히 설정
- 건강 상태나 제한사항이 있다면 반드시 고려
- 한국인의 식습관에 맞는 메뉴 구성
- 각 식사는 구체적이고 실행 가능한 메뉴로 작성
- JSON 형식 외의 다른 텍스트는 포함하지 마세요`

    return basePrompt
}

export function generateWorkoutPrompt(userProfile: UserProfile, userInput: string): string {
    const { gender, height, weight, disease } = userProfile
    
    const basePrompt = `당신은 전문 트레이너입니다. 다음 정보를 바탕으로 맞춤형 일주일 운동 계획을 JSON 형식으로 작성해주세요.

사용자 정보:
- 성별: ${gender === 'male' ? '남성' : '여성'}
${height ? `- 키: ${height}cm` : ''}
${weight ? `- 몸무게: ${weight}kg` : ''}
${disease ? `- 건강 상태/제한사항: ${disease}` : ''}

사용자 요청: ${userInput}

응답은 반드시 다음 JSON 형식으로만 제공해주세요:

{
  "title": "운동 계획 제목 (예: 전신 근력 강화 프로그램)",
  "description": "운동 계획에 대한 간단한 설명",
  "weeklyWorkout": [
    {
      "day": "월요일",
      "date": "2025-06-16",
      "workoutPlan": {
        "type": "전신 근력 운동",
        "duration": "45분",
        "intensity": "medium",
        "targetMuscles": ["가슴", "등", "하체"],
        "exercises": [
          {
            "name": "푸시업",
            "sets": 3,
            "reps": "12-15회",
            "rest": "1분",
            "description": "운동 설명"
          },
          {
            "name": "스쿼트",
            "sets": 4,
            "reps": "15-20회",
            "rest": "90초",
            "description": "운동 설명"
          }
        ],
        "estimatedCalories": 350
      }
    },
    {
      "day": "화요일",
      "date": "2025-06-17",
      "workoutPlan": {
        "type": "유산소 운동",
        "duration": "30분",
        "intensity": "low",
        "targetMuscles": ["심폐지구력"],
        "exercises": [
          {
            "name": "조깅",
            "duration": "20분",
            "description": "가벼운 조깅"
          },
          {
            "name": "스트레칭",
            "duration": "10분",
            "description": "전신 스트레칭"
          }
        ],
        "estimatedCalories": 250
      }
    },
    {
      "day": "수요일",
      "date": "2025-06-18",
      "workoutPlan": {
        "type": "상체 근력 운동",
        "duration": "40분", 
        "intensity": "medium",
        "targetMuscles": ["가슴", "어깨", "팔"],
        "exercises": [
          {
            "name": "푸시업",
            "sets": 3,
            "reps": "10-12회",
            "rest": "1분",
            "description": "운동 설명"
          }
        ],
        "estimatedCalories": 300
      }
    },
    {
      "day": "목요일",
      "date": "2025-06-19",
      "workoutPlan": {
        "type": "휴식일",
        "duration": "20분",
        "intensity": "low",
        "targetMuscles": ["회복"],
        "exercises": [
          {
            "name": "가벼운 스트레칭",
            "duration": "20분",
            "description": "근육 이완"
          }
        ],
        "estimatedCalories": 100
      }
    },
    {
      "day": "금요일",
      "date": "2025-06-20",
      "workoutPlan": {
        "type": "하체 근력 운동",
        "duration": "45분",
        "intensity": "medium",
        "targetMuscles": ["허벅지", "엉덩이", "종아리"],
        "exercises": [
          {
            "name": "스쿼트",
            "sets": 4,
            "reps": "15-20회",
            "rest": "90초",
            "description": "운동 설명"
          }
        ],
        "estimatedCalories": 380
      }
    },
    {
      "day": "토요일",
      "date": "2025-06-21",
      "workoutPlan": {
        "type": "전신 순환 운동",
        "duration": "50분",
        "intensity": "high",
        "targetMuscles": ["전신"],
        "exercises": [
          {
            "name": "버피",
            "sets": 3,
            "reps": "8-10회",
            "rest": "2분",
            "description": "운동 설명"
          }
        ],
        "estimatedCalories": 450
      }
    },
    {
      "day": "일요일",
      "date": "2025-06-22",
      "workoutPlan": {
        "type": "휴식일",
        "duration": "30분",
        "intensity": "low",
        "targetMuscles": ["회복"],
        "exercises": [
          {
            "name": "요가",
            "duration": "30분",
            "description": "전신 요가"
          }
        ],
        "estimatedCalories": 150
      }
    }
  ],
  "workoutTips": [
    "운동 조언 1",
    "운동 조언 2",
    "운동 조언 3"
  ]
}

주의사항:
- intensity는 "low", "medium", "high" 중 하나만 사용
- 사용자의 체력 수준과 건강 상태 반드시 고려
- 건강 제한사항이 있다면 반드시 고려
- 점진적 강도 증가 원칙 적용
- 휴식과 회복 시간 적절히 배치
- 집에서 할 수 있는 운동 위주로 구성
- 각 운동은 구체적이고 실행 가능한 내용으로 작성
- JSON 형식 외의 다른 텍스트는 포함하지 마세요`

    return basePrompt
}

// AI 응답 파싱 헬퍼
export function parseAIResponse(response: string) {
    try {
        // JSON 블록 추출 (```json...``` 형태나 순수 JSON)
        let jsonString = response.trim()
        
        // ```json...``` 형태에서 JSON 추출
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
            jsonString = jsonMatch[1].trim()
        }
        
        // 혹은 { ... } 블록 찾기
        const braceMatch = response.match(/\{[\s\S]*\}/)
        if (braceMatch && !jsonMatch) {
            jsonString = braceMatch[0]
        }
        
        // JSON 파싱
        const parsed = JSON.parse(jsonString)
        
        // 기본 구조 검증
        if (!parsed.title || !parsed.description) {
            throw new Error('Invalid response structure: missing title or description')
        }
        
        return parsed
    } catch (error) {
        console.error('AI 응답 파싱 오류:', error)
        console.error('원본 응답:', response)
        throw new Error('AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.')
    }
}