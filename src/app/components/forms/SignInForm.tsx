"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import styles from "./SignInForm.module.css";
import clsx from "clsx";

interface SignInFormData {
    userId: string;
    password: string;
}

const schema = yup
    .object({
        userId: yup.string().required("아이디를 입력해주세요."),
        password: yup.string().required("비밀번호를 입력해주세요."),
    })
    .required();

export default function SignInForm() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        resolver: yupResolver(schema),
    });

    const onSubmit: SubmitHandler<SignInFormData> = async (data) => {
        try {
            const result = await signIn("credentials", {
                userId: data.userId,
                password: data.password,
                callbackUrl: "/collection",
                redirect: false,
            });

            if (result?.error) {
                toast.error(
                    "로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요."
                );
            } else if (result?.ok) {
                toast.success("로그인 성공!");
                window.location.href = "/collection";
            }
        } catch (error) {
            toast.error("로그인 중 오류가 발생했습니다.");
            console.error("로그인 에러:", error);
        }
    };

    return (
        <div className={styles.formContainer}>
            <Link href="/" className={styles.backButton}>
                <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
            </Link>

            <div className={styles.logoContainer}>
                <Image
                    src="/logo.png"
                    alt="FitForYou_Logo"
                    width={300}
                    height={120}
                    className={styles.logoImage}
                />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <div className={styles.inputGroup}>
                    <div>
                        <input
                            type="text"
                            {...register("userId")}
                            placeholder="아이디"
                            className={clsx(styles.inputField, {
                                [styles.inputError]: errors.userId,
                                [styles.inputDefault]: !errors.userId,
                            })}
                            disabled={isSubmitting}
                        />
                        {errors.userId && (
                            <p className={styles.errorMessage}>
                                {errors.userId.message}
                            </p>
                        )}
                    </div>
                    <div>
                        <input
                            type="password"
                            {...register("password")}
                            placeholder="비밀번호"
                            className={clsx(styles.inputField, {
                                [styles.inputError]: errors.password,
                                [styles.inputDefault]: !errors.password,
                            })}
                            disabled={isSubmitting}
                        />
                        {errors.password && (
                            <p className={styles.errorMessage}>
                                {errors.password.message}
                            </p>
                        )}
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.submitButton}
                >
                    {isSubmitting ? (
                        <span className={styles.loadingSpinnerContainer}>
                            <div className={styles.loadingSpinner}></div>
                            로그인 중 ...
                        </span>
                    ) : (
                        "로그인"
                    )}
                </button>
            </form>

            <div className={styles.linkContainer}>
                <p className={styles.linkText}>
                    회원이 아니신가요?{" "}
                    <Link href="/signup" className={styles.link}>
                        회원가입
                    </Link>
                </p>
            </div>
        </div>
    );
}
