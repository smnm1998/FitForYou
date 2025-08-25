import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import BottomNav from '@/app/components/navigation/BottomNav';

export default async function DashboardLayout({
    children,
    }: {
    children: React.ReactNode;
    }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/signin');
    }

    return (
        <div className="min-h-screen bg-gray-50">
        <main className="pb-20">
            {children}
        </main>
        <BottomNav />
        </div>
    );
}