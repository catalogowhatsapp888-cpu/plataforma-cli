import { Calendar } from "lucide-react";

export default function AgendaPage() {
    return (
        <div className="p-8 h-screen flex flex-col">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-8">
                Agenda
            </h1>

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
