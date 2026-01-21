"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, KanbanSquare, Megaphone, Bot, Calendar, Settings, LogOut } from 'lucide-react';

const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
    { name: 'Campanhas', href: '/campaigns', icon: Megaphone },
    { name: 'Inteligência IA', href: '/ai', icon: Bot },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        document.cookie = "auth_token=; path=/; max-age=0";
        router.push('/login');
    };

    // Se for login, não renderiza (será controlado pelo layout pai também, mas segurança dupla visual)
    if (pathname === '/login') return null;

    return (
        <aside className="w-64 bg-neutral-950 border-r border-neutral-800 h-screen flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 border-b border-neutral-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white">PC</div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
                    Clinica AI
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <div className="mb-4 text-xs font-bold text-neutral-600 uppercase tracking-wider px-4">Menu Principal</div>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                ${isActive
                                    ? 'bg-purple-600/10 text-purple-400 border border-purple-600/20 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent'
                                }
                            `}
                        >
                            <item.icon size={20} className={isActive ? 'text-purple-400' : 'text-neutral-500 group-hover:text-neutral-300'} />
                            <span className="font-medium text-sm">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-neutral-800 space-y-2">
                <Link
                    href="/settings"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors border border-transparent
                        ${pathname === '/settings'
                            ? 'bg-neutral-800 text-white'
                            : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'}
                    `}
                >
                    <Settings size={20} />
                    <span className="font-medium text-sm">Configurações</span>
                </Link>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-900/30">
                    <LogOut size={20} />
                    <span className="font-medium text-sm">Sair</span>
                </button>
            </div>

            {/* User Profile Mini */}
            <div className="p-4 bg-neutral-900/50 mx-4 mb-4 rounded-xl border border-neutral-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs">AD</div>
                <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">Admin</p>
                    <p className="text-[10px] text-neutral-500 truncate">admin@clinica.com</p>
                </div>
            </div>
        </aside>
    );
}
