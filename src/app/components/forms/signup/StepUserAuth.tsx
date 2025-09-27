import { useFormContext } from "react-hook-form";
import styles from "../SignUpForm.module.css";
import clsx from "clsx";
import { useSignUpStore } from "@/lib/useSignUpStore";
import { SignUpFormData } from "@/lib/hooks/useSignUpFormHandler";

interface StepUserAuthProps {
    handleCheckUserId: () => void;
}

export function StepUserAuth({ handleCheckUserId }: StepUserAuthProps) {
    const {
        register,
        formState: { errors },
    } = useFormContext<SignUpFormData>();
    const { currentStep, isUserIdChecked } = useSignUpStore();

    return (
        <div className={styles.inputGroup}>
            {/* ✅ currentStep이 1일 때만 렌더링 */}
            {currentStep === 1 && (
                <div>
                    <div className={styles.inputContainer}>
                        <input
                            id="userId"
                            type="text"
                            {...register("userId")}
                            className={clsx(
                                styles.inputField,
                                styles.inputWithButton,
                                {
                                    [styles.inputError]: !!errors.userId,
                                    [styles.inputDefault]: !errors.userId,
                                }
                            )}
                            placeholder="아이디를 입력하세요"
                        />
                        <button
                            type="button"
                            onClick={handleCheckUserId}
                            className={styles.checkButton}
                        >
                            중복확인
                        </button>
                    </div>
                    {errors.userId && (
                        <p className={styles.errorMessage}>
                            {errors.userId.message as string}
                        </p>
                    )}
                    {isUserIdChecked && !errors.userId && (
                        <p className={styles.successMessage}>
                            사용 가능한 아이디입니다.
                        </p>
                    )}
                </div>
            )}

            {/* ✅ currentStep이 2일 때만 렌더링 */}
            {currentStep === 2 && (
                <div className={styles.inputGroup}>
                    <div>
                        <input
                            id="password"
                            type="password"
                            {...register("password")}
                            className={clsx(styles.inputField, {
                                [styles.inputError]: !!errors.password,
                                [styles.inputDefault]: !errors.password,
                            })}
                            placeholder="비밀번호 (8자 이상)"
                        />
                        {errors.password && (
                            <p className={styles.errorMessage}>
                                {errors.password.message as string}
                            </p>
                        )}
                    </div>
                    <div>
                        <input
                            id="confirmPassword"
                            type="password"
                            {...register("confirmPassword")}
                            className={clsx(styles.inputField, {
                                [styles.inputError]: !!errors.confirmPassword,
                                [styles.inputDefault]: !errors.confirmPassword,
                            })}
                            placeholder="비밀번호 확인"
                        />
                        {errors.confirmPassword && (
                            <p className={styles.errorMessage}>
                                {errors.confirmPassword.message as string}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
