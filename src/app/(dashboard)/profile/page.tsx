"use client";

import { useState } from "react";
import {
    UserIcon,
    HeartIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api-client";
import { UserProfile } from "@/lib/hooks/useEditProfile";
import EditProfileModal from "@/app/components/modals/EditProfileModal";

export default function ProfilePage() {
    const { data: session } = useSession();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");

    // 사용자 프로필 조회 (타입 간소화)
    const { data: profileData, isLoading } = useQuery({
        queryKey: ["user-profile"],
        queryFn: async () => {
            const response = await apiClient.getProfile();
            return response.data as UserProfile; // 직접 캐스팅
        },
        enabled: !!session,
    });

    // 회원 탈퇴 mutation
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

    const handleLogout = async () => {
        if (confirm("로그아웃 하시겠습니까?")) {
            await signOut({ callbackUrl: "/" });
            toast.success("로그아웃되었습니다.");
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            toast.error("비밀번호를 입력해주세요.");
            return;
        }

        if (
            confirm("정말로 회원 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")
        ) {
            deleteAccountMutation.mutate(deletePassword);
        }
    };

    const formatGender = (gender: string) => {
        return gender === "male" ? "남성" : "여성";
    };

    const calculateAge = (createdAt: string) => {
        const created = new Date(createdAt);
        const now = new Date();
        const diffMonths =
            (now.getFullYear() - created.getFullYear()) * 12 +
            now.getMonth() -
            created.getMonth();
        return `가입 ${diffMonths}개월차`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="max-w-2xl mx-auto px-5 pt-20">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                        <div className="card p-8">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="max-w-2xl mx-auto px-5 pt-20">
                <header className="text-left mb-6">
                    <h1 className="text-3xl font-black text-gray-800">
                        나의정보
                    </h1>
                </header>

                {/* 프로필 카드 */}
                <section className="mb-6">
                    <div className="card p-8">
                        <div className="flex items-center gap-6 mb-6">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                                <UserIcon className="w-10 h-10 text-gray-800" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-800 mb-1">
                                    {profileData?.nickname || "사용자"}님
                                </h2>
                                <p className="text-gray-600 text-sm mb-2">
                                    {profileData?.gender &&
                                        formatGender(profileData.gender)}{" "}
                                    •{" "}
                                    {profileData?.createdAt &&
                                        calculateAge(profileData.createdAt)}
                                </p>
                                <div className="flex gap-4 text-sm text-gray-600">
                                    {profileData?.addInfo?.height && (
                                        <span>
                                            {profileData.addInfo.height}cm
                                        </span>
                                    )}
                                    {profileData?.addInfo?.weight && (
                                        <span>
                                            {profileData.addInfo.weight}kg
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {profileData?.addInfo?.disease && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                <h4 className="font-semibold text-gray-800 mb-1">
                                    건강 정보
                                </h4>
                                <p className="text-sm text-gray-600">
                                    {profileData.addInfo.disease}
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* 메뉴 섹션 */}
                <section className="mb-6 space-y-3">
                    <div className="card p-5 hover:shadow-lg transition-all duration-200 cursor-pointer hover:transform hover:-translate-y-1">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                                <HeartIcon className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800 mb-1">
                                    저장한 식단 & 운동
                                </h3>
                                <p className="text-sm text-gray-600">
                                    즐겨찾기한 항목들을 확인하세요
                                </p>
                            </div>
                            <div className="text-gray-400 text-xl">›</div>
                        </div>
                    </div>

                    <div
                        className="card p-5 hover:shadow-lg transition-all duration-200 cursor-pointer hover:transform hover:-translate-y-1"
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                <Cog6ToothIcon className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800 mb-1">
                                    개인정보 수정
                                </h3>
                                <p className="text-sm text-gray-600">
                                    키, 몸무게, 건강정보 등을 변경하세요
                                </p>
                            </div>
                            <div className="text-gray-400 text-xl">›</div>
                        </div>
                    </div>
                </section>

                {/* 하단 메뉴 */}
                <section className="mb-6 space-y-3">
                    <button
                        onClick={handleLogout}
                        className="w-full card p-5 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-600">
                                로그아웃
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="w-full card p-5 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors duration-200"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <TrashIcon className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-red-600">
                                회원 탈퇴
                            </span>
                        </div>
                    </button>
                </section>

                {/* 앱 정보 */}
                <section className="text-center text-gray-500 space-y-1">
                    <p className="text-sm font-semibold">FitForYou v1.0.0</p>
                    <p className="text-xs">건강한 하루를 위한 AI 맞춤 서비스</p>
                </section>
            </div>

            {/* 프로필 편집 모달 */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                userProfile={profileData}
            />

            {/* 회원 탈퇴 모달 */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <TrashIcon className="w-8 h-8 text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">
                                회원 탈퇴
                            </h2>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                정말로 회원 탈퇴하시겠습니까?
                                <br />
                                모든 데이터가 영구적으로 삭제됩니다.
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                확인을 위해 비밀번호를 입력해주세요
                            </label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) =>
                                    setDeletePassword(e.target.value)
                                }
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-red-400 focus:outline-none"
                                placeholder="비밀번호"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setDeletePassword("");
                                }}
                                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteAccountMutation.isPending}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleteAccountMutation.isPending
                                    ? "처리 중..."
                                    : "탈퇴하기"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
