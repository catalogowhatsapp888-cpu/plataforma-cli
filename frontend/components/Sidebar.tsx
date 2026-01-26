"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, KanbanSquare, Megaphone, Bot, Calendar, Settings, LogOut, Upload, Shield, Image as ImageIcon, Building } from 'lucide-react';
import { authService } from '../services/auth';

const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
    { name: 'Campanhas', href: '/campaigns', icon: Megaphone },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [customLogo, setCustomLogo] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Carregar logo do localStorage ao iniciar
    useEffect(() => {
        const savedLogo = localStorage.getItem('clinic_logo');
        if (savedLogo) setCustomLogo(savedLogo);

        // Verifica se é admin para mostrar menu
        const role = authService.getUserRole();
        setIsAdmin(role === 'admin');
    }, []);

    const handleLogout = () => {
        authService.logout();
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
                className="p-6 border-b border-neutral-800 flex flex-col items-center justify-center gap-2 cursor-pointer group relative hover:bg-neutral-900/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                title="Clique ou arraste uma imagem para alterar o logo"
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleLogoUpload}
                />

                {customLogo ? (
                    <div className="w-full h-[120px] flex items-center justify-center overflow-hidden p-0">
                        <img src={customLogo} alt="Logo Clínica" className="w-full h-full object-contain" />
                    </div>
                ) : (
                    <div className="w-full h-auto max-h-[120px] flex items-center justify-center p-2">
                        <img
                            src="/logo_superserver.png"
                            alt="SuperServer Logo"
                            className="w-full h-full object-contain max-h-[80px]"
                        />
                    </div>
                )}

                {/* Dica de Tamanho (visível apenas no hover ou se não tiver logo) */}
                <p className="text-[10px] text-neutral-600 group-hover:text-purple-400 transition-colors text-center mt-2 opacity-0 group-hover:opacity-100 absolute bottom-1 w-full">
                    Recomendado: 200x120px PNG Transparente
                </p>
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
                {/* Menu Admin - Visível apenas para ADMIN */}
                {isAdmin && (
                    <div className="mb-2">
                        <p className="px-4 text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-2">Administração</p>
                        <Link
                            href="/admin/company"
                            className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 group mb-1
                                ${pathname === '/admin/company'
                                    ? 'bg-amber-600/10 text-amber-400 border border-amber-600/20'
                                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent'
                                }
                            `}
                        >
                            <Building size={18} className={pathname === '/admin/company' ? 'text-amber-400' : 'text-neutral-500 group-hover:text-amber-400'} />
                            <span className="font-medium text-sm">Dados da Empresa</span>
                        </Link>
                        <Link
                            href="/admin/users"
                            className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 group
                                ${pathname === '/admin/users'
                                    ? 'bg-amber-600/10 text-amber-400 border border-amber-600/20'
                                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent'
                                }
                            `}
                        >
                            <Shield size={18} className={pathname === '/admin/users' ? 'text-amber-400' : 'text-neutral-500 group-hover:text-amber-400'} />
                            <span className="font-medium text-sm">Usuários e Acesso</span>
                        </Link>
                    </div>
                )}

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
                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs">U</div>
                <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{isAdmin ? 'Admin' : 'Usuário'}</p>
                    <p className="text-[10px] text-neutral-500 truncate">Logado no Superserver</p>
                </div>
            </div>
        </aside>
    );
}
