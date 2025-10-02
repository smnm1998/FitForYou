"use client";

import { useState } from "react";
import {
    UserIcon,
    HeartIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    PencilIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api-client";
import { UserProfile } from "@/lib/hooks/useEditProfile";
import EditProfileModal from "@/app/components/modals/EditProfileModal";
import DeleteAccountModal from "@/app/components/modals/DeleteAccountModal";
import { formatGender, calculateAge } from "@/utils/profile.util";
import styles from "./ProfilePage.module.css";

export default function ProfilePage() {
    const { data: session } = useSession();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const { data: profileData, isLoading } = useQuery({
        queryKey: ["user-profile"],
        queryFn: async () => {
            const response = await apiClient.getProfile();
            return response.data as UserProfile;
        },
        enabled: !!session,
    });

    const handleLogout = async () => {
        if (confirm("로그아웃 하시겠습니까?")) {
            await signOut({ callbackUrl: "/" });
            toast.success("로그아웃되었습니다.");
        }
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.innerContainer}>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingTitle}></div>
                        <div className="card p-8">
                            <div className={styles.loadingProfile}>
                                <div className={styles.loadingAvatar}></div>
                                <div className={styles.loadingInfo}>
                                    <div className={styles.loadingName}></div>
                                    <div className={styles.loadingMeta}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.innerContainer}>
                <header className={styles.header}>
                    <h1 className={styles.title}>나의 정보</h1>
                </header>

                <section className={styles.section}>
                    <div className="card p-8">
                        <div className={styles.profileCard}>
                            <div className={styles.avatarContainer}>
                                <UserIcon className="w-10 h-10 text-gray-800" />
                            </div>
                            <div className={styles.profileInfo}>
                                <h2 className={styles.profileName}>
                                    {profileData?.nickname || "사용자"}님
                                </h2>
                                <p className={styles.profileMeta}>
                                    {profileData?.gender &&
                                        formatGender(profileData.gender)}{" "}
                                    •{" "}
                                    {profileData?.createdAt &&
                                        calculateAge(profileData.createdAt)}
                                </p>
                                <div className={styles.profileStats}>
                                    {profileData?.addInfo?.height && (
                                        <span>
                                            {profileData.addInfo.height}cm
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className={styles.editButton}
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        </div>
                        {profileData?.addInfo?.disease && (
                            <div className={styles.healthInfo}>
                                <h4 className={styles.healthTitle}>
                                    건강 정보
                                </h4>
                                <p className={styles.healthText}>
                                    {profileData.addInfo.disease}
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <section className={styles.menuSection}>
                    <div className={styles.menuCard}>
                        <div className={styles.menuContent}>
                            <div className={styles.menuIconRed}>
                                <HeartIcon className="w-6 h-6 text-red-500" />
                            </div>
                            <div className={styles.menuInfo}>
                                <h3 className={styles.menuTitle}>
                                    즐겨찾기 관리
                                </h3>
                                <p className={styles.menuDescription}>
                                    저장한 식단과 운동을 확인하세요
                                </p>
                            </div>
                        </div>
                        <div className={styles.menuArrow}>›</div>
                    </div>

                    <div className={styles.menuCard}>
                        <div className={styles.menuContent}>
                            <div className={styles.menuIconBlue}>
                                <Cog6ToothIcon className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className={styles.menuInfo}>
                                <h3 className={styles.menuTitle}>활동 통계</h3>
                                <p className={styles.menuDescription}>
                                    나의 건강 데이터와 성과를 확인하세요
                                </p>
                            </div>
                            <div className={styles.menuArrow}>›</div>
                        </div>
                    </div>
                </section>

                <section className={styles.actionSection}>
                    <button
                        onClick={handleLogout}
                        className={styles.logoutButton}
                    >
                        <div className={styles.actionContent}>
                            <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-600" />
                            <span className={styles.actionText}>로그아웃</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className={styles.deleteButton}
                    >
                        <div className={styles.actionContent}>
                            <TrashIcon className="w-5 h-5 text-red-600" />
                            <span className={styles.deleteText}>회원탈퇴</span>
                        </div>
                    </button>
                </section>

                <section className={styles.footer}>
                    <p className={styles.footerTitle}>FitForYou v1.0.0</p>
                    <p className={styles.footerSubtitle}>
                        건강한 하루를 위한 AI 맞춤 서비스
                    </p>
                </section>
            </div>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                userProfile={profileData}
            />

            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
            />
        </div>
    );
}
