# 🍽️ FitForYou (F4Y) - AI 맞춤형 건강 관리 시스템

> **내 하루와 건강을 나답게, 모든 것을 당신에게 핏하게**

AI 기술을 활용한 개인 맞춤형 식단 및 운동 관리 서비스입니다. 최소한의 개인정보로 최대한의 맞춤형 건강 관리 경험을 제공합니다.

<p align="center">
  <img src="/docs/fitForYouIntro.png" alt="Project Screenshot" width="150">
</p>

## 🌟 주요 기능

### 🤖 AI 기반 맞춤형 추천
- **개인화된 식단 생성**: 사용자의 건강 상태, 선호도, 목표를 고려한 일주일 식단 계획
- **맞춤형 운동 루틴**: 체력 수준과 환경에 맞는 개인별 운동 프로그램
- **실시간 AI 상담**: OpenAI GPT-4를 활용한 건강 관련 질의응답

### 📊 통합 건강 관리
- **대시보드**: 식단/운동 통계 및 진행 상황 모니터링
- **저장 및 관리**: 생성된 식단과 운동 계획의 체계적 관리
- **진행 추적**: 주간/월간 활동 내역 및 칼로리 소모량 분석

### 🔒 프라이버시 중심 설계
- **최소 데이터 수집**: 필수 정보만으로 서비스 제공
- **안전한 인증**: NextAuth.js 기반 보안 시스템
- **데이터 소유권**: 사용자 중심의 데이터 관리

## 🚀 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: 
  - React Query (서버 상태)
  - Zustand (클라이언트 상태)
- **UI Components**: Headless UI + Custom Components
- **Icons**: Heroicons
- **Forms**: React Hook Form + Yup

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **AI Integration**: OpenAI API (GPT-4)

### DevOps & Tools
- **Package Manager**: npm & yarn
- **Build Tool**: Vite (Dev), Next.js (Production)
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Deployment**: Vercel (Frontend), Railway/PlanetScale (Database)

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (dashboard)/       # 메인 앱 페이지
│   ├── api/               # API Routes
│   ├── components/        # 공통 컴포넌트
│   └── globals.css        # 전역 스타일
├── lib/                   # 유틸리티 라이브러리
│   ├── auth.ts           # NextAuth 설정
│   ├── prisma.ts         # Prisma 클라이언트
│   ├── openai.ts         # OpenAI API 설정
│   └── api-client.ts     # API 클라이언트
├── types/                 # TypeScript 타입 정의
├── styles/               # SCSS 스타일 파일
└── prisma/               # 데이터베이스 스키마
    └── schema.prisma
```

## 🛠️ 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-username/fitforyou.git
cd fitforyou
```

### 2. 의존성 설치
```bash
npm install
```

또는

```bash
yarn install
```

### 3. 환경변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/fitforyou"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. 데이터베이스 설정
```bash
# Prisma 마이그레이션 실행
npx prisma migrate dev

# 데이터베이스 시드 (선택사항)
npx prisma db seed
```

### 5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📱 주요 페이지

### 🏠 메인 대시보드 (`/collection`)
- 저장된 식단/운동 통계
- 오늘의 추천 계획
- 빠른 액션 버튼

### 🍽️ 식단 관리 (`/diet`)
- 저장된 식단 목록 조회
- 일주일 식단 상세 보기
- 식단 삭제 및 관리

### 🏋️ 운동 관리 (`/workout`)
- 저장된 운동 계획 조회
- 운동 루틴 상세 정보
- 운동 일정 관리

### ➕ 콘텐츠 생성 (`/add`, `/create`)
- AI 식단 생성 요청
- AI 운동 계획 생성
- 맞춤형 프롬프트 입력

### 👤 프로필 관리 (`/profile`)
- 개인정보 수정
- 신체 정보 업데이트
- 계정 설정

## 🔧 API 엔드포인트

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/signin` - 로그인
- `POST /api/auth/check-user-id` - 아이디 중복 확인

### AI 생성
- `POST /api/ai/generate-diet` - AI 식단 생성
- `POST /api/ai/generate-workout` - AI 운동 생성

### 데이터 관리
- `GET /api/diets` - 식단 목록 조회
- `DELETE /api/diets` - 식단 그룹 삭제
- `GET /api/workouts` - 운동 목록 조회
- `DELETE /api/workouts` - 운동 그룹 삭제

### 사용자
- `GET /api/user/profile` - 프로필 조회
- `PUT /api/user/profile` - 프로필 수정
- `DELETE /api/user/profile` - 회원 탈퇴

### 통계
- `GET /api/stats/dashboard` - 대시보드 통계
- `GET /api/stats/reports` - 상세 리포트

## 🎨 디자인 시스템

### 색상 팔레트
```scss
$primary-color: #f0fd82;      // 메인 브랜드 색상 (연한 노랑)
$primary-hover: #e6f066;      // 호버 상태
$success-color: #2ed573;      // 성공/완료 (초록)
$error-color: #ff4757;        // 오류/경고 (빨강)
$text-color: #333;            // 기본 텍스트
```

### 반응형 브레이크포인트
```scss
$mobile-s: 320px;
$mobile: 375px;
$mobile-l: 480px;
$tablet: 768px;
```

## 🚀 배포

### Vercel 배포 (권장)
1. Vercel 계정에 프로젝트 연결
2. 환경변수 설정
3. 자동 배포 설정

### 수동 빌드
```bash
npm run build
npm start
```

## 🧪 테스트

```bash
# 타입 체크
npm run type-check

# 린팅
npm run lint

# 빌드 테스트
npm run build
```

## 📋 TODO & 로드맵

### v1.1 (예정)
- [ ] 식단 이미지 분석 기능
- [ ] 운동 영상 가이드 제공
- [ ] 푸시 알림 시스템
- [ ] 칼로리 추적 개선

### v1.2 (예정)
- [ ] 소셜 기능 (친구 추가, 공유)
- [ ] 커뮤니티 기능
- [ ] 전문가 상담 연결
- [ ] 웨어러블 기기 연동

### v2.0 (장기)
- [ ] 모바일 앱 (React Native)
- [ ] 음성 인터페이스
- [ ] AR/VR 운동 가이드
- [ ] 개인화 AI 어시스턴트

### 개발 가이드라인
- TypeScript 사용 필수
- ESLint 규칙 준수
- 컴포넌트는 재사용 가능하게 설계
- API는 RESTful 설계 원칙 따름
- 반응형 디자인 필수

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 팀

### 개발팀 모구 (AI융합학과)
- **이세민** - Full Stack Developer & Project Lead
- **손민섭** - Backend Developer
- **정예린** - UI/UX

### 기술 스택 의사결정
- **Frontend**: 사용자 경험 최적화를 위한 React + TypeScript
- **Backend**: 빠른 개발을 위한 Next.js Full-Stack
- **Database**: 안정성과 성능을 위한 MySQL + Prisma
- **AI**: 최신 AI 기술 활용을 위한 OpenAI GPT-4

## 📞 문의

- **Email**: dltpals7498@gmail.com
- **GitHub**: [프로젝트 저장소](https://github.com/your-username/fitforyou)
- **Issues**: [버그 리포트 & 기능 요청](https://github.com/your-username/fitforyou/issues)

---

**Made with ❤️ by Team 모구**

*"건강한 라이프스타일의 시작, FitForYou와 함께하세요!"*
