import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'FitForYou - 시작하기',
    description: '내 하루와 건강을 나답게, 모든 것을 당신에게 핏하게',
};

export default function HomePage() {
    return (
        <div className="h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 
                        bg-[url('/background.png')] bg-cover bg-center bg-no-repeat
                        flex flex-col justify-center items-center p-4 py-6 overflow-hidden relative">
        <div className="flex flex-col items-center max-w-lg w-full px-4">
            
            {/* 로고 섹션 */}
            <div className="mb-8">
            <Image
                src="/Logo.png"
                alt="FitForYou 로고"
                width={300}
                height={120}
                priority
                className="w-52 h-auto sm:w-64 md:w-80"
            />
            </div>

            {/* 소개 텍스트 */}
            <div className="text-center w-full mb-12">
            <p className="text-sm font-semibold text-gray-800 mb-3 break-keep sm:text-base md:text-lg">
                내 하루와 건강을 나답게, 모든 것을 당신에게 핏하게
            </p>
            <p className="text-sm font-semibold text-gray-800 break-keep sm:text-base md:text-lg">
                지금 시작해보세요!
            </p>
            </div>
        </div>

        {/* 버튼 섹션 - 하단 고정 */}
        <div className="absolute bottom-8 left-4 right-4 max-w-lg mx-auto">
            <div className="w-full space-y-4">
                {/* 시작하기 버튼 */}
                <Link 
                    href="/collection"
                    className="w-full block py-4 px-6 bg-primary text-center text-gray-800 
                            font-semibold rounded-xl transition-all duration-200 
                            hover:bg-primary-hover hover:transform hover:-translate-y-0.5
                            shadow-md hover:shadow-lg text-base sm:text-lg"
                >
                    시작하기
                </Link>

                {/* 로그인 링크 */}
                <div className="text-center">
                    <p className="text-sm text-gray-600 sm:text-base">
                        이미 계정이 있으신가요?{' '}
                        <Link 
                        href="/signin" 
                        className="text-gray-800 font-bold underline hover:no-underline 
                                transition-all duration-200"
                        >
                        로그인
                        </Link>
                    </p>
                </div>
            </div>
        </div>
        </div>
    );
}