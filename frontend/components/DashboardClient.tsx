"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Flame, Zap, RefreshCcw, Send, CheckSquare, MessageCircle, LayoutDashboard } from "lucide-react";
import MessageModal from './MessageModal';

export default function DashboardClient() {
    const [leads, setLeads] = useState<any[]>([]);
    const [stats, setStats] = useState({ total_leads: 0, novos: 0, quentes: 0 });
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [chatLead, setChatLead] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resLeads, resStats] = await Promise.all([
                axios.get('http://127.0.0.1:8000/api/v1/leads/?limit=2000'),
                axios.get('http://127.0.0.1:8000/api/v1/leads/dashboard/stats')
            ]);

            // Ordenar por Data de Criação (Desc) se tiver campo created_at
            const sorted = resLeads.data.sort((a: any, b: any) =>
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );

            setLeads(sorted);
            setStats(resStats.data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleSelect = (id: string) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(lid => lid !== id));
        } else {
            setSelectedLeads([...selectedLeads, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedLeads.length === leads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(leads.map((l: any) => l.id));
        }
    };

    const handleBulkAction = () => {
        alert("Funcionalidade de Campanha Rápida em desenvolvimento.\nIDs selecionados: " + selectedLeads.length);
        // Futuro: Redirecionar para /campaigns/create com IDs
    };

    return (
        <div className="p-8 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
            {/* Header com Ações */}
            <div className="flex justify-between items-end mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-900/30 rounded-xl flex items-center justify-center border border-purple-500/30 text-purple-400">
                        <LayoutDashboard size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white leading-tight">
                            Dashboard
                        </h1>
                        <p className="text-neutral-500 text-sm">Visão geral do sistema</p>
                    </div>
                </div>

                {selectedLeads.length > 0 && (
                    <button onClick={handleBulkAction} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2 animate-in fade-in zoom-in transition-all">
                        <Send size={18} />
                        Enviar Saudação ({selectedLeads.length})
                    </button>
                )}
            </div>

            {/* KPI Cards (Stats) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card Total */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={100} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-neutral-400 font-medium text-sm">Total Leads</p>
                        <h3 className="text-4xl font-bold text-white mt-1">{stats.total_leads}</h3>
                    </div>
                </div>

                {/* Card Novos */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500 group-hover:opacity-20 transition-opacity">
                        <Zap size={100} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-blue-400 font-medium text-sm">Novos (Triagem)</p>
                        <h3 className="text-4xl font-bold text-white mt-1">{stats.novos}</h3>
                    </div>
                </div>

                {/* Card Quentes */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500 group-hover:opacity-20 transition-opacity">
                        <Flame size={100} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-amber-400 font-medium text-sm">Quentes 🔥</p>
                        <h3 className="text-4xl font-bold text-white mt-1">{stats.quentes}</h3>
                    </div>
                </div>
            </div>

            {/* Tabela de Leads */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Users size={18} className="text-purple-500" />
                        Últimos Cadastros
                    </h3>
                    <button onClick={fetchData} className="text-neutral-500 hover:text-white transition p-2 rounded-lg hover:bg-neutral-800" title="Atualizar">
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-950 text-neutral-400 text-xs uppercase tracking-wider font-semibold border-b border-neutral-800">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded bg-neutral-800 border-neutral-700 text-purple-600 focus:ring-purple-500/20 w-4 h-4 cursor-pointer"
                                        checked={leads.length > 0 && selectedLeads.length === leads.length}
                                        onChange={toggleSelectAll}
                                        title="Selecionar Todos"
                                    />
                                </th>
                                <th className="px-6 py-4">Nome</th>
                                <th className="px-6 py-4">Contato / Data</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Chat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {leads.map((lead: any) => (
                                <tr key={lead.id} className={`group transition-colors ${selectedLeads.includes(lead.id) ? 'bg-purple-900/10' : 'hover:bg-neutral-800/50'}`}>
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded bg-neutral-800 border-neutral-700 text-purple-600 focus:ring-purple-500/20 w-4 h-4 cursor-pointer"
                                            checked={selectedLeads.includes(lead.id)}
                                            onChange={() => toggleSelect(lead.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-300 border border-neutral-700">
                                                {lead.full_name ? lead.full_name[0].toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-neutral-200">{lead.full_name || 'Desconhecido'}</p>
                                                <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                                                    {lead.id.slice(0, 8)}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-mono text-sm text-neutral-400">{lead.phone_e164}</p>
                                        <p className="text-xs text-neutral-600 mt-1">
                                            {new Date(lead.created_at).toLocaleDateString('pt-BR')} às {new Date(lead.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {lead.lead_pipeline?.temperature === 'quente' ?
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">🔥 QUENTE</span>
                                            : lead.lead_pipeline?.stage === 'agendado' ?
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20">📅 AGENDADO</span>
                                                :
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-500 text-[10px] font-bold border border-neutral-700">❄️ FRIO</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => setChatLead(lead)}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 transition-colors"
                                            title="Conversar no Chat Interno"
                                        >
                                            <MessageCircle size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {leads.length === 0 && !loading && (
                    <div className="p-12 text-center text-neutral-500">
                        Nenhum lead encontrado.
                    </div>
                )}

                {/* Message Modal Integration */}
                {chatLead && (
                    <MessageModal
                        lead={chatLead}
                        onClose={() => setChatLead(null)}
                    />
                )}
            </div>
        </div>
    );
}
