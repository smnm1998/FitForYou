-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "PromptType" AS ENUM ('diet', 'workout', 'general');

-- CreateEnum
CREATE TYPE "Intensity" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "user" (
    "member_id" SERIAL NOT NULL,
    "user_id" VARCHAR(40) NOT NULL,
    "password" VARCHAR(60) NOT NULL,
    "nickname" VARCHAR(30) NOT NULL,
    "gender" "Gender" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("member_id")
);

-- CreateTable
CREATE TABLE "add_info" (
    "info_id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "height" INTEGER,
    "weight" INTEGER,
    "disease" VARCHAR(200),

    CONSTRAINT "add_info_pkey" PRIMARY KEY ("info_id")
);

-- CreateTable
CREATE TABLE "ai_chat" (
    "chat_id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "prompt_type" "PromptType" NOT NULL,
    "user_input" TEXT NOT NULL,
    "ai_response" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_pkey" PRIMARY KEY ("chat_id")
);

-- CreateTable
CREATE TABLE "saved_diets" (
    "diet_id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "breakfast" TEXT,
    "lunch" TEXT,
    "dinner" TEXT,
    "snack" TEXT,
    "total_calories" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_diets_pkey" PRIMARY KEY ("diet_id")
);

-- CreateTable
CREATE TABLE "saved_workouts" (
    "workout_id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "workout_type" VARCHAR(100),
    "duration" VARCHAR(20),
    "intensity" "Intensity",
    "target_muscles" TEXT,
    "exercises" TEXT,
    "estimated_calories" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_workouts_pkey" PRIMARY KEY ("workout_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_user_id_key" ON "user"("user_id");

-- CreateIndex
CREATE INDEX "user_user_id_idx" ON "user"("user_id");

-- CreateIndex
CREATE INDEX "user_nickname_idx" ON "user"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "add_info_member_id_key" ON "add_info"("member_id");

-- CreateIndex
CREATE INDEX "ai_chat_member_id_prompt_type_idx" ON "ai_chat"("member_id", "prompt_type");

-- CreateIndex
CREATE INDEX "ai_chat_created_at_idx" ON "ai_chat"("created_at");

-- CreateIndex
CREATE INDEX "saved_diets_member_id_date_idx" ON "saved_diets"("member_id", "date");

-- CreateIndex
CREATE INDEX "saved_diets_created_at_idx" ON "saved_diets"("created_at");

-- CreateIndex
CREATE INDEX "saved_workouts_member_id_date_idx" ON "saved_workouts"("member_id", "date");

-- CreateIndex
CREATE INDEX "saved_workouts_workout_type_idx" ON "saved_workouts"("workout_type");

-- CreateIndex
CREATE INDEX "saved_workouts_intensity_idx" ON "saved_workouts"("intensity");

-- CreateIndex
CREATE INDEX "saved_workouts_created_at_idx" ON "saved_workouts"("created_at");

-- AddForeignKey
ALTER TABLE "add_info" ADD CONSTRAINT "add_info_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "user"("member_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chat" ADD CONSTRAINT "ai_chat_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "user"("member_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_diets" ADD CONSTRAINT "saved_diets_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "user"("member_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_workouts" ADD CONSTRAINT "saved_workouts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "user"("member_id") ON DELETE CASCADE ON UPDATE CASCADE;
