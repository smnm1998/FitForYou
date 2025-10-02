"use client";

import { useState } from "react";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useMutation } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api-client";
import styles from "./DeleteAccountModal.module.css";

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DeleteAccountModal({
    isOpen,
    onClose,
}: DeleteAccountModalProps) {
    const [password, setPassword] = useState("");
    const deleteAccountMutation = useMutation({
        mutationFn: async (password: string) => {
            return apiClient.deleteAccount(password);
        },
        onSuccess: () => {
            toast.success("회원 탈퇴가 완료되었습니다.");
            signOut({ callbackUrl: "/" });
        },
        onError: (error: unknown) => {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "회원 탈퇴 중 오류가 발생했습니다.";
            toast.error(errorMessage);
        },
    });

    const handleSubmit = () => {
        if (!password) {
            toast.error("비밀번호를 입력해주세요");
            return;
        }

        if (
            confirm("정말로 회원 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")
        ) {
            deleteAccountMutation.mutate(password);
        }
    };

    const handleClose = () => {
        setPassword("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={handleClose} className={styles.closeButton}>
                    <XMarkIcon className="w-5 h-5" />
                </button>
                <div className={styles.content}>
                    <div className={styles.iconContainer}>
                        <TrashIcon className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className={styles.title}>회원 탈퇴</h2>
                    <p className={styles.description}>
                        정말로 회원 탈퇴하시겠습니까?
                        <br />
                        모든 데이터가 영구적으로 삭제됩니다.
                    </p>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        확인을 위해 비밀번호를 입력해주세요
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        placeholder="비밀번호"
                    />
                </div>

                <div className={styles.buttonGroup}>
                    <button
                        onClick={handleClose}
                        className={styles.cancelButton}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={deleteAccountMutation.isPending}
                        className={styles.deleteButton}
                    >
                        {deleteAccountMutation.isPending
                            ? "처리 중..."
                            : "탈퇴하기"}
                    </button>
                </div>
            </div>
        </div>
    );
}
