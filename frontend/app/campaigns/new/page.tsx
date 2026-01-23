'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, Users, RefreshCw, Save, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function NewCampaignPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [mediaUrl, setMediaUrl] = useState(''); // Estado para Imagem (Base64)
    const [uploading, setUploading] = useState(false);
    const [conditions, setConditions] = useState<Condition[]>([
        { id: '1', field: 'temperature', operator: 'equals', value: 'quente' }
    ]);
    const [logic, setLogic] = useState<'AND' | 'OR'>('AND');

    // Preview & Selection State
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [excludedIds, setExcludedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Debounce Logic
    const fetchPreview = useCallback(async () => {
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
            // Resetar exclusões ao mudar a regra (opcional, mas seguro)
            setExcludedIds([]);
        } catch (err) {
            console.error("Preview failed", err);
        } finally {
            setLoading(false);
        }
    }, [conditions, logic]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPreview();
        }, 800); // 800ms debounce
        return () => clearTimeout(timer);
    }, [fetchPreview]);

    // Actions
    const addCondition = () => {
        setConditions([...conditions, { id: Math.random().toString(), field: 'temperature', operator: 'equals', value: '' }]);
    };

    const removeCondition = (id: string) => {
        if (conditions.length === 1) return; // Manter pelo menos 1
        setConditions(conditions.filter(c => c.id !== id));
    };

    const updateCondition = (id: string, field: keyof Condition, val: string) => {
        setConditions(conditions.map(c => c.id === id ? { ...c, [field]: val } : c));
    };

    const toggleContact = (id: string) => {
        if (selectionMode === 'manual') {
            if (selectedIds.includes(id)) {
                setSelectedIds(selectedIds.filter(sid => sid !== id));
            } else {
                setSelectedIds([...selectedIds, id]);
            }
        } else {
            if (excludedIds.includes(id)) {
                setExcludedIds(excludedIds.filter(eid => eid !== id));
            } else {
                setExcludedIds([...excludedIds, id]);
            }
        }
    };

    const handleSelectAll = () => {
        setSelectionMode('all');
        setSelectedIds([]);
        setExcludedIds([]);
    };

    const handleDeselectAll = () => {
        setSelectionMode('manual');
        setSelectedIds([]);
        setExcludedIds([]);
    };

    // Upload de Imagem
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploading(true);

        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onloadend = () => {
            const base64String = reader.result as string;
            setMediaUrl(base64String);
            setUploading(false);
        };

        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!name) return alert("Dê um nome para a campanha");

        if (selectionMode === 'manual' && selectedIds.length === 0) {
            return alert("Selecione contatos manualmente ou clique em Marcar Todos.");
        }

        setSaving(true);
        try {
            let finalRules;
            let finalExclusions: string[] = [];

            if (selectionMode === 'manual') {
                finalRules = {
                    logic: 'AND',
                    conditions: [{ field: 'id', operator: 'in', value: selectedIds }]
                };
            } else {
                finalRules = {
                    logic,
                    conditions: conditions.map(({ field, operator, value }) => ({ field, operator, value }))
                };
                finalExclusions = excludedIds;
            }

            const payload = {
                name,
                message_template: message,
                media_url: mediaUrl,
                excluded_contacts: finalExclusions,
                audience_rules: finalRules
            };

            const res = await fetch('http://localhost:8000/api/v1/campaigns/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                router.push('/campaigns');
            } else {
                alert('Erro ao salvar');
            }
        } catch (e) {
            alert('Erro de conexão');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#0A0A0A] text-neutral-200">
            {/* Header */}
            <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-[#0A0A0A] z-20">
                <div className="flex items-center gap-4">
                    <Link href="/campaigns" className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="font-semibold text-lg leading-tight">Nova Campanha</h1>
                        <p className="text-xs text-neutral-500">Defina o público alvo e a mensagem</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                        Salvar Campanha
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Builder */}
                <div className="w-1/2 border-r border-neutral-800 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">

                    {/* Nome */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Nome da Campanha</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ex: Oferta de Carnaval"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
                        />
                    </div>

                    {/* Mensagem da Campanha (Mudei a ordem para ficar acima das regras, opcional, mas foco no conteúdo) */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Mensagem do WhatsApp</label>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 focus-within:border-purple-500 transition-colors shadow-sm">
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Olá! Temos uma condição especial para você..."
                                rows={5}
                                className="w-full bg-transparent text-sm text-white placeholder-neutral-600 focus:outline-none resize-none leading-relaxed"
                            />

                            {/* Image Preview Area */}
                            {mediaUrl && (
                                <div className="mt-3 mb-2 p-2 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-neutral-800 rounded overflow-hidden">
                                            <img src={mediaUrl} className="w-full h-full object-cover" alt="Preview" />
                                        </div>
                                        <span className="text-xs text-green-400 font-medium">Imagem Anexada</span>
                                    </div>
                                    <button onClick={() => setMediaUrl('')} className="text-neutral-500 hover:text-red-400 p-1">
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-800">
                                <div className="flex items-center gap-2">
                                    <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-neutral-700 cursor-pointer transition ${mediaUrl ? 'bg-green-900/10 border-green-500/30 text-green-400' : 'hover:bg-neutral-800 hover:border-neutral-500 text-neutral-400'}`}>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                                        {uploading ? <RefreshCw className="animate-spin" size={14} /> : <ImageIcon size={14} />}
                                        <span className="text-xs font-medium">{mediaUrl ? 'Trocar Imagem' : 'Adicionar Imagem'}</span>
                                    </label>
                                </div>
                                <span className="text-[10px] bg-green-900/40 text-green-400 px-2 py-0.5 rounded border border-green-900/50">WhatsApp Preview</span>
                            </div>
                        </div>
                    </div>

                    {/* Regras */}
                    <div className="mb-6 flex items-center justify-between">
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Regras de Segmentação (Público Alvo)</label>
                        <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                            <button
                                onClick={() => setLogic('AND')}
                                className={`text-xs px-3 py-1 rounded-md font-medium transition-all ${logic === 'AND' ? 'bg-purple-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                E (Todas)
                            </button>
                            <button
                                onClick={() => setLogic('OR')}
                                className={`text-xs px-3 py-1 rounded-md font-medium transition-all ${logic === 'OR' ? 'bg-purple-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                OU (Qualquer)
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        {conditions.map((cond, idx) => (
                            <div key={cond.id} className="flex gap-2 items-start group">
                                <div className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 grid grid-cols-12 gap-3 hover:border-neutral-700 transition-colors">
                                    {/* Campo */}
                                    <div className="col-span-4">
                                        <select
                                            className="w-full bg-transparent text-sm text-neutral-300 focus:outline-none"
                                            value={cond.field}
                                            onChange={e => {
                                                // Reset value on field change to prevent type mismatch
                                                updateCondition(cond.id, 'field', e.target.value);
                                                updateCondition(cond.id, 'value', '');
                                            }}
                                        >
                                            <option value="temperature">Temperatura</option>
                                            <option value="stage">Estágio do Funil</option>
                                            <option value="full_name">Nome</option>
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
                                            <option value="contains">Contém</option>
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
                                        ) : cond.field.includes('stage') ? (
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
                                                name={`cond-value-${cond.id}`} // Unique name to prevent heuristic filling
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
                        className="w-full py-3 border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-sm font-medium hover:border-neutral-600 hover:text-neutral-300 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} />
                        Adicionar Condição
                    </button>

                </div>

                {/* Right: Preview (Updated to Select) */}
                <div className="w-1/2 bg-[#050505] p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 to-transparent pointer-events-none" />

                    {loading ? (
                        <div className="flex flex-col items-center animate-pulse">
                            <RefreshCw className="text-purple-500 animate-spin mb-4" size={32} />
                            <p className="text-neutral-500 font-mono text-sm">Buscando contatos...</p>
                        </div>
                    ) : preview ? (
                        <div className="w-full max-w-sm z-10 h-[80vh] flex flex-col">
                            {/* Summary Card */}
                            {/* Summary Card */}
                            <div className="text-center mb-6 shrink-0">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 mb-2 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                                    <Users size={24} className="text-purple-400" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">
                                    {selectionMode === 'all' ? (preview.count - excludedIds.length) : selectedIds.length}
                                </h2>
                                <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider">
                                    {selectionMode === 'all' ? 'Selecionados (Todos)' : 'Selecionados Manualmente'}
                                </p>
                            </div>

                            {/* Contact List */}
                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden backdrop-blur-sm flex-1 flex flex-col">
                                <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/80 flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Lista</h3>
                                        <span className="text-[10px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded">
                                            {preview.count} encontrados
                                        </span>
                                    </div>

                                    <button
                                        onClick={selectionMode === 'all' ? handleDeselectAll : handleSelectAll}
                                        className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase"
                                    >
                                        {selectionMode === 'all' ? 'Desmarcar Todos' : 'Marcar Todos'}
                                    </button>
                                </div>

                                <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-neutral-800 p-2 space-y-1">
                                    {preview.sample.length > 0 ? (
                                        preview.sample.map(c => {
                                            const isSelected = selectionMode === 'all'
                                                ? !excludedIds.includes(c.id)
                                                : selectedIds.includes(c.id);

                                            return (
                                                <div
                                                    key={c.id}
                                                    className={`px-3 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer border ${isSelected ? 'bg-purple-900/10 border-purple-500/30' : 'bg-neutral-800/20 border-transparent hover:bg-neutral-800/40'}`}
                                                    onClick={() => toggleContact(c.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-600 border-purple-600' : 'bg-transparent border-neutral-600'}`}>
                                                            {isSelected && <CheckSquareIcon className="text-white w-3 h-3" />}
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-medium ${isSelected ? 'text-neutral-200' : 'text-neutral-500'}`}>{c.full_name}</p>
                                                            <p className="text-[10px] text-neutral-500">{c.phone}</p>
                                                        </div>
                                                    </div>
                                                    {c.temperature && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-400 border border-neutral-700">
                                                            {c.temperature}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-6 text-center text-neutral-500 text-sm">
                                            Nenhum contato encontrado com estas regras.
                                        </div>
                                    )}

                                    {preview.count > preview.sample.length && (
                                        <div className="py-2 text-center text-[10px] text-neutral-500 italic">
                                            ... e mais {preview.count - preview.sample.length} contatos não exibidos
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// Icon Helper
function CheckSquareIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}
