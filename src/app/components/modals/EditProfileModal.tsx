"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { FormField } from "@/app/components/common/FormField";
import {
    useEditProfile,
    UserProfile,
    EditProfileFormData,
} from "@/lib/hooks/useEditProfile";
import styles from "./EditProfileModal.module.css";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile?: UserProfile;
}

export default function EditProfileModal({
    isOpen,
    onClose,
    userProfile,
}: EditProfileModalProps) {
    const { formMethods, isPasswordChange, isSubmitting, onSubmit } =
        useEditProfile(userProfile, onClose);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = formMethods;

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>프로필 편집</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.closeButton}
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className={styles.form}
                >
                    <FormField
                        name="nickname"
                        label="닉네임"
                        register={register}
                        errors={errors}
                    />

                    <div className={styles.gridTwo}>
                        <FormField
                            name="height"
                            label="키 (cm)"
                            type="number"
                            register={register}
                            errors={errors}
                            placeholder="170"
                        />
                        <FormField
                            name="weight"
                            label="몸무게 (kg)"
                            type="number"
                            register={register}
                            errors={errors}
                            placeholder="70"
                        />
                    </div>

                    <FormField
                        name="disease"
                        label="건강 상태/제한사항"
                        type="textarea"
                        register={register}
                        errors={errors}
                        placeholder="알레르기, 질병, 기타 제한사항이 있다면 입력해주세요."
                    />

                    <div className={styles.divider}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                {...register("isPasswordChange")}
                                className={styles.checkbox}
                            />
                            <span className={styles.label}>비밀번호 변경</span>
                        </label>
                    </div>

                    {isPasswordChange && (
                        <div className={styles.passwordSection}>
                            <FormField
                                name="currentPassword"
                                label="현재 비밀번호"
                                type="password"
                                register={register}
                                errors={errors}
                            />
                            <FormField
                                name="newPassword"
                                label="새 비밀번호"
                                type="password"
                                register={register}
                                errors={errors}
                            />
                            <FormField
                                name="confirmPassword"
                                label="새 비밀번호 확인"
                                type="password"
                                register={register}
                                errors={errors}
                            />
                        </div>
                    )}

                    <div className={styles.buttonGroup}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.cancelButton}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={styles.submitButton}
                        >
                            {isSubmitting ? "저장 중..." : "저장"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
