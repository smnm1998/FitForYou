import { useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api-client";

export interface UserProfile {
    nickname?: string;
    gender?: string;
    createdAt?: string;
    addInfo?: {
        height?: number;
        weight?: number;
        disease?: string;
    };
}

export interface EditProfileFormData {
    nickname: string;
    height: string;
    weight: string;
    disease: string;
    isPasswordChange: boolean;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const schema = yup.object().shape({
    nickname: yup
        .string()
        .required("닉네임을 입력해주세요")
        .min(2, "닉네임은 2자 이상이어야 합니다.")
        .max(20, "닉네임은 20자 이하여야 합니다."),
    height: yup.string().default(""),
    weight: yup.string().default(""),
    disease: yup.string().default(""),
    isPasswordChange: yup.boolean().default(false),
    currentPassword: yup.string().default("").when("isPasswordChange", {
        is: true,
        then: (schema) => schema.required("현재 비밀번호를 입력해주세요."),
        otherwise: (schema) => schema,
    }),
    newPassword: yup.string().default("").when("isPasswordChange", {
        is: true,
        then: (schema) =>
            schema
                .required("새 비밀번호를 입력해주세요")
                .min(8, "새 비밀번호는 8자 이상이어야 합니다."),
        otherwise: (schema) => schema,
    }),
    confirmPassword: yup.string().default("").when("isPasswordChange", {
        is: true,
        then: (schema) =>
            schema
                .required("비밀번호 확인을 입력해주세요.")
                .oneOf(
                    [yup.ref("newPassword")],
                    "비밀번호가 일치하지 않습니다."
                ),
        otherwise: (schema) => schema,
    }),
});

export function useEditProfile(
    userProfile?: UserProfile,
    onSuccess?: () => void
) {
    const queryClient = useQueryClient();

    const formMethods = useForm<EditProfileFormData>({
        resolver: yupResolver(schema),
        mode: "onChange",
        defaultValues: {
            nickname: userProfile?.nickname || "",
            height: userProfile?.addInfo?.height?.toString() || "",
            weight: userProfile?.addInfo?.weight?.toString() || "",
            disease: userProfile?.addInfo?.disease || "",
            isPasswordChange: false,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const { watch, reset } = formMethods;
    const isPasswordChange = watch("isPasswordChange");

    useEffect(() => {
        if (userProfile) {
            reset({
                nickname: userProfile?.nickname || "",
                height: userProfile?.addInfo?.height?.toString() || "",
                weight: userProfile?.addInfo?.weight?.toString() || "",
                disease: userProfile?.addInfo?.disease || "",
                isPasswordChange: false,
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        }
    }, [userProfile, reset]);

    const updateProfileMutation = useMutation({
        mutationFn: async (data: Record<string, unknown>) => {
            return apiClient.updateProfile(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-profile"] });
            toast.success("프로필이 성공적으로 업데이트되었습니다!");
            onSuccess?.();
        },
        onError: (error: unknown) => {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "프로필 업데이트 중 오류가 발생했습니다.";
            toast.error(errorMessage);
        },
    });

    const handleSubmit = async (data: EditProfileFormData) => {
        const updateData: Record<string, unknown> = {
            nickname: data.nickname,
            height: data.height ? parseInt(data.height) : undefined,
            weight: data.weight ? parseInt(data.weight) : undefined,
            disease: data.disease,
        };

        if (data.isPasswordChange) {
            updateData.currentPassword = data.currentPassword;
            updateData.newPassword = data.newPassword;
        }

        updateProfileMutation.mutate(updateData);
    };

    return {
        formMethods,
        isPasswordChange,
        isSubmitting: updateProfileMutation.isPending,
        onSubmit: handleSubmit,
    };
}
