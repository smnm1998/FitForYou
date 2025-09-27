"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { FormProvider } from "react-hook-form";
import styles from "./SignUpForm.module.css";
import clsx from "clsx";
// ✅ Zustand 스토어 import 경로를 확인해주세요.
import { useSignUpStore } from "@/lib/useSignUpStore";
import { useSignUpFormHandler } from "@/lib/hooks/useSignUpFormHandler";
import { StepUserAuth } from "./signup/StepUserAuth";
import { StepUserInfo } from "./signup/StepUserInfo";

const stepTitles = {
    1: "아이디를 입력해주세요.",
    2: "비밀번호를 설정해주세요",
    3: "성별을 선택해주세요.",
    4: "신체 정보를 입력해주세요.",
    5: "닉네임을 설정해주세요.",
};

export default function SignUpForm() {
    const { formMethods, handlers } = useSignUpFormHandler();
    const { currentStep, isSubmitting, prevStep, reset } = useSignUpStore();

    useEffect(() => {
        return () => {
            reset();
        };
    }, [reset]);

    // 각 단계에 맞는 컴포넌트를 명확히 렌더링하도록 수정
    const renderStepContent = () => {
        if (currentStep <= 2) {
            return (
                <StepUserAuth handleCheckUserId={handlers.handleCheckUserId} />
            );
        }
        return (
            <StepUserInfo handleCheckNickname={handlers.handleCheckNickname} />
        );
    };

    return (
        <FormProvider {...formMethods}>
            <div className={styles.container}>
                <Link href="/" className={styles.backButton}>
                    <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
                </Link>
                <div className={styles.formWrapper}>
                    <form onSubmit={handlers.onSubmit} className="w-full">
                        <div className={clsx("card", styles.card)}>
                            <h2 className={styles.title}>
                                {
                                    stepTitles[
                                        currentStep as keyof typeof stepTitles
                                    ]
                                }
                            </h2>
                            {renderStepContent()}
                        </div>
                    </form>
                </div>
                <div className={styles.bottomNav}>
                    <div className={styles.bottomNavCard}>
                        <div className={styles.buttonGroup}>
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className={styles.prevButton}
                                >
                                    이전
                                </button>
                            )}
                            {currentStep < 5 ? (
                                <button
                                    type="button"
                                    onClick={handlers.handleNextStep}
                                    className={styles.nextButton}
                                >
                                    다음
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handlers.onSubmit}
                                    disabled={isSubmitting}
                                    className={styles.submitButton}
                                >
                                    {isSubmitting ? (
                                        <span
                                            className={
                                                styles.loadingSpinnerContainer
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.loadingSpinner
                                                }
                                            />
                                            가입 중...
                                        </span>
                                    ) : (
                                        "가입 완료"
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBarTrack}>
                        <div
                            className={styles.progressBarFill}
                            style={{ width: `${(currentStep / 5) * 100}%` }}
                        />
                    </div>
                    <p className={styles.progressText}>
                        단계 {currentStep} / 5
                    </p>
                </div>
            </div>
        </FormProvider>
    );
}
