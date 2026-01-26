"use client";
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { authService } from '../services/auth';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isLoginPage = pathname === '/login';

    useEffect(() => {
        if (!isLoginPage && !authService.isAuthenticated()) {
            router.push('/login');
        }
    }, [pathname, isLoginPage, router]);

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex">
            {!isLoginPage && <Sidebar />}

            <main className={`flex-1 transition-all duration-300 flex flex-col h-screen overflow-hidden ${!isLoginPage ? 'ml-64' : ''}`}>
                {children}
            </main>
        </div>
    );
}
