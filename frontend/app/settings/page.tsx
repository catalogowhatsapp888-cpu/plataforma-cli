"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Save, Server, Bot, Database, Lock, RefreshCw, Trash2, Shield, Clock, Zap, Activity, Settings as SettingsIcon, ArrowLeft } from "lucide-react";

export default function SettingsPage() {
    // Estado para AI Config
    const [aiConfig, setAiConfig] = useState({
        is_active: false,
        system_prompt: '',
        model_name: 'gpt-4o'
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
                            <h3 className="font-bold text-white mb-2">Importação e Sincronização</h3>
                            <p className="text-sm text-neutral-400 mb-4">Sincronize os leads a partir da planilha <code>Leads_clinica.xlsx</code>.</p>
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition border border-neutral-700 hover:border-neutral-500 disabled:opacity-50">
                                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                                {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                            </button>
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
