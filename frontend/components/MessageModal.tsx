"use client";
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Image as ImageIcon, Send, Loader2 } from 'lucide-react';

interface Message {
    id: string;
    direction: 'inbound' | 'outbound';
    content: string;
    content_type: string;
    timestamp: string;
}

interface MessageModalProps {
    lead: any;
    onClose: () => void;
    onUpdateTemp?: (id: string, temp: string) => void;
}

export default function MessageModal({ lead, onClose, onUpdateTemp }: MessageModalProps) {
    const [msg, setMsg] = useState("");
    const [url, setUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState<Message[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/leads/${lead.id}/history`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
                setLoadingHistory(false);
                scrollToBottom();
            }
        } catch (error) {
            console.error(error);
            setLoadingHistory(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    };

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 3000); // Polling real-time
        return () => clearInterval(interval);
    }, [lead.id]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploading(true);

        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onloadend = () => {
            const base64String = reader.result as string;
            setUrl(base64String);
            setUploading(false);
        };

        reader.readAsDataURL(file);
    };

    const handleSend = async () => {
        if (!msg.trim() && !url) return;
        setSending(true);

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/leads/${lead.id}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, media_url: url })
            });

            if (res.ok) {
                const newMsg: Message = {
                    id: 'temp-' + Date.now(),
                    direction: 'outbound',
                    content: msg,
                    content_type: url ? 'image' : 'text',
                    timestamp: new Date().toISOString()
                };
                setHistory(prev => [...prev, newMsg]);
                setMsg("");
                setUrl("");
                scrollToBottom();

                // Se o lead estava frio, talvez marcar como morno? Opcional.
            } else {
                alert("Erro ao enviar mensagem.");
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão.");
        } finally {
            setSending(false);
        }
    };

    // Suporte a ENTER para enviar
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-neutral-700 p-0 rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col h-[85vh]">

                {/* Header */}
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2 text-green-500">
                            <MessageCircle size={20} /> Chat WhatsApp
                        </h2>
                        <p className="text-neutral-400 text-xs mt-0.5">Falando com: <span className="text-white font-medium">{lead.full_name || lead.phone_e164}</span></p>
                    </div>
                    <button onClick={onClose} className="bg-neutral-800 hover:bg-neutral-700 p-2 rounded-lg text-neutral-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Chat History Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-950/50 scrollbar-thin scrollbar-thumb-neutral-800" ref={scrollRef}>
                    {loadingHistory ? (
                        <div className="flex justify-center items-center h-full text-neutral-500 gap-2">
                            <Loader2 className="animate-spin" size={20} /> Carregando histórico...
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-600 gap-2 opacity-50">
                            <MessageCircle size={48} />
                            <p className="text-sm">Nenhuma mensagem trocada ainda.</p>
                        </div>
                    ) : (
                        history.map((m) => (
                            <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm relative ${m.direction === 'outbound'
                                    ? 'bg-green-900/20 text-green-100 border border-green-900/30 rounded-tr-sm'
                                    : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-tl-sm'
                                    }`}>
                                    {m.content_type === 'image' && (
                                        <div className="mb-2 rounded-lg overflow-hidden bg-black/20">
                                            {/* Se tiver URL de imagem no banco, mostra aqui. Por enquanto content_type marca */}
                                            <p className="text-[10px] uppercase font-bold opacity-70 p-1 flex items-center gap-1"><ImageIcon size={10} /> Mídia</p>
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                                    <p className="text-[10px] opacity-40 text-right mt-1 font-mono">
                                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Media Preview */}
                {url && (
                    <div className="px-4 py-2 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-neutral-800 rounded overflow-hidden relative">
                                {/* Preview simplificado */}
                                <img src={url} alt="preview" className="object-cover w-full h-full" />
                            </div>
                            <span className="text-xs text-green-400">Imagem anexada</span>
                        </div>
                        <button onClick={() => setUrl('')} className="text-red-400 hover:text-red-300 text-xs hover:underline">Remover</button>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-neutral-900 border-t border-neutral-800 rounded-b-2xl space-y-3">

                    {/* Temperature Controls */}
                    {onUpdateTemp && (
                        <div className="flex justify-center gap-2 pb-1">
                            <button onClick={() => onUpdateTemp(lead.id, 'frio')} className={`px-3 py-1 rounded-full text-xs font-bold border transition flex items-center gap-1 ${lead.lead_pipeline?.temperature === 'frio' ? 'bg-blue-900/40 border-blue-500 text-blue-300' : 'bg-neutral-800/50 border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300'}`}>❄️ Frio</button>
                            <button onClick={() => onUpdateTemp(lead.id, 'morno')} className={`px-3 py-1 rounded-full text-xs font-bold border transition flex items-center gap-1 ${lead.lead_pipeline?.temperature === 'morno' ? 'bg-gray-700/40 border-gray-400 text-gray-200' : 'bg-neutral-800/50 border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300'}`}>☁️ Morno</button>
                            <button onClick={() => onUpdateTemp(lead.id, 'quente')} className={`px-3 py-1 rounded-full text-xs font-bold border transition flex items-center gap-1 ${lead.lead_pipeline?.temperature === 'quente' ? 'bg-amber-900/40 border-amber-500 text-amber-300' : 'bg-neutral-800/50 border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300'}`}>🔥 Quente</button>
                        </div>
                    )}

                    <div className="flex gap-3 items-end">
                        <label className={`p-3 rounded-xl border border-neutral-700 cursor-pointer transition ${uploading ? 'bg-neutral-800 opacity-50' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500'}`}>
                            <ImageIcon size={20} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading || sending} />
                        </label>

                        <div className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl flex items-center px-4 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/50 transition">
                            <input
                                className="bg-transparent w-full py-3 outline-none text-white placeholder-neutral-500"
                                placeholder="Digite sua mensagem..."
                                value={msg}
                                onChange={e => setMsg(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={sending}
                            />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={sending || (!msg.trim() && !url)}
                            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition shadow-lg shadow-green-900/20 active:scale-95 flex items-center justify-center min-w-[3rem]"
                        >
                            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
