import { Calendar, ArrowLeft } from "lucide-react";
import Link from 'next/link';

export default function AgendaPage() {
    return (
        <div className="min-h-screen bg-neutral-900 text-white p-6 font-sans overflow-hidden flex flex-col">
            {/* Header Padrão */}
            <header className="flex items-center gap-4 mb-8 pb-4 border-b border-neutral-800">
                <Link href="/" className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-white">
                    <ArrowLeft size={20} />
                </Link>
                <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center border border-blue-500/30 text-blue-400">
                    <Calendar size={22} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white leading-tight">Agenda</h1>
                    <p className="text-xs text-neutral-500 font-medium">Gestão de Compromissos</p>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-2xl border-dashed">
                <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                    <Calendar size={48} className="text-neutral-600" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Módulo em Desenvolvimento</h2>
                <p className="text-neutral-400 max-w-md text-center">
                    A integração com Google Calendar e agendamento automático será configurada aqui em breve.
                </p>
            </div>
        </div>
    )
}
