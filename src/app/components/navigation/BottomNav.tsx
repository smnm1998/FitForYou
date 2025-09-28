"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
    PlusIcon,
    BookmarkIcon,
    UserIcon,
    CakeIcon,
    BoltIcon,
} from "@heroicons/react/24/outline";
import {
    BookmarkIcon as BookmarkSolid,
    UserIcon as UserSolid,
    CakeIcon as CakeSolid,
    BoltIcon as BoltSolid,
} from "@heroicons/react/24/solid";
import styles from "./BottomNav.module.css";
import clsx from "clsx";

interface NavItem {
    id: string;
    label: string;
    path: string;
    Icon: React.ComponentType<{ className?: string }>;
    IconSolid?: React.ComponentType<{ className?: string }>;
    isSpecial?: boolean;
}

const navItems: NavItem[] = [
    {
        id: "diet",
        label: "식단",
        path: "/diet",
        Icon: CakeIcon,
        IconSolid: CakeSolid,
    },
    {
        id: "workout",
        label: "운동",
        path: "/workout",
        Icon: BoltIcon,
        IconSolid: BoltSolid,
    },
    {
        id: "add",
        label: "",
        path: "/add",
        Icon: PlusIcon,
        isSpecial: true,
    },
    {
        id: "collection",
        label: "모아보기",
        path: "/collection",
        Icon: BookmarkIcon,
        IconSolid: BookmarkSolid,
    },
    {
        id: "profile",
        label: "나의정보",
        path: "/profile",
        Icon: UserIcon,
        IconSolid: UserSolid,
    },
];

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [previousPath, setPreviousPath] = useState("/collection");

    // loading 페이지에서는 하단바를 숨김
    if (pathname.startsWith("/loading")) {
        return null;
    }

    const handleNavClick = (path: string) => {
        if (path === "/add") {
            // Add 버튼 특별 처리
            if (isAddButtonActive) {
                // 현재 Add 관련 페이지에 있다면 이전 페이지로 이동
                const targetPath =
                    previousPath === "/add" ||
                    previousPath.startsWith("/create") ||
                    previousPath.startsWith("/loading")
                        ? "/collection"
                        : previousPath;
                router.push(targetPath);
            } else {
                setPreviousPath(pathname);
                router.push("/add");
            }
        } else {
            setPreviousPath(pathname);
            router.push(path);
        }
    };

    // 추가하기 관련 경로들을 모두 체크
    const addRelatedPaths = ["/add", "/create", "/loading"];
    const isAddButtonActive = addRelatedPaths.some((path) =>
        pathname.startsWith(path)
    );

    return (
        <nav className={styles.navContainer}>
            <div className={styles.navWrapper}>
                {navItems.map((item) => {
                    const isActive = pathname === item.path;

                    if (item.isSpecial) {
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.path)}
                                className={styles.specialButton}
                            >
                                <div
                                    className={clsx(styles.specialButtonInner, {
                                        [styles.active]: isAddButtonActive,
                                    })}
                                >
                                    <PlusIcon
                                        className={clsx(styles.plusIcon, {
                                            [styles.active]: isAddButtonActive,
                                        })}
                                    />
                                </div>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.path)}
                            className={clsx(styles.navButton, {
                                [styles.active]: isActive,
                            })}
                        >
                            {isActive && (
                                <div className={styles.activeBg}></div>
                            )}
                            <div className={styles.iconContainer}>
                                {isActive && item.IconSolid ? (
                                    <item.IconSolid
                                        className={clsx(
                                            styles.icon,
                                            styles.active
                                        )}
                                    />
                                ) : (
                                    <item.Icon className={styles.icon} />
                                )}
                                <span
                                    className={clsx(styles.label, {
                                        [styles.active]: isActive,
                                    })}
                                >
                                    {item.label}
                                </span>
                            </div>
                            {isActive && (
                                <div className={styles.activeDot}></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
