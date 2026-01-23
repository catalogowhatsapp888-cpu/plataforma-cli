'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, Users, RefreshCw, Save, Image as ImageIcon, Upload, X, CheckSquare, Square, BarChart3, CheckCircle, XCircle, AlertCircle, Flame, MessageSquare, LayoutList } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

// Tipos
interface Condition {
    id: string; // Front-only ID
    field: string;
    operator: string;
    value: string;
}

interface PreviewData {
    count: number;
    total_leads: number;
    sample: Array<{ id: string; full_name: string; phone: string; temperature: string }>;
    query_time_ms: number;
}

interface CampaignStats {
    status: string;
    total: number;
    sent: number;
    failed: number;
    processed: number;
    pending: number;
}

export default function EditCampaignPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [name, setName] = useState('');
    const [status, setStatus] = useState('draft');
    const [stats, setStats] = useState<any>(null); // Moved and type changed to any as per instruction
    const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');
    const [leads, setLeads] = useState<any[]>([]);
    const [message, setMessage] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [excludedIds, setExcludedIds] = useState<string[]>([]);

    const [conditions, setConditions] = useState<Condition[]>([
        { id: '1', field: 'temperature', operator: 'equals', value: 'quente' }
    ]);
    const [logic, setLogic] = useState<'AND' | 'OR'>('AND');

    // Preview State
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Stats State
    // Lead Tracking Logic
    const fetchLeads = useCallback(() => {
        if (!id || id === 'new') return;
        fetch(`http://localhost:8000/api/v1/campaigns/${id}/leads`)
            .then(r => r.json())
            .then(setLeads)
            .catch(console.error);
    }, [id]);

    useEffect(() => {
        if (viewMode === 'details' && status !== 'draft') {
            fetchLeads();
            const interval = setInterval(fetchLeads, 10000);
            return () => clearInterval(interval);
        }
    }, [viewMode, fetchLeads, status]);

    // Carregar Dados Iniciais
    useEffect(() => {
        if (!id || id === 'new') {
            setInitialLoading(false);
            return;
        }

        fetch(`http://localhost:8000/api/v1/campaigns/${id}`)
            .then(r => {
                if (!r.ok) throw new Error("Campanha não encontrada");
                return r.json();
            })
            .then(data => {
                setName(data.name);
                setStatus(data.status);
                setMessage(data.message_template || '');
                setMediaUrl(data.media_url || '');
                setExcludedIds(data.excluded_contacts || []);

                if (data.audience_rules) {
                    setLogic(data.audience_rules.logic || 'AND');
                    if (Array.isArray(data.audience_rules.conditions)) {
                        setConditions(data.audience_rules.conditions.map((c: any) => ({
                            id: Math.random().toString(),
                            field: c.field,
                            operator: c.operator,
                            value: c.value
                        })));
                    }
                }
                setInitialLoading(false);
            })
            .catch(err => {
                console.error(err);
                alert("Erro ao carregar campanha: " + err.message);
                router.push('/campaigns');
            });
    }, [id, router]);

    // Polling Stats if Active
    useEffect(() => {
        if (status === 'draft' || !id || id === 'new') return;

        const loadStats = () => {
            fetch(`http://localhost:8000/api/v1/campaigns/${id}/stats`)
                .then(r => r.json())
                .then(data => setStats(data))
                .catch(console.error);
        };

        loadStats();
        const interval = setInterval(loadStats, 3000); // 3s polling
        return () => clearInterval(interval);
    }, [id, status]);

    // Debounce Logic (Preview)
    const fetchPreview = useCallback(async () => {
        if (initialLoading) return;
        setLoading(true);
        try {
            const payload = {
                audience_rules: {
                    logic,
                    conditions: conditions.map(({ field, operator, value }) => ({ field, operator, value }))
                }
            };

            const res = await fetch('http://localhost:8000/api/v1/campaigns/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            setPreview(data);
        } catch (err) {
            console.error("Preview failed", err);
        } finally {
            setLoading(false);
        }
    }, [conditions, logic, initialLoading]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPreview();
        }, 800);
        return () => clearTimeout(timer);
    }, [fetchPreview]);

    // Actions
    const handleFileUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/api/v1/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                setMediaUrl(data.url);
            } else {
                alert("Falha no upload");
            }
        } catch (e) {
            alert("Erro no upload");
        }
    };

    const addCondition = () => {
        setConditions([...conditions, { id: Math.random().toString(), field: 'temperature', operator: 'equals', value: '' }]);
    };

    const removeCondition = (id: string) => {
        if (conditions.length === 1) return;
        setConditions(conditions.filter(c => c.id !== id));
    };

    const updateCondition = (id: string, field: keyof Condition, val: string) => {
        setConditions(conditions.map(c => c.id === id ? { ...c, [field]: val } : c));
    };

    const toggleExclusion = (contactId: string) => {
        setExcludedIds(prev => {
            if (prev.includes(contactId)) {
                return prev.filter(id => id !== contactId); // Remove da blacklist (Habilita)
            } else {
                return [...prev, contactId]; // Adiciona na blacklist (Desabilita)
            }
        });
    }

    const handleSave = async () => {
        if (!name) return alert("Dê um nome para a campanha");
        setSaving(true);
        try {
            const payload = {
                name,
                message_template: message,
                media_url: mediaUrl,
                excluded_contacts: excludedIds, // Salva Blacklist
                audience_rules: {
                    logic,
                    conditions: conditions.map(({ field, operator, value }) => ({ field, operator, value }))
                }
            };

            const res = await fetch(`http://localhost:8000/api/v1/campaigns/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/campaigns');
            } else {
                alert('Erro ao atualizar');
            }
        } catch (e) {
            alert('Erro de conexão');
        } finally {
            setSaving(false);
        }
    };

    if (initialLoading) {
        return <div className="h-screen bg-[#0A0A0A] flex items-center justify-center text-white">Carregando campanha...</div>;
    }

    // Calcula quantos estão ativos na amostra visível
    const activeInSample = preview?.sample.filter(c => !excludedIds.includes(c.id)).length || 0;

    // #######################
    // VIEW: DASHBOARD (Active/Completed)
    // #######################
    if (status !== 'draft' && id !== 'new') {
        const percentage = stats && stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0;

        return (
            <div className="flex flex-col h-screen bg-[#0A0A0A] text-neutral-200 font-sans">
                <header className="h-16 border-b border-neutral-800 flex items-center gap-4 px-6 bg-[#0A0A0A]">
                    <Link href="/campaigns" className="text-neutral-500 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-none">{name}</h1>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${status === 'active' ? 'text-green-500' : 'text-blue-500'
                            }`}>
                            {status === 'active' ? 'Em Execução' : 'Concluída'}
                        </span>
                    </div>
                </header>

                <main className="p-10 max-w-6xl mx-auto w-full">
                    {/* Tabs */}
                    <div className="flex gap-6 border-b border-neutral-800 mb-8">
                        <button
                            onClick={() => setViewMode('summary')}
                            className={`pb-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${viewMode === 'summary' ? 'border-purple-500 text-purple-400' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                        >
                            <BarChart3 size={18} /> Visão Geral
                        </button>
                        <button
                            onClick={() => setViewMode('details')}
                            className={`pb-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${viewMode === 'details' ? 'border-purple-500 text-purple-400' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                        >
                            <LayoutList size={18} /> Relatório Detalhado
                        </button>
                    </div>

                    {viewMode === 'summary' ? (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                                <Card icon={<Users className="text-purple-400" />} label="Audiência Total" value={stats?.total || 0} />
                                <Card icon={<BarChart3 className="text-blue-400" />} label="Processados" value={stats?.processed || 0} sub={`${percentage}%`} />
                                <Card icon={<CheckCircle className="text-green-400" />} label="Enviados" value={stats?.sent || 0} />
                                <Card icon={<XCircle className="text-red-400" />} label="Falhas" value={stats?.failed || 0} />
                            </div>

                            {/* Progress Section */}
                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 to-transparent pointer-events-none" />
                                <div className="flex justify-between items-end mb-4 relative z-10">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">Progresso do Envio</h3>
                                        <p className="text-neutral-500 text-sm">Acompanhe o disparo das mensagens em tempo real.</p>
                                    </div>
                                    <div className="text-4xl font-bold text-white tracking-tighter">{percentage}%</div>
                                </div>

                                <div className="h-4 bg-neutral-800 rounded-full overflow-hidden mb-2 relative z-10">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-500 ease-out shadow-[0_0_20px_rgba(147,51,234,0.5)]"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-neutral-500 font-medium font-mono uppercase relative z-10">
                                    <span>Início</span>
                                    <span>{stats?.pending || 0} pendentes</span>
                                    <span>Conclusão</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <LeadTable leads={leads} />
                    )}
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#0A0A0A] text-neutral-200">
            {/* Header */}
            <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-[#0A0A0A] z-20">
                <div className="flex items-center gap-4">
                    <Link href="/campaigns" className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="font-semibold text-lg leading-tight">Editar Campanha</h1>
                        <p className="text-xs text-neutral-500">Atualize as regras e mensagens</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                        Salvar Alterações
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Builder */}
                <div className="w-1/2 border-r border-neutral-800 p-8 overflow-y-auto">

                    {/* Nome */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Nome da Campanha</label>
                        <input
                            type="text"
                            autoComplete="off"
                            name="campaign_name_edit"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ex: Recuperação de Inativos - Jan/26"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                        />
                    </div>

                    {/* Regras */}
                    <div className="mb-6 flex items-center justify-between">
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Regras de Segmentação</label>
                        <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                            <button
                                onClick={() => setLogic('AND')}
                                className={`text-xs px-3 py-1 rounded-md font-medium transition-all ${logic === 'AND' ? 'bg-purple-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                TODAS (E)
                            </button>
                            <button
                                onClick={() => setLogic('OR')}
                                className={`text-xs px-3 py-1 rounded-md font-medium transition-all ${logic === 'OR' ? 'bg-purple-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                QUALQUER (OU)
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {conditions.map((cond, idx) => (
                            <div key={cond.id} className="flex gap-2 items-start group">
                                <div className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 grid grid-cols-12 gap-3 hover:border-neutral-700 transition-colors">
                                    {/* Campo */}
                                    <div className="col-span-4">
                                        <select
                                            className="w-full bg-transparent text-sm text-neutral-300 focus:outline-none"
                                            value={cond.field}
                                            onChange={e => {
                                                updateCondition(cond.id, 'field', e.target.value);
                                                updateCondition(cond.id, 'value', '');
                                            }}
                                        >
                                            <option value="temperature">Temperatura</option>
                                            <option value="stage">Estágio do Funil</option>
                                            <option value="is_active">Cliente Ativo?</option>
                                        </select>
                                    </div>

                                    {/* Operador */}
                                    <div className="col-span-3 border-l border-neutral-800 pl-3">
                                        <select
                                            className="w-full bg-transparent text-sm text-neutral-400 focus:outline-none"
                                            value={cond.operator}
                                            onChange={e => updateCondition(cond.id, 'operator', e.target.value)}
                                        >
                                            <option value="equals">É Igual a</option>
                                            <option value="not_equals">Diferente de</option>
                                        </select>
                                    </div>

                                    {/* Valor */}
                                    <div className="col-span-5 border-l border-neutral-800 pl-3">
                                        {cond.field === 'temperature' ? (
                                            <select
                                                className="w-full bg-transparent text-sm text-white font-medium focus:outline-none"
                                                value={cond.value}
                                                onChange={e => updateCondition(cond.id, 'value', e.target.value)}
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="frio">❄️ Frio</option>
                                                <option value="morno">☁️ Morno</option>
                                                <option value="quente">🔥 Quente</option>
                                            </select>
                                        ) : cond.field === 'stage' ? (
                                            <select
                                                className="w-full bg-transparent text-sm text-white font-medium focus:outline-none"
                                                value={cond.value}
                                                onChange={e => updateCondition(cond.id, 'value', e.target.value)}
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="novo">Novo</option>
                                                <option value="nao_lido">🔴 Responder</option>
                                                <option value="contactado">Contactado</option>
                                                <option value="agendado">Agendado</option>
                                                <option value="perdido">Perdido</option>
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                autoComplete="off"
                                                name={`cond-value-${cond.id}`}
                                                className="w-full bg-transparent text-sm text-white font-medium focus:outline-none placeholder-neutral-600"
                                                placeholder="Valor..."
                                                value={cond.value}
                                                onChange={e => updateCondition(cond.id, 'value', e.target.value)}
                                            />
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => removeCondition(cond.id)}
                                    className="p-3 text-neutral-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addCondition}
                        className="mt-4 w-full py-3 border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-sm font-medium hover:border-neutral-600 hover:text-neutral-300 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} />
                        Adicionar Condição
                    </button>

                    {/* Mensagem da Campanha */}
                    <div className="mt-8 border-t border-neutral-800 pt-8">
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Mensagem do WhatsApp</label>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 focus-within:border-purple-500 transition-colors">
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Olá! Temos uma condição especial para você..."
                                rows={4}
                                className="w-full bg-transparent text-sm text-white placeholder-neutral-600 focus:outline-none resize-none mb-3"
                            />

                            {/* Media Dropzone */}
                            {mediaUrl ? (
                                <div className="relative mt-2 rounded-xl overflow-hidden border border-neutral-700 group">
                                    <div className="bg-neutral-900 border-b border-neutral-800 p-2 flex items-center gap-2">
                                        <ImageIcon size={14} className="text-neutral-500" />
                                        <span className="text-[10px] text-neutral-400 truncate flex-1">{mediaUrl.split('/').pop()}</span>
                                    </div>
                                    {mediaUrl.match(/\.(mp4|webm)$/i) ? (
                                        <video src={mediaUrl} className="w-full h-48 object-cover bg-black" controls />
                                    ) : (
                                        <img src={mediaUrl} alt="Media" className="w-full h-48 object-cover bg-black" />
                                    )}
                                    <button
                                        onClick={() => setMediaUrl('')}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors backdrop-blur-md"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="mt-3 border-2 border-dashed border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center text-neutral-500 hover:border-purple-500 hover:bg-neutral-900/50 transition-all cursor-pointer group"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={async (e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];
                                        if (file) await handleFileUpload(file);
                                    }}
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        accept="image/*,video/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) await handleFileUpload(file);
                                        }}
                                    />
                                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Upload size={20} className="text-neutral-400" />
                                    </div>
                                    <p className="text-xs font-medium text-neutral-300">Clique ou arraste mídia</p>
                                    <p className="text-[10px] text-neutral-600 mt-1">JPG, PNG, MP4 até 10MB</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-800">
                                <span className="text-[10px] text-neutral-500">Use variáveis como {'{nome}'} em breve.</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-green-900/40 text-green-400 px-2 py-0.5 rounded border border-green-900/50">WhatsApp</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="w-1/2 bg-[#050505] p-8 flex flex-col items-center relative overflow-hidden h-full">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />

                    {loading ? (
                        <div className="flex flex-col items-center animate-pulse mt-20">
                            <RefreshCw className="text-purple-500 animate-spin mb-4" size={32} />
                            <p className="text-neutral-500 font-mono text-sm">Calculando audiência...</p>
                        </div>
                    ) : preview ? (
                        <div className="w-full max-w-md z-10 flex flex-col h-full pb-8">
                            <div className="text-center mb-8 shrink-0">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/30 mb-4 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                                    <Users size={32} className="text-purple-400" />
                                </div>
                                <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">{preview.count}</h2>
                                <p className="text-neutral-500 text-sm font-medium">Clientes Encontrados</p>
                            </div>

                            {/* Sample List con Checkboxes */}
                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col flex-1 min-h-0">
                                <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between shrink-0">
                                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                                        Selecionados ({activeInSample} de {preview.sample.length})
                                    </h3>
                                    <span className="text-[10px] text-neutral-500 cursor-help" title="Desmarque para excluir do envio">
                                        Desmarque quem não deve receber
                                    </span>
                                </div>

                                {preview.sample.length > 0 ? (
                                    <div className="overflow-y-auto flex-1">
                                        <div className="divide-y divide-neutral-800">
                                            {preview.sample.map(c => {
                                                const isExcluded = excludedIds.includes(c.id);
                                                return (
                                                    <div
                                                        key={c.id}
                                                        className={`px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer hover:bg-white/5 ${isExcluded ? 'opacity-50 grayscale' : ''}`}
                                                        onClick={() => toggleExclusion(c.id)}
                                                    >
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${!isExcluded ? 'bg-purple-600 border-purple-600' : 'border-neutral-600'}`}>
                                                            {!isExcluded && <CheckSquare size={14} className="text-white" />}
                                                        </div>

                                                        <div className="flex-1">
                                                            <p className={`text-sm font-medium ${isExcluded ? 'text-neutral-500' : 'text-neutral-200'}`}>{c.full_name}</p>
                                                            <p className="text-xs text-neutral-500">{c.phone}</p>
                                                        </div>
                                                        {c.temperature && (
                                                            <span className="text-xs px-2 py-1 bg-neutral-800 rounded text-neutral-400 border border-neutral-700">
                                                                {c.temperature}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-neutral-500 text-sm">
                                        Nenhum cliente visível para esta segmentação.
                                    </div>
                                )}

                                {preview.count > preview.sample.length && (
                                    <div className="bg-neutral-900/30 px-4 py-2 text-center text-[10px] text-neutral-500 border-t border-neutral-800 shrink-0">
                                        + {preview.count - preview.sample.length} contatos ocultos (não editáveis aqui)
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function Card({ icon, label, value, sub }: { icon: any, label: string, value: string | number, sub?: string }) {
    return (
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl flex items-start justify-between group hover:border-neutral-700 transition-colors">
            <div>
                <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                    {sub && <span className="text-sm text-neutral-400 font-mono">{sub}</span>}
                </div>
            </div>
            <div className="p-3 bg-neutral-800/50 rounded-xl group-hover:bg-neutral-800 transition-colors">
                {icon}
            </div>
        </div>
    );
}

function LeadTable({ leads }: { leads: any[] }) {
    if (leads.length === 0) return <div className="text-center p-8 text-neutral-500">Nenhum dado disponível ainda.</div>;

    // Ordenar: Hot first, Replied second
    const sorted = [...leads].sort((a, b) => {
        if (a.temperature === 'quente' && b.temperature !== 'quente') return -1;
        if (a.replied && !b.replied) return -1;
        return 0;
    });

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg mt-8">
            <table className="w-full text-left text-sm text-neutral-400">
                <thead className="bg-neutral-950 text-neutral-500 uppercase text-[10px] font-bold border-b border-neutral-800 tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Nome lead</th>
                        <th className="px-6 py-4">Status Envio</th>
                        <th className="px-6 py-4">Resposta</th>
                        <th className="px-6 py-4">Classificação (Pipeline/IA)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                    {sorted.map((lead, i) => (
                        <tr key={i} className="hover:bg-neutral-800/50 transition-colors group">
                            <td className="px-6 py-4">
                                <span className="font-semibold text-white block">{lead.full_name}</span>
                                <span className="text-[10px] text-neutral-600 font-mono">{lead.phone}</span>
                            </td>
                            <td className="px-6 py-4">
                                {lead.status === 'sent' ?
                                    <span className="text-green-500 flex items-center gap-1.5 bg-green-900/10 px-2 py-1 rounded w-fit text-xs font-medium border border-green-900/30">
                                        <CheckCircle size={12} /> Enviado
                                    </span>
                                    : <span className="text-red-500 flex items-center gap-1.5">
                                        <XCircle size={12} /> {lead.status}
                                    </span>}
                            </td>
                            <td className="px-6 py-4">
                                {lead.replied ?
                                    <span className="text-blue-400 font-bold flex items-center gap-1.5 animate-pulse">
                                        <MessageSquare size={14} />
                                        {lead.replied_at ? new Date(lead.replied_at).toLocaleTimeString().slice(0, 5) : 'Sim'}
                                    </span>
                                    : <span className="text-neutral-700">-</span>}
                            </td>
                            <td className="px-6 py-4">
                                {lead.temperature === 'quente' ?
                                    <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs border border-red-500/20 flex items-center gap-1.5 w-fit font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                        <Flame size={12} /> QUENTE
                                    </span>
                                    : lead.temperature ? <span className="capitalize bg-neutral-800 px-2 py-1 rounded text-neutral-400 text-xs">{lead.temperature}</span> : <span className="text-neutral-700 text-xs italic">Sem dados</span>
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
