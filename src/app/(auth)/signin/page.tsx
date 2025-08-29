import { Metadata } from 'next';
import SignInForm from '@/app/components/forms/SignInForm';

export const metadata: Metadata = {
    title: 'FitForYou - 로그인',
    description: '계정에 로그인하여 맞춤형 건강 관리 서비스를 이용하세요',
};

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 
                        bg-[url('/background.png')] bg-cover bg-center bg-no-repeat
                        flex justify-center items-center p-4 py-8">
        <SignInForm />
        </div>
    );
}