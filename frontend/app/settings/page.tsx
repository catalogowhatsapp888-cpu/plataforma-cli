"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Save, Server, Bot, Database, Lock, RefreshCw, Trash2, Shield, Clock, Zap, Activity, Settings as SettingsIcon, ArrowLeft, UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, X, Brain } from "lucide-react";

export default function SettingsPage() {
    // Estado para AI Config
    const [aiConfig, setAiConfig] = useState({
        is_active: false,
        system_prompt: '',
        model_name: 'gpt-4o',
        whitelist_numbers: [] as string[]
    });

    // Estado Mock para Evolution (futuro: ler do backend)
    const [evolutionConfig] = useState({
        url: 'https://evolution.superserver.com.br',
        apikey: '••••••••••••••••••••••••••••••••',
        instance: 'agenciaia_ecle'
    });

    // Config de Disparos Seguros
    const [campaignConfig, setCampaignConfig] = useState({
        daily_limit: 500,
        hourly_limit: 50,
        min_interval_seconds: 15,
        max_interval_seconds: 45,
        working_hours_start: "08:00",
        working_hours_end: "20:00",
        is_active: true
    });

    const [syncing, setSyncing] = useState(false);

    // Upload & Drag Drop States
    const [uploading, setUploading] = useState(false);
    const [uploadStats, setUploadStats] = useState<any>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Knowledge Base State
    const [documents, setDocuments] = useState<any[]>([]);
    const [docUploading, setDocUploading] = useState(false);
    const docInputRef = React.useRef<HTMLInputElement>(null);

    const fetchDocuments = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await axios.get(`${API_URL}/api/v1/knowledge/`);
            setDocuments(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchDocuments(); }, []);

    const handleDocUpload = async (file: File) => {
        if (!file) return;
        setDocUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            await axios.post(`${API_URL}/api/v1/knowledge/upload`, formData);
            fetchDocuments();
            alert("Documento enviado para processamento!");
        } catch (e: any) {
            alert("Erro no upload: " + e);
        } finally {
            setDocUploading(false);
        }
    }

    const handleDocDelete = async (id: string) => {
        if (!confirm("Remover este documento e desaprender o conteúdo?")) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            await axios.delete(`${API_URL}/api/v1/knowledge/${id}`);
            fetchDocuments();
        } catch (e) { alert("Erro ao deletar"); }
    }

    const handleFileUpload = async (file: File) => {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await fetch(`${API_URL}/api/v1/leads/import_file`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                setUploadStats(data);
            } else {
                alert("Erro no upload: " + (data.detail || "Erro desconhecido"));
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão ao enviar arquivo.");
        } finally {
            setUploading(false);
            setIsDragging(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.includes("csv") || file.type.includes("sheet") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
                handleFileUpload(file);
            } else {
                alert("Por favor, envie apenas arquivos CSV ou Excel (.xlsx)");
            }
        }
    };

    const handleSync = async () => {
        if (!confirm("Deseja sincronizar com a planilha de leads padrão?")) return;
        setSyncing(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/v1/leads/sync', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                let msg = `Sincronização concluída!\n✅ Novos: ${data.imported}\n♻️ Atualizados: ${data.updated}\n👀 Já Existentes: ${data.duplicates}\n⚠️ Erros: ${data.errors}`;
                if (data.error_details && data.error_details.length > 0) {
                    msg += "\n\nDetalhes de Erros (Primeiros 20):\n" + data.error_details.join("\n");
                }
                alert(msg);
            } else {
                alert(`Erro na sincronização: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão com o servidor.");
        } finally {
            setSyncing(false);
        }
    };

    const handleReset = async () => {
        if (!confirm("⚠️ PERIGO: Isso vai apagar TODOS os leads e conversas do sistema. Tem certeza absoluta?")) return;
        if (!confirm("Confirmar novamente: APAGAR TUDO PARA REINICIAR IMPORTAÇÃO?")) return;

        try {
            const res = await fetch('http://127.0.0.1:8000/api/v1/leads/reset_all', { method: 'DELETE' });
            if (res.ok) {
                alert("Banco de dados limpo com sucesso!");
            } else {
                alert("Erro ao limpar banco.");
            }
        } catch (e) {
            alert("Erro de conexão.");
        }
    };

    useEffect(() => {
        // Carregar AI Config
        axios.get('http://127.0.0.1:8000/api/v1/ai/config')
            .then(res => setAiConfig(res.data))
            .catch(err => console.error(err));

        // Carregar Campaign Config
        axios.get('http://127.0.0.1:8000/api/v1/settings/campaign')
            .then(res => { if (res.data.id) setCampaignConfig(res.data); })
            .catch(err => console.error("Sem config campanha (usando defaults)", err));
    }, []);

    const handleSaveAI = async () => {
        try {
            await axios.put('http://127.0.0.1:8000/api/v1/ai/config', aiConfig);
            alert("Configurações de IA salvas com sucesso!");
        } catch (e) {
            alert("Erro ao salvar configurações.");
            console.error(e);
        }
    };

    const handleSaveCampaign = async () => {
        try {
            await axios.put('http://127.0.0.1:8000/api/v1/settings/campaign', campaignConfig);
            alert("Limites de disparo atualizados com segurança!");
        } catch (e) {
            alert("Erro ao salvar limites.");
            console.error(e);
        }
    };

    return (
        <div className="p-8 pb-20 overflow-y-auto h-screen scrollbar-thin scrollbar-thumb-neutral-800">
            <header className="flex items-center gap-4 mb-8 pb-4 border-b border-neutral-800">
                <Link href="/" className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-white">
                    <ArrowLeft size={20} />
                </Link>
                <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-700 text-neutral-100">
                    <SettingsIcon size={22} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white leading-tight">Configurações</h1>
                    <p className="text-xs text-neutral-500 font-medium">Gerencie integrações e parâmetros</p>
                </div>
            </header>

            <div className="space-y-6 max-w-4xl">
                {/* Evolution API Section */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Server size={120} />
                    </div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                        <span className="w-8 h-8 rounded-lg bg-green-900/50 text-green-500 flex items-center justify-center border border-green-800"><Server size={18} /></span>
                        Evolution API (WhatsApp)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">API URL</label>
                            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-400">
                                <span className="flex-1 truncate">{evolutionConfig.url}</span>
                                <Lock size={14} className="text-neutral-600" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Instância</label>
                            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-400">
                                <span className="flex-1 font-mono">{evolutionConfig.instance}</span>
                                <Lock size={14} className="text-neutral-600" />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Global API Key</label>
                            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-500 font-mono">
                                <span className="flex-1">{evolutionConfig.apikey}</span>
                                <Lock size={14} className="text-neutral-600" />
                            </div>
                            <p className="text-[10px] text-yellow-600/70 mt-2 flex items-center gap-1">
                                <Lock size={10} /> Estas configurações são gerenciadas via variáveis de ambiente (.env) por segurança.
                            </p>
                        </div>
                    </div>
                </div>

                {/* AI Config Section */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Bot size={120} />
                    </div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-purple-900/50 text-purple-500 flex items-center justify-center border border-purple-800"><Bot size={18} /></span>
                            Inteligência Artificial
                        </h2>
                        <div className="flex items-center gap-2 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                            <span className={`text-xs font-bold px-3 py-1 rounded ${aiConfig.is_active ? 'bg-green-900 text-green-300' : 'text-neutral-500'}`}>ON</span>
                            <div
                                onClick={() => setAiConfig({ ...aiConfig, is_active: !aiConfig.is_active })}
                                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${aiConfig.is_active ? 'bg-green-600' : 'bg-neutral-700'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${aiConfig.is_active ? 'left-6' : 'left-1'}`} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Modelo LLM</label>
                            <select
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white outline-none focus:border-purple-500 appearance-none"
                                value={aiConfig.model_name}
                                onChange={e => setAiConfig({ ...aiConfig, model_name: e.target.value })}
                            >
                                <option value="gpt-4o">GPT-4o (Recomendado)</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Prompt do Sistema (Personalidade)</label>
                            <textarea
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm text-neutral-300 focus:border-purple-500 outline-none h-48 leading-relaxed scrollbar-thin scrollbar-thumb-neutral-700 font-mono"
                                value={aiConfig.system_prompt}
                                onChange={e => setAiConfig({ ...aiConfig, system_prompt: e.target.value })}
                                placeholder="Descreva aqui como a IA deve se comportar..."
                            />
                            <p className="text-[10px] text-neutral-500 mt-2">
                                Dica: Inclua instruções sobre tom de voz, regras de negócio e limites de atuação.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-neutral-800 flex justify-end">
                            <button
                                onClick={handleSaveAI}
                                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Save size={18} /> Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>

                {/* Knowledge Base (RAG) Section */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Brain size={120} />
                    </div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                        <span className="w-8 h-8 rounded-lg bg-pink-900/50 text-pink-500 flex items-center justify-center border border-pink-800"><Brain size={18} /></span>
                        Base de Conhecimento (Cérebro)
                    </h2>
                    <div className="relative z-10">
                        <div
                            onClick={() => docInputRef.current?.click()}
                            className="border-2 border-dashed border-neutral-800 hover:border-pink-500/50 hover:bg-neutral-900/80 transition-all rounded-xl p-6 text-center cursor-pointer mb-6"
                        >
                            <input type="file" ref={docInputRef} className="hidden" accept=".pdf" onChange={e => e.target.files?.[0] && handleDocUpload(e.target.files[0])} />
                            {docUploading ? <RefreshCw className="animate-spin mx-auto text-pink-500" /> : <UploadCloud className="mx-auto text-neutral-500 mb-2" size={32} />}
                            <p className="text-sm text-neutral-400 font-bold">Clique para adicionar PDF</p>
                            <p className="text-xs text-neutral-600">Manuais, Tabelas de Preço, FAQ</p>
                        </div>

                        <div className="space-y-2">
                            {documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center ${doc.is_processed ? 'bg-green-900/20 text-green-500' : 'bg-yellow-900/20 text-yellow-500'}`}>
                                            {doc.is_processed ? <CheckCircle size={16} /> : <RefreshCw size={16} className="animate-spin" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white truncate max-w-[200px]">{doc.title}</p>
                                            <p className="text-[10px] text-neutral-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDocDelete(doc.id)} className="text-neutral-600 hover:text-red-500 transition"><Trash2 size={16} /></button>
                                </div>
                            ))}
                            {documents.length === 0 && <p className="text-center text-xs text-neutral-600 py-4">Nenhum documento treinado.</p>}
                        </div>
                    </div>
                </div>

                {/* Campaign Safety Section */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Shield size={120} />
                    </div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                        <span className="w-8 h-8 rounded-lg bg-orange-900/50 text-orange-500 flex items-center justify-center border border-orange-800"><Shield size={18} /></span>
                        Segurança de Disparo (Anti-Ban)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 text-sm">

                        <div className="space-y-4">
                            <h3 className="font-bold text-neutral-400 flex items-center gap-2"><Activity size={14} /> Limites de Volume</h3>
                            <div>
                                <label className="block text-neutral-500 text-xs mb-1">Limite Diário (Mensagens)</label>
                                <input type="number" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                                    value={campaignConfig.daily_limit} onChange={e => setCampaignConfig({ ...campaignConfig, daily_limit: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div>
                                <label className="block text-neutral-500 text-xs mb-1">Limite por Hora</label>
                                <input type="number" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                                    value={campaignConfig.hourly_limit} onChange={e => setCampaignConfig({ ...campaignConfig, hourly_limit: parseInt(e.target.value) || 0 })} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-neutral-400 flex items-center gap-2"><Clock size={14} /> Intervalos & Horários</h3>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-neutral-500 text-xs mb-1">Min (seg)</label>
                                    <input type="number" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                                        value={campaignConfig.min_interval_seconds} onChange={e => setCampaignConfig({ ...campaignConfig, min_interval_seconds: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-neutral-500 text-xs mb-1">Max (seg)</label>
                                    <input type="number" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                                        value={campaignConfig.max_interval_seconds} onChange={e => setCampaignConfig({ ...campaignConfig, max_interval_seconds: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-neutral-500 text-xs mb-1">Início (HH:MM)</label>
                                    <input type="time" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                                        value={campaignConfig.working_hours_start} onChange={e => setCampaignConfig({ ...campaignConfig, working_hours_start: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-neutral-500 text-xs mb-1">Fim (HH:MM)</label>
                                    <input type="time" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                                        value={campaignConfig.working_hours_end} onChange={e => setCampaignConfig({ ...campaignConfig, working_hours_end: e.target.value })} />
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="mt-6 flex justify-between items-center border-t border-neutral-800 pt-4 relative z-10">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={campaignConfig.is_active} onChange={e => setCampaignConfig({ ...campaignConfig, is_active: e.target.checked })} className="hidden" />
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${campaignConfig.is_active ? 'bg-green-600' : 'bg-red-900/50'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${campaignConfig.is_active ? 'left-5' : 'left-1'}`} />
                            </div>
                            <span className={`text-sm font-bold ${campaignConfig.is_active ? 'text-green-400' : 'text-neutral-500'}`}>{campaignConfig.is_active ? 'Disparos Ativos' : 'Disparos Pausados'}</span>
                        </label>

                        <button
                            onClick={handleSaveCampaign}
                            className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-900/20">
                            <Save size={18} /> Salvar Regras
                        </button>
                    </div>


                </div>

                {/* Homologation & Testing Section */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Zap size={120} />
                    </div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-blue-900/50 text-blue-500 flex items-center justify-center border border-blue-800"><Zap size={18} /></span>
                            Homologação & Testes
                        </h2>
                    </div>

                    <div className="space-y-6 relative z-10">
                        {/* Whitelist */}
                        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                            <div className="flex justify-between items-start mb-2">
                                <label className="text-sm font-bold text-neutral-400">Modo de Segurança (Whitelist)</label>
                            </div>
                            <p className="text-xs text-neutral-500 mb-3">
                                Defina números "seguros". Se houver números aqui, o sistema pode priorizá-los ou limitar o envio APENAS para eles (dependendo da lógica do bot).
                                Útil para aquecer o chip enviando mensagens entre sua equipe.
                            </p>
                            <textarea
                                value={aiConfig.whitelist_numbers?.join('\n') || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    const arr = val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                                    setAiConfig({ ...aiConfig, whitelist_numbers: arr });
                                }}
                                rows={3}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm text-white font-mono placeholder-neutral-700 focus:border-blue-500 outline-none"
                                placeholder="5511999999999&#10;5511888888888"
                            />
                            <div className="mt-2 text-right">
                                <button
                                    onClick={handleSaveAI}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                                >
                                    Salvar Lista Segura
                                </button>
                            </div>
                        </div>

                        {/* Test Message Sender */}
                        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                            <label className="text-sm font-bold text-neutral-400 mb-3 block">Disparo de Teste (Aquecimento)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="5511999999999"
                                    id="test-phone"
                                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white outline-none focus:border-blue-500 font-mono"
                                />
                                <button
                                    onClick={async () => {
                                        const phone = (document.getElementById('test-phone') as HTMLInputElement).value;
                                        if (!phone) return alert("Digite um número");
                                        try {
                                            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                                            await axios.post(`${API_URL}/api/v1/settings/test-message`, { phone, message: "Olá! Este é um teste de aquecimento do sistema. 🚀" });
                                            alert("Mensagem enviada com sucesso!");
                                        } catch (e) {
                                            alert("Erro ao enviar: " + e);
                                        }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg font-medium transition-colors"
                                >
                                    Enviar Teste
                                </button>
                            </div>
                            <p className="text-[10px] text-neutral-600 mt-2">Envia uma mensagem padrão ("Olá! Este é um teste...") para verificar a entrega.</p>
                        </div>
                    </div>
                </div>

                {/* Data Management Section */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Database size={120} />
                    </div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                        <span className="w-8 h-8 rounded-lg bg-red-900/50 text-red-500 flex items-center justify-center border border-red-800"><Database size={18} /></span>
                        Gerenciamento de Dados
                    </h2>

                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <FileSpreadsheet size={16} className="text-purple-500" />
                                Importar Leads
                            </h3>

                            {/* Drag & Drop Area */}
                            {!uploadStats ? (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group
                                        ${isDragging
                                            ? 'border-purple-500 bg-purple-900/20 scale-[1.02]'
                                            : 'border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700'}`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                    />

                                    {uploading ? (
                                        <div className="flex flex-col items-center animate-pulse">
                                            <RefreshCw size={48} className="text-purple-500 animate-spin mb-4" />
                                            <p className="text-neutral-400 font-medium">Processando arquivo...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud size={48} className={`mb-4 transition-colors ${isDragging ? 'text-purple-400' : 'text-neutral-600 group-hover:text-purple-500'}`} />
                                            <p className="text-sm text-neutral-300 font-medium text-center">
                                                Arraste sua planilha aqui
                                                <span className="block text-neutral-500 text-xs mt-1 font-normal">ou clique para selecionar (.xlsx, .csv)</span>
                                            </p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 animate-in fade-in zoom-in">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold text-white flex items-center gap-2">
                                            <CheckCircle size={18} className="text-green-500" />
                                            Importação Concluída
                                        </h4>
                                        <button onClick={() => setUploadStats(null)} className="text-neutral-500 hover:text-white">
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="bg-green-900/20 border border-green-900/50 p-2 rounded-lg text-center">
                                            <div className="text-lg font-bold text-green-400">{uploadStats.added}</div>
                                            <div className="text-[10px] uppercase text-green-600 font-bold">Adicionados</div>
                                        </div>
                                        <div className="bg-neutral-800 p-2 rounded-lg text-center border border-neutral-700">
                                            <div className="text-lg font-bold text-neutral-400">{uploadStats.ignored}</div>
                                            <div className="text-[10px] uppercase text-neutral-500 font-bold">Duplicados</div>
                                        </div>
                                        <div className="bg-red-900/20 border border-red-900/50 p-2 rounded-lg text-center">
                                            <div className="text-lg font-bold text-red-400">{uploadStats.errors.length}</div>
                                            <div className="text-[10px] uppercase text-red-600 font-bold">Erros</div>
                                        </div>
                                    </div>

                                    {uploadStats.errors.length > 0 && (
                                        <div className="bg-neutral-950 p-2 rounded border border-neutral-800 max-h-32 overflow-y-auto text-xs font-mono text-red-400">
                                            {uploadStats.errors.map((e: string, i: number) => <div key={i}>{e}</div>)}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setUploadStats(null)}
                                        className="w-full mt-2 bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-lg text-xs font-bold transition">
                                        Nova Importação
                                    </button>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col gap-2">
                                <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                                    <AlertTriangle size={10} />
                                    Colunas necessárias: <b>Nome</b>, <b>Telefone</b>.
                                </p>
                                <button
                                    onClick={handleSync}
                                    disabled={syncing}
                                    className="text-xs text-neutral-500 hover:text-purple-400 flex items-center gap-1 self-start transition">
                                    <RefreshCw size={10} className={syncing ? "animate-spin" : ""} />
                                    {syncing ? 'Sincronizando pasta padrão...' : 'Sincronizar da pasta padrão (Server)'}
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl">
                            <h3 className="font-bold text-red-400 mb-2">Zona de Perigo</h3>
                            <p className="text-sm text-red-300/70 mb-4">Apague todos os dados (Leads, Conversas, Histórico) para reiniciar a homologação.</p>
                            <button
                                onClick={handleReset}
                                className="bg-red-900/50 hover:bg-red-900 text-red-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition border border-red-800 hover:border-red-500">
                                <Trash2 size={16} /> Resetar Banco de Dados
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
