"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

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
    const router = useRouter();
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
                redirect: false,
            });

            if (result?.error) {
                toast.error(
                    "로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요."
                );
            } else {
                toast.success("로그인 성공!");
                router.refresh();
                router.push("/collection");
            }
        } catch (error) {
            toast.error("로그인 중 오류가 발생했습니다.");
            console.error("Sign in error:", error);
        }
    };

    return (
        <div className="flex flex-col items-center max-w-md w-full px-4">
            {/* 뒤로가기 버튼 */}
            <Link
                href="/"
                className="fixed top-8 left-4 w-12 h-12 bg-white/90 backdrop-blur-md 
                    rounded-full flex items-center justify-center shadow-light 
                    hover:bg-primary/90 transition-all duration-200 z-20"
            >
                <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
            </Link>

            {/* 로고 */}
            <div className="mb-12">
                <Image
                    src="/Logo.png"
                    alt="FitForYou 로고"
                    width={300}
                    height={120}
                    className="w-60 h-auto sm:w-80"
                />
            </div>

            {/* 로그인 폼 */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full space-y-5"
            >
                <div className="space-y-4">
                    <div>
                        <input
                            type="text"
                            {...register("userId")}
                            placeholder="아이디"
                            className={`w-full p-4 border-2 rounded-xl 
                            focus:outline-none transition-colors duration-200 text-base font-medium
                            ${
                                errors.userId
                                    ? "border-error"
                                    : "border-gray-200 focus:border-primary"
                            }`}
                            disabled={isSubmitting}
                        />
                        {errors.userId && (
                            <p className="text-error text-sm font-medium mt-1">
                                {errors.userId.message}
                            </p>
                        )}
                    </div>
                    <div>
                        <input
                            type="password"
                            {...register("password")}
                            placeholder="비밀번호"
                            className={`w-full p-4 border-2 rounded-xl 
                            focus:outline-none transition-colors duration-200 text-base font-medium
                            ${
                                errors.password
                                    ? "border-error"
                                    : "border-gray-200 focus:border-primary"
                            }`}
                            disabled={isSubmitting}
                        />
                        {errors.password && (
                            <p className="text-error text-sm font-medium mt-1">
                                {errors.password.message}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary text-gray-800 font-semibold rounded-xl
                        hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200 hover:transform hover:-translate-y-0.5
                        shadow-md hover:shadow-lg text-base sm:text-lg"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center">
                            <div className="loading-spinner mr-2"></div>
                            로그인 중...
                        </span>
                    ) : (
                        "로그인"
                    )}
                </button>
            </form>

            {/* 회원가입 링크 */}
            <div className="text-center mt-5">
                <p className="text-sm text-gray-600">
                    회원이 아니신가요?{" "}
                    <Link
                        href="/signup"
                        className="text-gray-800 font-bold underline hover:no-underline 
                        transition-all duration-200"
                    >
                        회원가입
                    </Link>
                </p>
            </div>
        </div>
    );
}
