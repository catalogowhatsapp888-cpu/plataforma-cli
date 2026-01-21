"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex">
            {!isLoginPage && <Sidebar />}

            <main className={`flex-1 transition-all duration-300 flex flex-col h-screen overflow-hidden ${!isLoginPage ? 'ml-64' : ''}`}>
                {children}
            </main>
        </div>
    );
}
