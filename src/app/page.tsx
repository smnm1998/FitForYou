import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'FitForYou - 시작하기',
    description: '내 하루와 건강을 나답게, 모든 것을 당신에게 핏하게',
};

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 
                        bg-[url('/background.png')] bg-cover bg-center bg-no-repeat
                        flex flex-col justify-center items-center p-5">
        <div className="flex flex-col items-center max-w-lg w-full px-4">
            
            {/* 로고 섹션 */}
            <div className="mt-20 mb-8">
            <Image
                src="/Logo.png"
                alt="FitForYou 로고"
                width={300}
                height={120}
                priority
                className="w-60 h-auto sm:w-80 md:w-96"
            />
            </div>

            {/* 소개 텍스트 */}
            <div className="text-center w-full mb-48">
            <p className="text-sm font-semibold text-gray-800 mb-2 break-keep sm:text-base">
                내 하루와 건강을 나답게, 모든 것을 당신에게 핏하게
            </p>
            <p className="text-sm font-semibold text-gray-800 break-keep sm:text-base">
                지금 시작해보세요!
            </p>
            </div>

            {/* 시작하기 버튼 */}
            <div className="w-full mb-3">
            <Link 
                href="/collection"
                className="w-full block py-4 px-6 bg-primary text-center text-gray-800 
                        font-semibold rounded-xl transition-all duration-200 
                        hover:bg-primary-hover hover:transform hover:-translate-y-0.5
                        shadow-md hover:shadow-lg text-base sm:text-lg"
            >
                시작하기
            </Link>
            </div>

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
    );
}