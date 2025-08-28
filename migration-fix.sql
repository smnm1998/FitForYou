-- AiJob 테이블 생성 (프로덕션 DB에 직접 적용용)
-- JobType enum 생성
DO $$ BEGIN
    CREATE TYPE "JobType" AS ENUM ('DIET_GENERATION', 'WORKOUT_GENERATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- JobStatus enum 생성  
DO $$ BEGIN
    CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ai_jobs 테이블 생성
CREATE TABLE IF NOT EXISTS "ai_jobs" (
    "job_id" TEXT NOT NULL,
    "member_id" INTEGER NOT NULL,
    "job_type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "prompt" TEXT NOT NULL,
    "user_profile" JSONB,
    "result" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("job_id")
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS "ai_jobs_status_priority_idx" ON "ai_jobs"("status", "priority");
CREATE INDEX IF NOT EXISTS "ai_jobs_member_id_status_idx" ON "ai_jobs"("member_id", "status");  
CREATE INDEX IF NOT EXISTS "ai_jobs_created_at_idx" ON "ai_jobs"("created_at");

-- 외래키 제약조건 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_jobs_member_id_fkey'
    ) THEN
        ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "user"("member_id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;