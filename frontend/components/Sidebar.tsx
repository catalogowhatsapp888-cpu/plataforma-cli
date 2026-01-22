"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, KanbanSquare, Megaphone, Bot, Calendar, Settings, LogOut, Upload, Image as ImageIcon } from 'lucide-react';

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
    const [customLogo, setCustomLogo] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Carregar logo do localStorage ao iniciar
    useEffect(() => {
        const savedLogo = localStorage.getItem('clinic_logo');
        if (savedLogo) setCustomLogo(savedLogo);
    }, []);

    const handleLogout = () => {
        // Para deletar cookie secure, é preciso passar os mesmos atributos (exceto max-age=0)
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
        // Fallback pra localhost (sem secure)
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push('/login');
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setCustomLogo(base64);
                localStorage.setItem('clinic_logo', base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setCustomLogo(base64);
                localStorage.setItem('clinic_logo', base64);
            };
            reader.readAsDataURL(file);
        }
    };

    // Se for login, não renderiza
    if (pathname === '/login') return null;

    return (
        <aside className="w-64 bg-neutral-950 border-r border-neutral-800 h-screen flex flex-col fixed left-0 top-0 z-50">
            {/* Área do Logo Editável */}
            <div
                className="p-6 border-b border-neutral-800 flex items-center gap-2 cursor-pointer group relative hover:bg-neutral-900/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                title="Clique ou arraste uma imagem para alterar o logo"
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                />

                {customLogo ? (
                    <div className="w-full h-16 flex items-center justify-center overflow-hidden">
                        <img src={customLogo} alt="Logo Clínica" className="w-full h-full object-contain" />
                    </div>
                ) : (
                    <>
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-purple-900/20 group-hover:scale-105 transition-transform">
                            PC
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent leading-tight">
                                Clinica AI
                            </h1>
                            <p className="text-[10px] text-neutral-600 group-hover:text-purple-400 transition-colors flex items-center gap-1">
                                <Upload size={10} /> Personalizar
                            </p>
                        </div>
                    </>
                )}
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
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-900/30"
                >
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
