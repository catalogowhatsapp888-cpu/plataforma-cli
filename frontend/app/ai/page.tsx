'use client';

import { useState, useEffect } from 'react';
import { Bot, Save, Power, Zap, MessageSquare, ArrowLeft, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default function AIConfigPage() {
    const [config, setConfig] = useState({
        is_active: false,
        system_prompt: '',
        model_name: 'gpt-4o',
        whitelist_numbers: [] as string[]
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8000/api/v1/ai/config')
            .then(res => res.json())
            .then(data => {
                setConfig(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('http://localhost:8000/api/v1/ai/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                alert("✅ Configurações da IA atualizadas com sucesso!");
            } else {
                alert("Erro ao salvar configurações.");
            }
        } catch (e) {
            alert("Erro de conexão.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen bg-[#0A0A0A] flex items-center justify-center text-white">Carregando Cérebro...</div>;

    return (
        <div className="flex flex-col h-screen bg-[#0A0A0A] text-neutral-200">
            {/* Header */}
            <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-[#0A0A0A]">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center border border-green-500/30 text-green-500">
                        <Bot size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white leading-tight">Inteligência Artificial</h1>
                        <p className="text-xs text-neutral-500 font-medium">Configure o comportamento do seu Bot</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={16} />}
                    Salvar Configuração
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">

                {/* Status Card */}
                <div className={`mb-8 border rounded-2xl p-6 transition-all ${config.is_active ? 'bg-green-900/10 border-green-900/30' : 'bg-neutral-900/30 border-neutral-800'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.is_active ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-neutral-800 text-neutral-500'}`}>
                                <Power size={24} />
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${config.is_active ? 'text-green-400' : 'text-neutral-400'}`}>
                                    {config.is_active ? 'IA Ativada' : 'IA Desativada'}
                                </h2>
                                <p className="text-sm text-neutral-500">
                                    {config.is_active
                                        ? 'O bot está respondendo automaticamente novos leads.'
                                        : 'O sistema não responderá ninguém automaticamente.'}
                                </p>
                            </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={config.is_active}
                                onChange={e => setConfig({ ...config, is_active: e.target.checked })}
                            />
                            <div className="w-14 h-7 bg-neutral-800 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left: Prompt Settings */}
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-neutral-400 mb-2 flex items-center gap-2">
                                <BrainCircuit size={16} />
                                Prompt do Sistema (Cérebro)
                            </label>
                            <p className="text-xs text-neutral-600 mb-2">
                                Dê instruções claras sobre quem é o bot, qual o objetivo (ex: agendar) e como deve falar.
                            </p>
                            <textarea
                                value={config.system_prompt}
                                onChange={e => setConfig({ ...config, system_prompt: e.target.value })}
                                rows={15}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 focus:outline-none focus:border-green-500/50 transition-colors leading-relaxed font-mono"
                                placeholder="Você é uma assistente..."
                            />
                        </div>
                    </div>

                    {/* Right: Model & Parameters */}
                    <div className="space-y-6">
                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-4">
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-3">Modelo de IA</label>

                            <div className="space-y-2">
                                {['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'].map(model => (
                                    <label key={model} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${config.model_name === model ? 'bg-green-900/20 border-green-900/50' : 'border-neutral-800 hover:bg-neutral-800'}`}>
                                        <input
                                            type="radio"
                                            name="model"
                                            checked={config.model_name === model}
                                            onChange={() => setConfig({ ...config, model_name: model })}
                                            className="hidden"
                                        />
                                        <Zap size={16} className={config.model_name === model ? 'text-green-500' : 'text-neutral-600'} />
                                        <div className="flex-1">
                                            <div className={`text-sm font-medium ${config.model_name === model ? 'text-green-400' : 'text-neutral-400'}`}>{model}</div>
                                        </div>
                                        {config.model_name === model && <div className="w-2 h-2 rounded-full bg-green-500" />}
                                    </label>
                                ))}
                            </div>
                            <p className="text-[10px] text-neutral-600 mt-3 p-2 bg-neutral-950 rounded border border-neutral-900">
                                Recomendado: <b>gpt-4o</b> para melhor raciocínio em português.
                            </p>
                        </div>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-4">
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-3 flex items-center justify-between">
                                <span>Modo Homologação</span>
                                <span className="bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded text-[10px] border border-purple-800/50">Safe Mode</span>
                            </label>
                            <p className="text-[10px] text-neutral-500 mb-2">Números permitidos (responde sempre, ignora regras). Separe por vírgula ou Enter.</p>
                            <textarea
                                value={config.whitelist_numbers?.join('\n') || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    const arr = val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                                    setConfig({ ...config, whitelist_numbers: arr });
                                }}
                                rows={4}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-300 font-mono focus:outline-none focus:border-purple-500/50 transition-colors"
                                placeholder="Ex: 5511999999999"
                            />
                        </div>

                        <div className="bg-orange-900/10 border border-orange-900/20 rounded-xl p-4">
                            <div className="flex items-start gap-2 text-orange-400 mb-2">
                                <MessageSquare size={16} className="mt-0.5" />
                                <h3 className="text-sm font-bold">Quando o Bot atua?</h3>
                            </div>
                            <ul className="text-xs text-orange-200/60 space-y-1 ml-6 list-disc">
                                <li>Novos Leads (Stage: Novo)</li>
                                <li>Leads não lidos (Stage: Responder)</li>
                                <li>Se você responder manualmente, o bot <b>Pausa</b>.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
