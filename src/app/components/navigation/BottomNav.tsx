'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  PlusIcon, 
  BookmarkIcon, 
  UserIcon,
  CakeIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { 
  BookmarkIcon as BookmarkSolid, 
  UserIcon as UserSolid,
  CakeIcon as CakeSolid,
  BoltIcon as BoltSolid
} from '@heroicons/react/24/solid';

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
        id: 'diet',
        label: '식단',
        path: '/diet',
        Icon: CakeIcon,
        IconSolid: CakeSolid,
    },
    {
        id: 'workout',
        label: '운동',
        path: '/workout',
        Icon: BoltIcon,
        IconSolid: BoltSolid,
    },
    {
        id: 'add',
        label: '',
        path: '/add',
        Icon: PlusIcon,
        isSpecial: true,
    },
    {
        id: 'collection',
        label: '모아보기',
        path: '/collection',
        Icon: BookmarkIcon,
        IconSolid: BookmarkSolid,
    },
    {
        id: 'profile',
        label: '나의정보',
        path: '/profile',
        Icon: UserIcon,
        IconSolid: UserSolid,
    },
];

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [previousPath, setPreviousPath] = useState('/collection');

    const handleNavClick = (path: string) => {
        if (path === '/add') {
            // Add 버튼 특별 처리
            if (pathname === '/add') {
                // 현재 Add 페이지에 있다면 이전 페이지로 이동
                const targetPath = previousPath === '/add' ? '/collection' : previousPath;
                router.push(targetPath);
            } else {
                setPreviousPath(pathname);
                router.push('/add');
            }
        } else {
            setPreviousPath(pathname);
            router.push(path);
        }
    };

    const isAddButtonActive = pathname === '/add';

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg 
                        border-t border-gray-200/50 shadow-lg">
            <div className="flex items-center justify-around px-4 py-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;

                    if (item.isSpecial) {
                        // 가운데 추가하기 버튼 (크기 증가 + 애니메이션)
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.path)}
                                className="flex justify-center items-center relative -mt-8 
                                          hover:scale-110 transition-all duration-300 ease-out"
                            >
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center 
                                            border-4 shadow-xl transition-all duration-300 ease-out
                                            ${isActive 
                                                ? 'bg-primary border-primary-hover shadow-primary/50 scale-105' 
                                                : 'bg-white border-primary shadow-primary/30 hover:shadow-primary/40'
                                            }`}>
                                    <PlusIcon 
                                        className={`w-8 h-8 text-gray-800 transition-all duration-300 ease-out
                                                ${isAddButtonActive ? 'rotate-45 scale-110' : 'rotate-0 scale-100'}`} 
                                    />
                                </div>
                            </button>
                        );
                    }

                    // 일반 네비게이션 버튼들 (활성화 시 크기 증가 애니메이션)
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.path)}
                            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl
                                      transition-all duration-300 ease-out min-w-16 relative
                                      ${isActive 
                                        ? 'text-gray-800 transform scale-110' 
                                        : 'text-gray-500 hover:text-gray-700 hover:scale-105'
                                      }`}
                        >
                            {/* 활성화 배경 효과 */}
                            {isActive && (
                                <div className="absolute inset-0 bg-primary/10 rounded-xl scale-105 
                                              animate-pulse"></div>
                            )}
                            
                            <div className="relative z-10 flex flex-col items-center">
                                {/* 활성화 상태에 따라 아이콘 선택 */}
                                {isActive && item.IconSolid ? (
                                    <item.IconSolid 
                                        className={`w-6 h-6 mb-1 transition-all duration-300 ease-out
                                                  scale-110 drop-shadow-sm`}
                                    />
                                ) : (
                                    <item.Icon 
                                        className={`w-6 h-6 mb-1 transition-all duration-300 ease-out
                                                  scale-100`}
                                    />
                                )}
                                <span className={`text-xs font-medium transition-all duration-300 ease-out
                                                ${isActive ? 'font-bold scale-105' : 'font-normal scale-100'}`}>
                                    {item.label}
                                </span>
                            </div>
                            
                            {/* 활성화 점 표시 */}
                            {isActive && (
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 
                                              w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}