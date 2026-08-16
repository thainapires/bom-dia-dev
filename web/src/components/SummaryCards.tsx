import { AlertTriangle, CheckCircle2, Clock, Eye, Hourglass, Timer } from "lucide-react";
import type { DashboardResponse } from "../types";

interface SummaryCardsProps {
  summary: DashboardResponse["summary"];
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { label: "Prontos pra merge", value: summary.pronto, color: "text-status-ready", icon: CheckCircle2 },
    { label: "Precisa revisar", value: summary.precisaRevisar, color: "text-status-waiting", icon: Eye },
    { label: "Aguardando review", value: summary.aguardando, color: "text-status-waiting", icon: Clock },
    {
      label: "Precisam de atenção",
      value: summary.atencao,
      color: "text-status-attention",
      icon: AlertTriangle,
    },
    {
      label: "Tempo até 1ª aprovação",
      value: summary.tempoMedioPrimeiraAprovacaoDias,
      color: "text-white",
      icon: Hourglass,
    },
    {
      label: "Tempo médio até merge",
      value: summary.tempoMedioMergeDias,
      color: "text-white",
      icon: Timer,
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg bg-card px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs text-white/50 uppercase">
            <card.icon size={17} className={card.color} />
            {card.label}
          </p>
          <p className={`mt-1 text-2xl font-semibold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
