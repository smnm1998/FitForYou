"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler, FieldErrors } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { apiClient } from "@/lib/api-client";

// 폼 타입 정의
interface SignUpFormData {
    userId: string;
    password?: string;
    confirmPassword?: string;
    gender?: "male" | "female";
    height?: number;
    weight?: number;
    nickname?: string;
    disease?: string; // `disease` 필드를 타입에 추가
}

// 아이디 중복 확인 API 응답 타입
interface CheckUserIdResponse {
    success: boolean;
    available?: boolean;
    message?: string;
}

// 닉네임 중복 확인 API 응답 타입
interface CheckNicknameResponse {
    success: boolean;
    available?: boolean;
    message?: string;
}

// Yup 스키마 정의
const fullSchema = yup
    .object()
    .shape({
        userId: yup.string().required("아이디를 입력해주세요."),
        password: yup.string().when("$currentStep", {
            is: (step: number) => step >= 2,
            then: (schema) =>
                schema
                    .required("비밀번호를 입력해주세요.")
                    .min(8, "비밀번호는 8자 이상이어야 합니다."),
            otherwise: (schema) => schema.notRequired(),
        }),
        confirmPassword: yup.string().when("$currentStep", {
            is: (step: number) => step >= 2,
            then: (schema) =>
                schema
                    .required("비밀번호 확인을 입력해주세요.")
                    .oneOf(
                        [yup.ref("password")],
                        "비밀번호가 일치하지 않습니다."
                    ),
            otherwise: (schema) => schema.notRequired(),
        }),
        gender: yup.mixed<"male" | "female">().when("$currentStep", {
            is: (step: number) => step >= 3,
            then: (schema) =>
                schema
                    .required("성별을 선택해주세요.")
                    .oneOf(["male", "female"], "올바른 성별을 선택해주세요."),
            otherwise: (schema) => schema.notRequired(),
        }),
        height: yup.number().when("$currentStep", {
            is: (step: number) => step >= 4,
            then: (schema) =>
                schema
                    .typeError("숫자만 입력 가능합니다.")
                    .required("키를 입력해주세요.")
                    .positive("키는 0보다 커야합니다."),
            otherwise: (schema) => schema.notRequired(),
        }),
        weight: yup.number().when("$currentStep", {
            is: (step: number) => step >= 4,
            then: (schema) =>
                schema
                    .typeError("숫자만 입력 가능합니다.")
                    .required("몸무게를 입력해주세요.")
                    .positive("몸무게는 0보다 커야합니다."),
            otherwise: (schema) => schema.notRequired(),
        }),
        nickname: yup.string().when("$currentStep", {
            is: (step: number) => step >= 5,
            then: (schema) =>
                schema
                    .required("닉네임을 입력해주세요.")
                    .min(3, "닉네임은 3자 이상이어야 합니다."),
            otherwise: (schema) => schema.notRequired(),
        }),
        // disease 필드에 대한 유효성 검사 추가 (현재는 선택사항)
        disease: yup.string().when("$currentStep", {
            is: (step: number) => step >= 5, // 예시: 5단계에서 함께 입력받는다고 가정
            then: (schema) => schema.optional(),
            otherwise: (schema) => schema.notRequired(),
        }),
    })
    .required();

