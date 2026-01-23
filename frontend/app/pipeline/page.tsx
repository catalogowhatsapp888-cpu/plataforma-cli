'use client';

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Search, Filter, Plus, User, MessageCircle, Edit2, X, Image as ImageIcon, Save, ExternalLink, Megaphone, Bot, RefreshCw, Trash2, ArrowLeft, LayoutList } from "lucide-react";
import Link from 'next/link';
import MessageModal from '../../components/MessageModal';

interface Lead {
    id: string;
    full_name: string;
    phone_e164: string;
    email?: string;
    lead_pipeline: {
        stage: string;
        temperature: string;
        unread_count?: number;
    };
}

const STAGES = ['novo', 'contactado', 'agendado'];

export default function PipelinePage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState(false); // For DND hydration fix

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTemp, setFilterTemp] = useState("all");

    // Modals State
    const [modalType, setModalType] = useState<'create' | 'edit' | 'message' | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    // Paginação por Coluna (Estado)
    const [pageLimits, setPageLimits] = useState<Record<string, number>>({
        'novo': 50, 'contactado': 50, 'agendado': 50, 'perdido': 50
    });

    const loadMore = (stage: string) => {
        setPageLimits(prev => ({ ...prev, [stage]: (prev[stage] || 50) + 50 }));
    };

    // Form States
    const [sending, setSending] = useState(false);
    const [formData, setFormData] = useState({ full_name: "", phone: "", email: "" });

    useEffect(() => {
        // Enable DND after mount to avoid hydration mismatch
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    // URL Base da API 
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    // Fetch Leads
    const fetchLeads = () => {
        fetch(`${API_URL}/api/v1/leads/?limit=2000`)
            .then(res => res.json())
            .then(data => {
                setLeads(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    // --- ACTIONS ---

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId) return; // Moved within same column (ordering not impl yet)

        const newStage = destination.droppableId;

        // Optimistic Update
        const updatedLeads = leads.map(l => {
            if (l.id === draggableId && l.lead_pipeline) {
                return { ...l, lead_pipeline: { ...l.lead_pipeline, stage: newStage } };
            }
            return l;
        });
        setLeads(updatedLeads);

        // Call API
        try {
            await fetch(`${API_URL}/api/v1/leads/${draggableId}/stage`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: newStage })
            });
        } catch (error) {
            console.error("Failed to update status", error);
            fetchLeads(); // Revert on error
        }
    };

    const handleCreateLead = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/leads/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Erro ao criar");
            }
            const newLead = await res.json();
            setLeads([newLead, ...leads]);
            closeModal();
        } catch (e: any) {
            let msg = "Erro desconhecido.";
            if (e.message) msg = e.message;
            alert(`Falha: ${msg}`);
        }
    };

    const handleUpdateLead = async () => {
        if (!selectedLead) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/leads/${selectedLead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error("Erro ao atualizar");

            // Update local state
            const updatedLeads = leads.map(l => l.id === selectedLead.id ? { ...l, ...formData } : l);
            setLeads(updatedLeads);
            closeModal();
        } catch (e) {
            alert("Erro ao atualizar lead.");
        }
    };

    const handleUpdateTemp = async (id: string, temp: string) => {
        // Optimistic Update
        const updatedLeads = leads.map(l => {
            if (l.id === id) {
                return { ...l, lead_pipeline: { ...l.lead_pipeline, temperature: temp } };
            }
            return l;
        });
        setLeads(updatedLeads);

        // Also update selectedLead if open
        if (selectedLead && selectedLead.id === id) {
            setSelectedLead({ ...selectedLead, lead_pipeline: { ...selectedLead.lead_pipeline, temperature: temp } });
        }

        try {
            await fetch(`${API_URL}/api/v1/leads/${id}/stage`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ temperature: temp })
            });
        } catch (e) {
            console.error("Temp update failed", e);
            fetchLeads(); // Revert
        }
    };

    const handleSendMessage = async (msg: string, url: string) => {
        if (!selectedLead || !msg.trim()) return;
        setSending(true);
        try {
            const payload = { message: msg, media_url: url || null };
            const res = await fetch(`${API_URL}/api/v1/leads/${selectedLead.id}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.mock) alert("Simulação enviada!");
            else alert("Mensagem enviada com sucesso!");
            closeModal();
        } catch (e) {
            alert("Erro ao enviar mensagem");
        } finally {
            setSending(false);
        }
    };

    // --- HELPERS ---

    const openCreateModal = () => {
        setFormData({ full_name: "", phone: "", email: "" });
        setModalType('create');
    };

    const openEditModal = (lead: Lead) => {
        setSelectedLead(lead);
        setFormData({
            full_name: lead.full_name,
            phone: lead.phone_e164,
            email: lead.email || ""
        });
        setModalType('edit');
    };

    const openMessageModal = (lead: Lead) => {
        setSelectedLead(lead);
        setModalType('message');
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedLead(null);
    };

    // Filter Logic
    const filteredLeads = leads.filter(lead => {
        const term = searchTerm.toLowerCase();
        const name = (lead.full_name || '').toLowerCase();
        const phone = lead.phone_e164 || '';
        const matchesSearch = name.includes(term) || phone.includes(term);
        const matchesTemp = filterTemp === 'all' || (lead.lead_pipeline?.temperature || 'frio') === filterTemp;
        return matchesSearch && matchesTemp;
    });

    if (loading) return <div className="p-10 text-white flex items-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Carregando Pipeline...</div>;
    if (!enabled) return null; // Avoid hydration mismatch for DND

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-6 font-sans overflow-hidden flex flex-col">

            {/* HEADER PADRÃO */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b border-neutral-800 gap-4">

                {/* Lado Esquerdo: Identidade */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link href="/" className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center border border-purple-500/30 text-purple-400">
                        <LayoutList size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white leading-tight">Pipeline de Vendas</h1>
                        <p className="text-xs text-neutral-500 font-medium">Gestão visual do funil</p>
                    </div>
                </div>

                {/* Lado Direito: Toolbar */}
                <div className="flex gap-3 items-center bg-neutral-800 p-2 rounded-xl border border-neutral-700 shadow-lg w-full md:w-auto overflow-x-auto">
                    <div className="flex items-center gap-2 bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-700 focus-within:border-purple-500 transition">
                        <Search size={14} className="text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="bg-transparent text-sm w-32 outline-none placeholder-neutral-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:border-purple-500 transition text-neutral-300"
                        value={filterTemp}
                        onChange={(e) => setFilterTemp(e.target.value)}
                    >
                        <option value="all">Todas Temps</option>
                        <option value="quente">🔥 Quentes</option>
                        <option value="morno">☁️ Mornos</option>
                        <option value="frio">❄️ Frios</option>
                        <option value="off">🚫 OFF</option>
                    </select>

                    <button
                        onClick={openCreateModal}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-purple-900/20 whitespace-nowrap">
                        <Plus size={16} /> Novo Lead
                    </button>
                </div>
            </header>

            {/* BOARD (Drag & Drop) */}
            <div className="flex-1 overflow-hidden">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-4 overflow-x-auto h-full pb-4 items-start">
                        {STAGES.map(stage => {
                            // 1. Filtrar leads desta etapa
                            const allStageLeads = filteredLeads.filter(l => (l.lead_pipeline?.stage || 'novo') === stage);
                            const totalCount = allStageLeads.length;

                            // 2. Aplicar limite de visualização
                            const limit = pageLimits[stage] || 50;
                            const visibleLeads = allStageLeads.slice(0, limit);

                            return (
                                <Droppable key={stage} droppableId={stage}>
                                    {(provided, snapshot) => (
                                        <div
                                            className="w-80 flex-shrink-0 flex flex-col bg-neutral-800/30 rounded-xl border border-neutral-800/50 backdrop-blur-sm max-h-full"
                                        >
                                            <div className={`p-3 border-b border-neutral-800 flex justify-between items-center rounded-t-xl ${snapshot.isDraggingOver ? 'bg-neutral-800' : ''} ${stage === 'nao_lido' ? 'bg-red-900/10 border-red-900/30' : ''}`}>
                                                <h3 className={`font-bold uppercase text-xs tracking-wider ${stage === 'agendado' ? 'text-purple-400' : 'text-neutral-400'}`}>
                                                    {stage === 'novo' ? '📂 Lead' :
                                                        stage === 'contactado' ? '🤖 Contactado / IA Respondendo' :
                                                            stage === 'agendado' ? '👋 Responder Manual' : stage}
                                                </h3>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] text-neutral-500">{visibleLeads.length} de</span>
                                                    <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-0.5 rounded-full border border-neutral-700">{totalCount}</span>
                                                </div>
                                            </div>

                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 ${snapshot.isDraggingOver ? 'bg-neutral-800/50' : ''} transition-colors min-h-[150px]`}
                                            >
                                                {visibleLeads.map((lead, index) => (
                                                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`bg-neutral-800 p-4 rounded-lg mb-2 shadow-sm border border-neutral-700 group overflow-hidden select-none relative
                                                                    ${snapshot.isDragging ? 'shadow-2xl border-purple-500 z-50 bg-neutral-700' : 'hover:border-neutral-600'}
                                                                    ${(lead.lead_pipeline?.unread_count || 0) > 0 ? 'border-l-4 border-l-red-500' : ''}
                                                                `}
                                                                style={provided.draggableProps.style}
                                                            >
                                                                {/* Unread Badge Flutuante */}
                                                                {(lead.lead_pipeline?.unread_count || 0) > 0 && (
                                                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg animate-pulse z-10">
                                                                        {lead.lead_pipeline?.unread_count}
                                                                    </div>
                                                                )}

                                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                                    <div className="flex gap-3">
                                                                        <div className="relative">
                                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xs font-bold shadow-lg">
                                                                                {lead.full_name ? lead.full_name[0].toUpperCase() : 'L'}
                                                                            </div>
                                                                            {/* Temperature Badge */}
                                                                            {lead.lead_pipeline?.temperature && (
                                                                                <span className="absolute -bottom-1 -right-1 text-[10px] bg-neutral-900 rounded-full w-4 h-4 flex items-center justify-center border border-neutral-700 shadow-sm" title={`Temperatura: ${lead.lead_pipeline.temperature}`}>
                                                                                    {lead.lead_pipeline.temperature === 'quente' ? '🔥' :
                                                                                        lead.lead_pipeline.temperature === 'morno' ? '☁️' :
                                                                                            lead.lead_pipeline.temperature === 'off' ? '🚫' : '❄️'}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium text-sm truncate w-32 md:w-40 text-neutral-200">{lead.full_name || 'Sem Nome'}</p>
                                                                            <p className="text-xs text-neutral-500 font-mono">{lead.phone_e164}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-2 justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 items-center">
                                                                    <div className="flex gap-1">
                                                                        <button onClick={() => handleUpdateTemp(lead.id, 'frio')} className={`p-1 rounded hover:bg-neutral-700 text-[10px] border ${lead.lead_pipeline?.temperature === 'frio' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-500'}`} title="Marcar Frio">❄️</button>
                                                                        <button onClick={() => handleUpdateTemp(lead.id, 'morno')} className={`p-1 rounded hover:bg-neutral-700 text-[10px] border ${lead.lead_pipeline?.temperature === 'morno' ? 'border-gray-500 text-gray-300' : 'border-transparent text-neutral-500'}`} title="Marcar Morno">☁️</button>
                                                                        <button onClick={() => handleUpdateTemp(lead.id, 'quente')} className={`p-1 rounded hover:bg-neutral-700 text-[10px] border ${lead.lead_pipeline?.temperature === 'quente' ? 'border-orange-500 text-orange-400' : 'border-transparent text-neutral-500'}`} title="Marcar Quente">🔥</button>
                                                                        <button onClick={() => handleUpdateTemp(lead.id, 'off')} className={`p-1 rounded hover:bg-neutral-700 text-[10px] border ${lead.lead_pipeline?.temperature === 'off' ? 'border-red-900 text-red-500' : 'border-transparent text-neutral-500'}`} title="Marcar OFF">🚫</button>
                                                                    </div>
                                                                    <div className="flex gap-1 justify-end">
                                                                        <a
                                                                            href={`https://wa.me/${lead.phone_e164?.replace('+', '')}`}
                                                                            target="_blank" rel="noopener noreferrer"
                                                                            className="p-1.5 rounded-md hover:bg-neutral-700 text-neutral-400 hover:text-green-400 transition" title="Abrir WhatsApp Web">
                                                                            <ExternalLink size={14} />
                                                                        </a>
                                                                        <button
                                                                            onClick={() => openEditModal(lead)}
                                                                            className="p-1.5 rounded-md hover:bg-neutral-700 text-neutral-400 hover:text-blue-400 transition" title="Editar">
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openMessageModal(lead)}
                                                                            className="p-1.5 rounded-md hover:bg-neutral-700 text-neutral-400 hover:text-green-400 transition" title="Mensagem">
                                                                            <MessageCircle size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}

                                                {/* LOAD MORE BUTTON */}
                                                {totalCount > limit && (
                                                    <button
                                                        onClick={() => loadMore(stage)}
                                                        className="w-full py-2 mt-2 text-xs text-neutral-500 hover:text-purple-400 border border-dashed border-neutral-700 rounded hover:border-purple-500 transition"
                                                    >
                                                        Carregar mais 50...
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            )
                        })}
                    </div>
                </DragDropContext>
            </div>

            {/* --- MODALS --- */}

            {/* CREATE / EDIT MODAL */}
            {(modalType === 'create' || modalType === 'edit') && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><X size={20} /></button>

                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            {modalType === 'create' ? <Plus size={24} className="text-purple-500" /> : <Edit2 size={24} className="text-blue-500" />}
                            {modalType === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs uppercase text-neutral-500 font-bold tracking-wider">Nome Completo</label>
                                <input type="text" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1 focus:border-purple-500 outline-none"
                                    value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs uppercase text-neutral-500 font-bold tracking-wider">Telefone (Ex: 554799999999)</label>
                                <input type="text" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1 focus:border-purple-500 outline-none"
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs uppercase text-neutral-500 font-bold tracking-wider">E-mail</label>
                                <input type="email" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1 focus:border-purple-500 outline-none"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                        </div>

                        <button
                            onClick={modalType === 'create' ? handleCreateLead : handleUpdateLead}
                            className="w-full mt-8 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition flex justify-center items-center gap-2">
                            <Save size={18} /> Salvar
                        </button>
                    </div>
                </div>
            )}

            {/* MESSAGE MODAL */}
            {modalType === 'message' && selectedLead && (
                <MessageModal
                    lead={selectedLead}
                    onClose={closeModal}
                    onUpdateTemp={handleUpdateTemp}
                />
            )}

        </div>
    );
}
