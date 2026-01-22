"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === 'eduschefer@icloud.com' && password === '123456') {
            // Set cookie simples
            // Set cookie seguro (compatível com HTTPS)
            document.cookie = "auth_token=admin_session; path=/; max-age=86400; SameSite=Lax; Secure";
            router.push('/');
        } else {
            alert("Credenciais inválidas");
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-900/40">
                        <Lock size={24} />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-center text-white mb-2">Acesso Admin</h1>
                <p className="text-neutral-500 text-center mb-8">Plataforma Clínica Inteligente</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">E-mail</label>
                        <input
                            type="email"
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="eduschefer@icloud.com"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Senha</label>
                        <input
                            type="password"
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••"
                        />
                    </div>
                    <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition mt-4 hover:shadow-lg hover:shadow-purple-900/30 active:scale-[0.98]">
                        Entrar no Sistema
                    </button>
                </form>
            </div>
        </div>
    );
}
