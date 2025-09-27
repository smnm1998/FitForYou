import { useFormContext } from "react-hook-form";
import Image from "next/image";
import styles from "../SignUpForm.module.css";
import clsx from "clsx";
import { useSignUpStore } from "@/lib/useSignUpStore";
import { SignUpFormData } from "@/lib/hooks/useSignUpFormHandler";

interface StepUserInfoProps {
    handleCheckNickname: () => void;
}

export function StepUserInfo({ handleCheckNickname }: StepUserInfoProps) {
    const {
        register,
        formState: { errors },
    } = useFormContext<SignUpFormData>();
    const { currentStep, isNicknameChecked } = useSignUpStore();

    return (
        <div className={styles.inputGroup}>
            {/* ✅ currentStep이 3일 때만 렌더링 */}
            {currentStep === 3 && (
                <div>
                    <div className={styles.genderSelection}>
                        <label className={styles.genderLabel}>
                            <input
                                type="radio"
                                value="male"
                                {...register("gender")}
                                className="sr-only"
                            />
                            <div className={styles.genderImageContainer}>
                                <Image
                                    src="/Man.svg"
                                    alt="남성"
                                    width={64}
                                    height={64}
                                    className={styles.genderImage}
                                />
                            </div>
                            <span className={styles.genderText}>남성</span>
                        </label>
                        <label className={styles.genderLabel}>
                            <input
                                type="radio"
                                value="female"
                                {...register("gender")}
                                className="sr-only"
                            />
                            <div className={styles.genderImageContainer}>
                                <Image
                                    src="/Woman.svg"
                                    alt="여성"
                                    width={64}
                                    height={64}
                                    className={styles.genderImage}
                                />
                            </div>
                            <span className={styles.genderText}>여성</span>
                        </label>
                    </div>
                    {errors.gender && (
                        <p className={clsx(styles.errorMessage, "text-center")}>
                            {errors.gender.message as string}
                        </p>
                    )}
                </div>
            )}

            {/* ✅ currentStep이 4일 때만 렌더링 */}
            {currentStep === 4 && (
                <div className={styles.physicalInfoGroup}>
                    <div>
                        <label className={styles.label}>키 (cm)</label>
                        <input
                            id="height"
                            type="number"
                            {...register("height", { valueAsNumber: true })}
                            className={clsx(styles.inputField, {
                                [styles.inputError]: !!errors.height,
                                [styles.inputDefault]: !errors.height,
                            })}
                            placeholder="170"
                        />
                        {errors.height && (
                            <p className={styles.errorMessage}>
                                {errors.height.message as string}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className={styles.label}>몸무게 (kg)</label>
                        <input
                            id="weight"
                            type="number"
                            {...register("weight", { valueAsNumber: true })}
                            className={clsx(styles.inputField, {
                                [styles.inputError]: !!errors.weight,
                                [styles.inputDefault]: !errors.weight,
                            })}
                            placeholder="70"
                        />
                        {errors.weight && (
                            <p className={styles.errorMessage}>
                                {errors.weight.message as string}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ✅ currentStep이 5일 때만 렌더링 */}
            {currentStep === 5 && (
                <div>
                    <div className={styles.inputContainer}>
                        <input
                            id="nickname"
                            type="text"
                            {...register("nickname")}
                            className={clsx(
                                styles.inputField,
                                styles.inputWithButton,
                                {
                                    [styles.inputError]: !!errors.nickname,
                                    [styles.inputDefault]: !errors.nickname,
                                }
                            )}
                            placeholder="3~10자리 입력"
                        />
                        <button
                            type="button"
                            onClick={handleCheckNickname}
                            className={styles.checkButton}
                        >
                            중복확인
                        </button>
                    </div>
                    {errors.nickname && (
                        <p className={styles.errorMessage}>
                            {errors.nickname.message as string}
                        </p>
                    )}
                    {isNicknameChecked && !errors.nickname && (
                        <p className={styles.successMessage}>
                            사용 가능한 닉네임입니다.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