export default function SignUpForm() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isUserIdChecked, setIsUserIdChecked] = useState(false);
    const [isNicknameChecked, setIsNicknameChecked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        getValues,
        watch,
        setError,
        clearErrors,
        trigger,
    } = useForm<SignUpFormData>({
        resolver: yupResolver(fullSchema),
        mode: "onChange",
        context: { currentStep },
    });

    // 단계별 타이틀 정의
    const stepTitles = {
        1: "아이디를 입력해주세요",
        2: "비밀번호를 설정해주세요",
        3: "성별을 선택해주세요",
        4: "신체 정보를 입력해주세요",
        5: "닉네임을 설정해주세요",
    };

    // 아이디 값 변경 감지 시 중복 확인 상태 초기화
    const watchedUserId = watch("userId");
    useEffect(() => {
        if (touchedFields.userId) {
            setIsUserIdChecked(false);
        }
    }, [watchedUserId, touchedFields.userId]);

    // 닉네임 값 변경 감지 시 중복 확인 상태 초기화
    const watchedNickname = watch("nickname");
    useEffect(() => {
        if (touchedFields.nickname) {
            setIsNicknameChecked(false);
        }
    }, [watchedNickname, touchedFields.nickname]);

    // 최종 폼 제출 핸들러
    const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
        // 닉네임 중복 확인 여부 체크
        if (currentStep === 5 && !isNicknameChecked) {
            toast.error("닉네임 중복 확인을 해주세요.");
            setError("nickname", {
                type: "manual",
                message: "닉네임 중복 확인을 해주세요.",
            });
            return;
        }

        // 최종 제출 전, 모든 필수 데이터가 있는지 다시 한번 확인합니다.
        // yup 스키마가 이를 보장하지만, 타입스크립트의 strict 모드와
        // 예기치 않은 엣지 케이스를 위해 방어적인 코드를 추가합니다.
        const { userId, password, nickname, gender, height, weight, disease } =
            data;
        if (!userId || !password || !nickname || !gender) {
            toast.error("필수 정보가 누락되었습니다. 다시 시도해주세요.");
            console.error("최종 제출 데이터 오류:", data);
            return;
        }

        setIsSubmitting(true);

        try {
            const signUpData = {
                userId,
                password,
                nickname,
                gender,
                height,
                weight,
                disease, // 누락되었던 disease 필드 추가
            };

            const response = await apiClient.signUp(signUpData);

            if (response.success) {
                toast.success("회원가입이 완료되었습니다!");
                router.push("/signin");
            } else {
                toast.error(response.error || "회원가입에 실패했습니다.");
            }
        } catch (error) {
            toast.error("회원가입 중 오류가 발생했습니다.");
            console.error("Sign up error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 에러 처리
    const onError: (errors: FieldErrors<SignUpFormData>) => void = (
        errorFields
    ) => {
        console.error("폼 유효성 검사 실패: ", errorFields);
    };

    // 아이디 중복 확인 핸들러
    const handleCheckUserId = async () => {
        const isValidSyntax = await trigger("userId");
        if (!isValidSyntax) {
            setIsUserIdChecked(false);
            return;
        }

        try {
            const userIdValue = getValues("userId");
            console.log("📤 요청 보내는 아이디:", userIdValue);

            const response = await apiClient.checkUserId(userIdValue);
            console.log("📥 받은 응답:", response);

            if (response.success && response.available) {
                clearErrors("userId");
                setIsUserIdChecked(true);
                toast.success("사용 가능한 아이디입니다.");
            } else {
                setError("userId", {
                    type: "manual",
                    // ✅ 수정: response.data?.message → response.message
                    message: response.message || "이미 사용 중인 아이디입니다.",
                });
                setIsUserIdChecked(false);
            }
        } catch (error) {
            console.error("❌ 아이디 확인 에러:", error);
            toast.error("아이디 확인 중 오류가 발생했습니다.");
            setIsUserIdChecked(false);
        }
    };

    // 닉네임 중복 확인 핸들러
    const handleCheckNickname = async () => {
        const isValidSyntax = await trigger("nickname");
        if (!isValidSyntax) {
            setIsNicknameChecked(false);
            return;
        }

        try {
            const nicknameValue = getValues("nickname");
            // nicknameValue가 undefined일 수 있으므로, API 호출 전에 확인합니다.
            if (!nicknameValue) {
                toast.error("닉네임을 입력해주세요.");
                return;
            }
            const response: CheckNicknameResponse =
                await apiClient.checkNickname(nicknameValue);

            if (response.success && response.available) {
                clearErrors("nickname");
                setIsNicknameChecked(true);
                toast.success("사용 가능한 닉네임입니다.");
            } else {
                setError("nickname", {
                    type: "manual",
                    message: response.message || "이미 사용 중인 닉네임입니다.",
                });
                setIsNicknameChecked(false);
            }
        } catch (error) {
            console.error("❌ 닉네임 확인 에러:", error);
            toast.error("닉네임 확인 중 오류가 발생했습니다.");
            setIsNicknameChecked(false);
        }
    };

    // 다음 단계 이동 핸들러
    const handleNextStep = async () => {
        switch (currentStep) {
            case 1:
                const isUserIdSyntaxValid = await trigger("userId");
                if (!isUserIdSyntaxValid) {
                    setIsUserIdChecked(false);
                    return;
                }
                if (!isUserIdChecked) {
                    setError("userId", {
                        type: "manual",
                        message: "아이디 중복 확인을 해주세요.",
                    });
                    return;
                }
                setCurrentStep((prev) => prev + 1);
                break;
            case 2:
                const isStep2Valid = await trigger([
                    "password",
                    "confirmPassword",
                ]);
                if (isStep2Valid) {
                    setCurrentStep((prev) => prev + 1);
                }
                break;
            case 3:
                const isStep3Valid = await trigger("gender");
                if (isStep3Valid) {
                    setCurrentStep((prev) => prev + 1);
                }
                break;
            case 4:
                const isStep4Valid = await trigger(["height", "weight"]);
                if (isStep4Valid) {
                    setCurrentStep((prev) => prev + 1);
                }
                break;
            default:
                console.warn(`handleNextStep: 예기치 않은 단계 ${currentStep}`);
                break;
        }
    };

    // 이전 단계 이동
    const handlePrevStep = () => {
        setCurrentStep((prev) => Math.max(1, prev - 1));
    };

    return (
        <div className="w-full max-w-lg relative">
            {/* 뒤로가기 버튼 */}
            <Link
                href="/"
                className="fixed top-8 left-4 w-12 h-12 bg-white/90 backdrop-blur-md 
                    rounded-full flex items-center justify-center shadow-light 
                    hover:bg-primary/90 transition-all duration-200 z-20"
            >
                <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
            </Link>

            <div className="max-w-lg w-full px-4">
                <form
                    onSubmit={handleSubmit(onSubmit, onError)}
                    className="w-full"
                >
                    {/* 단계별 컨텐츠 */}
                    <div className="card w-full mb-6">
                        <h2
                            className="text-xl font-bold text-center mb-6 text-gray-800 break-keep 
                            sm:text-2xl"
                        >
                            {stepTitles[currentStep as keyof typeof stepTitles]}
                        </h2>

                        {/* 1단계: 아이디 */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        id="userId"
                                        type="text"
                                        {...register("userId")}
                                        className={`w-full p-4 pr-24 border-2 rounded-xl text-base font-medium 
                                transition-colors duration-200 focus:outline-none
                                ${
                                    errors.userId
                                        ? "border-error"
                                        : "border-gray-200 focus:border-primary"
                                }`}
                                        placeholder="아이디를 입력하세요"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCheckUserId}
                                        className="absolute right-2 top-2 px-3 py-2 bg-primary text-gray-800 
                                font-semibold rounded-lg text-sm hover:bg-primary-hover 
                                transition-colors duration-200"
                                    >
                                        중복확인
                                    </button>
                                </div>
                                {errors.userId && (
                                    <p className="text-error text-sm font-medium">
                                        {errors.userId.message}
                                    </p>
                                )}
                                {isUserIdChecked && !errors.userId && (
                                    <p className="text-success text-sm font-medium">
                                        사용 가능한 아이디입니다.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 2단계: 비밀번호 */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div>
                                    <input
                                        id="password"
                                        type="password"
                                        {...register("password")}
                                        className={`w-full p-4 border-2 rounded-xl text-base font-medium 
                                transition-colors duration-200 focus:outline-none
                                ${
                                    errors.password
                                        ? "border-error"
                                        : "border-gray-200 focus:border-primary"
                                }`}
                                        placeholder="비밀번호 (8자 이상)"
                                    />
                                    {errors.password && (
                                        <p className="text-error text-sm font-medium mt-2">
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        {...register("confirmPassword")}
                                        className={`w-full p-4 border-2 rounded-xl text-base font-medium 
                                transition-colors duration-200 focus:outline-none
                                ${
                                    errors.confirmPassword
                                        ? "border-error"
                                        : "border-gray-200 focus:border-primary"
                                }`}
                                        placeholder="비밀번호 확인"
                                    />
                                    {errors.confirmPassword && (
                                        <p className="text-error text-sm font-medium mt-2">
                                            {errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3단계: 성별 선택 */}
                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <div className="flex justify-center gap-6">
                                    <label
                                        className="flex flex-col items-center gap-4 p-6 border-2 border-gray-200 
                                    rounded-xl cursor-pointer transition-colors duration-200 min-w-24
                                    hover:border-primary has-[:checked]:border-primary 
                                    has-[:checked]:bg-primary/10"
                                    >
                                        <input
                                            type="radio"
                                            value="male"
                                            {...register("gender")}
                                            className="sr-only"
                                        />
                                        <div className="w-16 h-16 flex items-center justify-center">
                                            <Image
                                                src="/Man.svg"
                                                alt="남성"
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <span className="font-semibold text-gray-800">
                                            남성
                                        </span>
                                    </label>

                                    <label
                                        className="flex flex-col items-center gap-4 p-6 border-2 border-gray-200 
                                    rounded-xl cursor-pointer transition-colors duration-200 min-w-24
                                    hover:border-primary has-[:checked]:border-primary 
                                    has-[:checked]:bg-primary/10"
                                    >
                                        <input
                                            type="radio"
                                            value="female"
                                            {...register("gender")}
                                            className="sr-only"
                                        />
                                        <div className="w-16 h-16 flex items-center justify-center">
                                            <Image
                                                src="/Woman.svg"
                                                alt="여성"
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <span className="font-semibold text-gray-800">
                                            여성
                                        </span>
                                    </label>
                                </div>
                                {errors.gender && (
                                    <p className="text-error text-sm font-medium text-center">
                                        {errors.gender.message}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 4단계: 키, 몸무게 */}
                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            키 (cm)
                                        </label>
                                        <input
                                            id="height"
                                            type="number"
                                            {...register("height", {
                                                valueAsNumber: true,
                                            })}
                                            className={`w-full p-4 border-2 rounded-xl text-base font-medium 
                                    transition-colors duration-200 focus:outline-none
                                    ${
                                        errors.height
                                            ? "border-error"
                                            : "border-gray-200 focus:border-primary"
                                    }`}
                                            placeholder="170"
                                        />
                                        {errors.height && (
                                            <p className="text-error text-sm font-medium mt-1">
                                                {errors.height.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            몸무게 (kg)
                                        </label>
                                        <input
                                            id="weight"
                                            type="number"
                                            {...register("weight", {
                                                valueAsNumber: true,
                                            })}
                                            className={`w-full p-4 border-2 rounded-xl text-base font-medium 
                                    transition-colors duration-200 focus:outline-none
                                    ${
                                        errors.weight
                                            ? "border-error"
                                            : "border-gray-200 focus:border-primary"
                                    }`}
                                            placeholder="70"
                                        />
                                        {errors.weight && (
                                            <p className="text-error text-sm font-medium mt-1">
                                                {errors.weight.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5단계: 닉네임 */}
                        {currentStep === 5 && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        id="nickname"
                                        type="text"
                                        {...register("nickname")}
                                        className={`w-full p-4 pr-24 border-2 rounded-xl text-base font-medium 
                                transition-colors duration-200 focus:outline-none
                                ${
                                    errors.nickname
                                        ? "border-error"
                                        : "border-gray-200 focus:border-primary"
                                }`}
                                        placeholder="3~10자리 입력"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCheckNickname}
                                        className="absolute right-2 top-2 px-3 py-2 bg-primary text-gray-800 
                                font-semibold rounded-lg text-sm hover:bg-primary-hover 
                                transition-colors duration-200"
                                    >
                                        중복확인
                                    </button>
                                </div>
                                {errors.nickname && (
                                    <p className="text-error text-sm font-medium">
                                        {errors.nickname.message}
                                    </p>
                                )}
                                {isNicknameChecked && !errors.nickname && (
                                    <p className="text-success text-sm font-medium">
                                        사용 가능한 닉네임입니다.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {/* 하단 고정 네비게이션 버튼 */}
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-lg px-5 z-15">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-primary/30 p-4">
                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={handlePrevStep}
                                className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl
                            hover:bg-gray-200 transition-colors duration-200"
                            >
                                이전
                            </button>
                        )}

                        {currentStep < 5 ? (
                            <button
                                type="button"
                                onClick={handleNextStep}
                                className="flex-1 py-3 bg-primary text-gray-800 font-semibold rounded-xl
                            hover:bg-primary-hover transition-all duration-200 
                            hover:transform hover:-translate-y-0.5"
                            >
                                다음
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit, onError)}
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-success text-white font-semibold rounded-xl
                            hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-200 hover:transform hover:-translate-y-0.5"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <div className="loading-spinner mr-2"></div>
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

            {/* 진행도 표시기 */}
            <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-10">
                <div className="w-60 h-1 bg-gray-200/50 rounded-full backdrop-blur-md overflow-hidden">
                    <div
                        className="h-full bg-primary/80 rounded-full transition-all duration-300"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                    ></div>
                </div>
                <p className="text-sm font-medium text-gray-800 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full">
                    단계 {currentStep} / 5
                </p>
            </div>
        </div>
    );
}
