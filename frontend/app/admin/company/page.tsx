"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, Save, Upload, Palette } from 'lucide-react';

export default function CompanySettingsPage() {
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        document_id: '',
        config: {
            logo_url: '',
            primary_color: '#9333ea',
            niche: 'biomedicina'
        }
    });

    const API_URL = '/api/v1';

    useEffect(() => {
        fetchCompany();
    }, []);

    const fetchCompany = async () => {
        try {
            const res = await axios.get(`${API_URL}/tenants/me`);
            const data = res.data;
            setFormData({
                name: data.name,
                document_id: data.document_id || '',
                config: {
                    logo_url: data.config?.logo_url || '',
                    primary_color: data.config?.primary_color || '#9333ea',
                    niche: data.config?.niche || 'biomedicina'
                }
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/tenants/me`, formData);

            // Update LocalStorage for immediate Sidebar update
            if (formData.config.logo_url) {
                localStorage.setItem('clinic_logo', formData.config.logo_url);
            }

            alert("Dados da empresa atualizados com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar.");
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, logo_url: base64 }
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Building className="text-purple-500" size={32} />
                        Dados da Empresa
                    </h1>
                    <p className="text-neutral-500 mt-1">Configure a identidade visual e dados da sua empresa.</p>
                </div>
            </div>

            <div className="max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-sm">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Nome da Empresa</label>
                            <input
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">CNPJ / Documento</label>
                            <input
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                                value={formData.document_id}
                                onChange={e => setFormData({ ...formData, document_id: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="border-t border-neutral-800 pt-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Palette size={20} className="text-neutral-400" />
                            White Label & Identidade
                        </h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Segmento (Nicho)</label>
                                <input
                                    type="text"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                                    value={formData.config.niche}
                                    onChange={e => setFormData(p => ({ ...p, config: { ...p.config, niche: e.target.value } }))}
                                    placeholder="Ex: Clínica de Estética, Odontologia..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Cor Primária</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        className="h-12 w-12 rounded bg-transparent cursor-pointer"
                                        value={formData.config.primary_color}
                                        onChange={e => setFormData(p => ({ ...p, config: { ...p.config, primary_color: e.target.value } }))}
                                    />
                                    <span className="text-sm text-neutral-400">{formData.config.primary_color}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Logo da Empresa</label>
                            <div className="flex items-start gap-6">
                                <div className="w-32 h-32 bg-neutral-950 border border-dashed border-neutral-700 rounded-xl flex items-center justify-center overflow-hidden relative group">
                                    {formData.config.logo_url ? (
                                        <img src={formData.config.logo_url} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-neutral-600 text-xs text-center p-2">Sem Logo</span>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                        <Upload className="text-white" size={24} />
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleLogoUpload} />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-neutral-400 mb-2">
                                        Faça upload da sua logo para personalizar o sistema.
                                        Isso substituirá a marca "Superserver" no menu lateral.
                                    </p>
                                    <p className="text-xs text-neutral-600">Recomendado: 200x80px PNG Transparente.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-neutral-800 pt-6 flex justify-end">
                        <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20 transition-all">
                            <Save size={20} />
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
