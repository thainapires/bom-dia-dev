import type { DashboardResponse } from "../types";

interface SummaryCardsProps {
  summary: DashboardResponse["summary"];
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { label: "Prontos pra merge", value: summary.pronto, color: "text-status-ready" },
    { label: "Precisa revisar", value: summary.precisaRevisar, color: "text-status-waiting" },
    { label: "Aguardando review", value: summary.aguardando, color: "text-status-waiting" },
    { label: "Precisam de atenção", value: summary.atencao, color: "text-status-attention" },
    {
      label: "Tempo médio até merge",
      value: summary.tempoMedioMergeDias,
      color: "text-white",
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-5 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg bg-card px-4 py-3">
          <p className="text-xs text-white/50">{card.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
