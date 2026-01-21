'use client';

import { useState, useEffect } from 'react';
import { Plus, Megaphone, Users, Calendar, ArrowRight, ArrowLeft, Clock, Play, Loader2, Trash2, Edit3 } from 'lucide-react';
import Link from 'next/link';

interface Campaign {
    id: string;
    name: string;
    status: 'draft' | 'active' | 'completed' | 'scheduled';
    created_at: string;
    audience_rules: {
        logic: string;
        conditions: Array<{ field: string; operator: string; value: string }>;
    };
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [executingId, setExecutingId] = useState<string | null>(null);

    useEffect(() => {
        fetch('http://localhost:8000/api/v1/campaigns/')
            .then(res => res.json())
            .then(data => {
                setCampaigns(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja apagar a campanha "${name}"?`)) return;
        try {
            const res = await fetch(`http://localhost:8000/api/v1/campaigns/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCampaigns(prev => prev.filter(c => c.id !== id));
            } else {
                alert("Erro ao apagar campanha");
            }
        } catch (e) {
            alert("Erro de conexão");
        }
    }

    const handleExecute = async (id: string, name: string) => {
        if (!confirm(`Deseja disparar a campanha "${name}"?\nIsso enviará mensagens reais para todos os clientes segmentados.`)) return;

        const force = confirm("Deseja FORÇAR o reenvio para contatos que JÁ receberam esta campanha?\n\nOK = Reenviar para todos (pode duplicar)\nCancelar = Enviar apenas para quem AINDA NÃO recebeu");

        setExecutingId(id);
        try {
            const res = await fetch(`http://localhost:8000/api/v1/campaigns/${id}/execute?force=${force}`, { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                alert(`✅ Campanha disparada com sucesso!\n\nAudiência Total: ${data.total_audience}\nEnviados Agora: ${data.sent_now}\nJá Enviados Antes: ${data.already_sent}`);
                // Atualizar status localmente
                setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'active' } : c));
            } else {
                alert("Erro ao disparar: " + (data.detail || JSON.stringify(data)));
            }
        } catch (e) {
            alert("Erro de conexão com o servidor.");
        } finally {
            setExecutingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-neutral-800 text-neutral-400 border-neutral-700';
            case 'active': return 'bg-green-900/30 text-green-400 border-green-900/50';
            case 'completed': return 'bg-blue-900/30 text-blue-400 border-blue-900/50';
            case 'scheduled': return 'bg-purple-900/30 text-purple-400 border-purple-900/50';
            default: return 'bg-neutral-800 text-neutral-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'draft': return 'Rascunho';
            case 'active': return 'Ativa';
            case 'completed': return 'Concluída';
            case 'scheduled': return 'Agendada';
            default: return status;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#0A0A0A] text-neutral-200 overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-[#0A0A0A]/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <Link href="/pipeline" className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white" title="Voltar ao Pipeline">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                        <Megaphone size={18} className="text-purple-400" />
                    </div>
                    <h1 className="font-semibold text-lg tracking-tight">Campanhas Inteligentes</h1>
                </div>

                <Link href="/campaigns/new">
                    <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2">
                        <Plus size={16} />
                        Nova Campanha
                    </button>
                </Link>
            </header>

            {/* Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-neutral-500 gap-2">
                        <div className="w-4 h-4 border-2 border-neutral-600 border-t-white rounded-full animate-spin"></div>
                        Carregando campanhas...
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                        <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mb-6 border border-neutral-800">
                            <Megaphone size={32} className="text-neutral-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">Nenhuma campanha ativa</h2>
                        <p className="text-neutral-500 mb-8">
                            Crie campanhas segmentadas para reengajar seus leads automaticamente. Use regras inteligentes baseadas em temperatura e comportamento.
                        </p>
                        <Link href="/campaigns/new">
                            <button className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/20 flex items-center gap-2">
                                Criar minha primeira campanha
                                <ArrowRight size={18} />
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {campaigns.map(campaign => (
                            <div key={campaign.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-all group overflow-hidden relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${getStatusColor(campaign.status)}`}>
                                        {getStatusLabel(campaign.status)}
                                    </div>
                                    <div className="text-neutral-600 group-hover:text-neutral-400 transition-colors">
                                        <Clock size={16} />
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1" title={campaign.name}>
                                    {campaign.name}
                                </h3>

                                <div className="text-xs text-neutral-500 mb-4 h-12 overflow-hidden">
                                    {campaign.audience_rules?.conditions?.length || 0} Regras de Segmentação
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {campaign.audience_rules?.conditions?.slice(0, 2).map((rule, idx) => (
                                            <span key={idx} className="bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-700">
                                                {rule.field === 'temperature' ? '🌡️' : '⚙️'} {rule.value}
                                            </span>
                                        ))}
                                        {(campaign.audience_rules?.conditions?.length || 0) > 2 && (
                                            <span className="text-neutral-600 text-[10px] py-0.5">+ mais</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                                    <span className="text-[10px] text-neutral-600">
                                        Criado em {new Date(campaign.created_at).toLocaleDateString()}
                                    </span>
                                    <div className="flex gap-2">
                                        <Link href={`/campaigns/${campaign.id}`}>
                                            <button className="w-8 h-8 rounded-lg text-neutral-600 hover:bg-neutral-800 hover:text-white flex items-center justify-center transition-all" title="Editar">
                                                <Edit3 size={16} />
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(campaign.id, campaign.name)}
                                            className="w-8 h-8 rounded-lg text-neutral-600 hover:bg-red-900/20 hover:text-red-500 flex items-center justify-center transition-all"
                                            title="Apagar Campanha"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <button
                                            onClick={() => handleExecute(campaign.id, campaign.name)}
                                            disabled={executingId === campaign.id || campaign.status === 'completed'}
                                            className="w-10 h-10 rounded-full bg-purple-600/10 text-purple-400 hover:bg-purple-600 hover:text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110 ml-2 shadow-lg shadow-purple-900/20"
                                            title="Disparar Campanha"
                                        >
                                            {executingId === campaign.id ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
