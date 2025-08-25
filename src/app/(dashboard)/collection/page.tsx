import { Metadata } from 'next';
import CollectionContent from '@/app/components/dashboard/CollectionContent';

export const metadata: Metadata = {
    title: 'FitForYou - 모아보기',
    description: '건강 관리 대시보드 및 통계',
};

export default function CollectionPage() {
    return <CollectionContent />;
}