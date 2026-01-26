"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Plus, Trash2, Edit2, User, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'vendedor',
        is_active: true
    });

    const router = useRouter();
    const API_URL = 'http://127.0.0.1:8000/api/v1';

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/users/`);
            setUsers(res.data);
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            // Se erro 403/401, o interceptor já deve tratar, mas podemos forçar redirect
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este usuário?")) return;
        try {
            await axios.delete(`${API_URL}/users/${id}`);
            fetchUsers();
            alert("Usuário removido com sucesso.");
        } catch (error: any) {
            alert("Erro ao remover: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/users/`, formData);
            setShowModal(false);
            setFormData({ name: '', email: '', password: '', role: 'vendedor', is_active: true });
            fetchUsers();
            alert("Usuário criado com sucesso!");
        } catch (error: any) {
            alert("Erro ao criar: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8"> {/* pl-72 para compensar Sidebar fixa */}
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Shield className="text-purple-500" size={32} />
                            Gestão de Usuários
                        </h1>
                        <p className="text-neutral-500 mt-1">Gerencie o acesso da sua equipe ao Superserver.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20"
                    >
                        <Plus size={20} />
                        Novo Usuário
                    </button>
                </div>

                {/* Tabela */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-950 text-neutral-400 text-xs uppercase tracking-wider font-semibold border-b border-neutral-800">
                            <tr>
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Cargo (Role)</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-neutral-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 border border-neutral-700 font-bold">
                                                {user.name ? user.name[0].toUpperCase() : <User size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-neutral-200">{user.name}</p>
                                                <p className="text-sm text-neutral-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.role === 'admin'
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            : user.role === 'supervisor'
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                                            }`}>
                                            {user.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user.is_active ?
                                            <span className="inline-flex items-center gap-1 text-green-500 text-xs font-bold"><CheckCircle size={14} /> ATIVO</span> :
                                            <span className="inline-flex items-center gap-1 text-red-500 text-xs font-bold"><XCircle size={14} /> INATIVO</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-neutral-500 hover:text-red-400 transition p-2 hover:bg-red-500/10 rounded-lg"
                                            title="Remover"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Criação */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Novo Usuário</h2>
                            <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-white">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nome Completo</label>
                                <input
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white outline-none focus:border-purple-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">E-mail</label>
                                <input
                                    type="email"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white outline-none focus:border-purple-500"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Senha Provisória</label>
                                <input
                                    type="password"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white outline-none focus:border-purple-500"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Função (Role)</label>
                                <select
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white outline-none focus:border-purple-500"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="vendedor">Vendedor</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="admin">Admin</option>
                                    <option value="leitor">Leitor</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-bold transition">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold transition">
                                    Criar Usuário
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
