'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        retry: 1,
                    },
                },
            })
    );

    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                {children}
                <Toaster
                    position="top-center"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: '#fff',
                            color: '#333',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                            borderRadius: '12px',
                            padding: '16px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#2ed573',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </SessionProvider>
    )
}