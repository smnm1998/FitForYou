import { Metadata } from 'next';
import SignUpForm from '@/app/components/forms/SignUpForm';

export const metadata: Metadata = {
    title: 'FitForYou - 회원가입',
    description: '맞춤형 건강 관리 서비스 회원가입',
};

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 
                        bg-[url('/background.png')] bg-cover bg-center bg-no-repeat
                        flex justify-center items-center p-4">
        <SignUpForm />
        </div>
    );
}