import { useEffect } from "react";
import { useForm, SubmitHandler, FieldErrors } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useSignUpStore } from "@/lib/useSignUpStore";
import { apiClient } from "@/lib/api-client";

export interface SignUpFormData {
    userId: string;
    password?: string;
    confirmPassword?: string;
    gender?: "male" | "female";
    height?: number;
    weight?: number;
    nickname?: string;
    disease?: string;
}

const fullSchema = yup.object().shape({
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
                .oneOf([yup.ref("password")], "비밀번호가 일치하지 않습니다."),
        otherwise: (schema) => schema.notRequired(),
    }),
    gender: yup.mixed<"male" | "female">().when("$currentStep", {
        is: (step: number) => step >= 3,
        then: (schema) =>
            schema
                .required("성별을 선택해주세요")
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
                .min(3, "닉네임은 최소 3자 이상이어야 합니다."),
        otherwise: (schema) => schema.notRequired(),
    }),
    disease: yup.string().optional(),
});

export function useSignUpFormHandler() {
    const router = useRouter();
    const {
        currentStep,
        isUserIdChecked,
        isNicknameChecked,
        nextStep,
        setUserIdChecked,
        setNicknameChecked,
        setIsSubmitting,
    } = useSignUpStore();
    const formMethods = useForm<SignUpFormData>({
        resolver: yupResolver(fullSchema),
        mode: "onChange",
        context: { currentStep },
    });
    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        getValues,
        watch,
        setError,
        clearErrors,
        trigger,
    } = formMethods;

    // 아이디 필드 값 변경 시 '중복 확인' 상태 초기화
    const watchedUserId = watch("userId");
    useEffect(() => {
        if (touchedFields.userId) setUserIdChecked(false);
    }, [watchedUserId, touchedFields.userId, setUserIdChecked]);

    // 닉네임 필드 값이 변경되면 '중복 확인' 상태를 초기화
    const watchedNickname = watch("nickname");
    useEffect(() => {
        if (touchedFields.nickname) setNicknameChecked(false);
    }, [watchedNickname, touchedFields.nickname, setNicknameChecked]);

    const handleCheckUserId = async () => {
        if (!(await trigger("userId"))) return;
        try {
            const response = await apiClient.checkUserId(getValues("userId"));
            if (response.success && response.available) {
                clearErrors("userId");
                setUserIdChecked(true);
                toast.success("사용 가능한 아이디입니다.");
            } else {
                setError("userId", {
                    type: "manual",
                    message: response.message || "이미 사용 중인 아이디입니다.",
                });
                setUserIdChecked(false);
            }
        } catch {
            toast.error("아이디 확인 중 오류가 발생했습니다.");
        }
    };

    const handleCheckNickname = async () => {
        if (!(await trigger("nickname"))) return;
        const nickname = getValues("nickname");
        if (!nickname) return;
        try {
            const response = await apiClient.checkNickname(nickname);
            if (response.success && response.available) {
                clearErrors("nickname");
                setNicknameChecked(true);
                toast.success("사용 가능한 닉네임입니다.");
            } else {
                setError("nickname", {
                    type: "manual",
                    message: response.message || "이미 사용 중인 닉네임입니다.",
                });
                setNicknameChecked(false);
            }
        } catch {
            toast.error("닉네임 확인 중 오류가 발생했습니다.");
        }
    };

    const handleNextStep = async () => {
        let isValid = false;
        switch (currentStep) {
            case 1:
                if (await trigger("userId")) {
                    if (isUserIdChecked) isValid = true;
                    else
                        setError("userId", {
                            type: "manual",
                            message: "아이디 중복 확인을 해주세요.",
                        });
                }
                break;
            case 2:
                isValid = await trigger(["password", "confirmPassword"]);
                break;
            case 3:
                isValid = await trigger("gender");
                break;
            case 4:
                isValid = await trigger(["height", "weight"]);
                break;
        }
        if (isValid) nextStep(); // zustand 액션 호출
    };

    const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
        if (currentStep === 5 && !isNicknameChecked) {
            toast.error("닉네임 중복 확인을 해주세요.");
            setError("nickname", {
                type: "manual",
                message: "닉네임 중복 확인을 해주세요.",
            });
            return;
        }

        const { userId, password, nickname, gender } = data;
        if (!userId || !password || !nickname || !gender) {
            toast.error("필수 정보가 누락되었습니다. 다시 시도해주세요.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await apiClient.signUp(data);
            if (response.success) {
                toast.success("회원가입이 완료되었습니다.");
                router.push("/signin");
            } else {
                toast.error(response.error || "회원가입에 실패했습니다.");
            }
        } catch (error) {
            toast.error("회원가입 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onError = (errorFields: FieldErrors<SignUpFormData>) => {
        console.error("폼 유효성 검사 실패: ", errorFields);
    };

    // 컴포넌트에서 사용할 모든 것을 반환합니다.
    return {
        formMethods,
        handlers: {
            handleCheckUserId,
            handleCheckNickname,
            handleNextStep,
            onSubmit: handleSubmit(onSubmit, onError),
        },
    };
}
