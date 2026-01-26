'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Megaphone, Users, Calendar, ArrowRight, ArrowLeft, Clock, Play, Loader2, Trash2, Edit3 } from 'lucide-react';
import Link from 'next/link';

interface Campaign {
    id: string;
    name: string;
    status: 'draft' | 'active' | 'completed' | 'scheduled';
    created_at: string;
    media_url?: string;
    message_template?: string;
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
        api.get('/campaigns')
            .then(res => {
                // Ensure it is an array
                if (Array.isArray(res.data)) {
                    setCampaigns(res.data);
                } else {
                    console.error("Expected array but got:", res.data);
                    setCampaigns([]);
                }
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
            await api.delete(`/campaigns/${id}`);
            setCampaigns(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            alert("Erro ao apagar campanha");
        }
    }

    const handleExecute = async (id: string, name: string) => {
        if (!confirm(`Deseja disparar a campanha "${name}"?\nIsso enviará mensagens reais para todos os clientes segmentados.`)) return;

        const force = confirm("Deseja FORÇAR o reenvio para contatos que JÁ receberam esta campanha?\n\nOK = Reenviar para todos (pode duplicar)\nCancelar = Enviar apenas para quem AINDA NÃO recebeu");

        setExecutingId(id);
        try {
            const res = await api.post(`/campaigns/${id}/execute?force=${force}`);
            const data = res.data;

            alert(`✅ Campanha disparada com sucesso!\n\nAudiência Total: ${data.total_audience}\nEnviados Agora: ${data.sent_now}\nJá Enviados Antes: ${data.already_sent}`);
            // Atualizar status localmente
            setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'active' } : c));
        } catch (e: any) {
            const msg = e.response?.data?.detail || "Erro de conexão";
            alert("Erro ao disparar: " + msg);
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
        <div className="min-h-screen bg-neutral-900 text-white p-6 font-sans overflow-hidden flex flex-col">
            {/* Header Padrão */}
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center border border-purple-500/30 text-purple-400">
                        <Megaphone size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white leading-tight">Campanhas</h1>
                        <p className="text-xs text-neutral-500 font-medium">Automação e engajamento</p>
                    </div>
                </div>

                <Link href="/campaigns/new">
                    <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2 shadow-lg">
                        <Plus size={16} />
                        Nova Campanha
                    </button>
                </Link>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
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
                            <div key={campaign.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-neutral-700 transition-all group overflow-hidden relative shadow-lg flex flex-col">
                                {/* Image Preview */}
                                {campaign.media_url ? (
                                    <div className="w-full h-48 bg-neutral-950 relative overflow-hidden group-hover:opacity-90 transition-opacity">
                                        <img src={campaign.media_url} alt={campaign.name} className="w-full h-full object-cover" />
                                        <div className="absolute top-3 left-3">
                                            <div className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider backdrop-blur-sm shadow-sm ${getStatusColor(campaign.status)}`}>
                                                {getStatusLabel(campaign.status)}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-24 bg-gradient-to-br from-neutral-800 to-neutral-900 relative">
                                        <div className="absolute top-4 left-4">
                                            <div className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${getStatusColor(campaign.status)}`}>
                                                {getStatusLabel(campaign.status)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight" title={campaign.name}>
                                        {campaign.name}
                                    </h3>

                                    <div className="flex-1">
                                        {/* Preview da Mensagem */}
                                        <div className="text-xs text-neutral-500 mb-1 font-medium uppercase tracking-wider">
                                            Mensagem
                                        </div>
                                        <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800 mb-4 h-16 overflow-hidden">
                                            <p className="text-sm text-neutral-300 line-clamp-2 leading-relaxed font-mono opacity-80">
                                                {campaign.message_template || "Sem mensagem configurada..."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-neutral-800 mt-auto">
                                        <span className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(campaign.created_at).toLocaleDateString()}
                                        </span>
                                        <div className="flex gap-2">
                                            <Link href={`/campaigns/${campaign.id}`}>
                                                <button className="w-9 h-9 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white flex items-center justify-center transition-all bg-neutral-800/50" title="Editar">
                                                    <Edit3 size={16} />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(campaign.id, campaign.name)}
                                                className="w-9 h-9 rounded-lg text-neutral-400 hover:bg-red-900/20 hover:text-red-500 flex items-center justify-center transition-all bg-neutral-800/50"
                                                title="Apagar Campanha"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleExecute(campaign.id, campaign.name)}
                                                disabled={executingId === campaign.id || campaign.status === 'completed'}
                                                className="w-12 h-12 -mt-1 -mb-1 rounded-full bg-purple-600 text-white hover:bg-purple-500 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-purple-900/30 shadow-lg ml-2"
                                                title="Disparar Campanha"
                                            >
                                                {executingId === campaign.id ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                                            </button>
                                        </div>
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
