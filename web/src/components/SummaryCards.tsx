import { HugeiconsIcon } from "@hugeicons/react";
import Alert01Icon from "@hugeicons/core-free-icons/Alert01Icon";
import BubbleChatIcon from "@hugeicons/core-free-icons/BubbleChatIcon";
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon";
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import HourglassIcon from "@hugeicons/core-free-icons/HourglassIcon";
import Timer01Icon from "@hugeicons/core-free-icons/Timer01Icon";
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon";
import type { DashboardResponse } from "../types";

interface SummaryCardsProps {
  summary: DashboardResponse["summary"];
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { label: "Prontos pra merge", value: summary.pronto, color: "text-status-ready", icon: CheckmarkCircle02Icon },
    { label: "Precisa revisar", value: summary.precisaRevisar, color: "text-status-waiting", icon: ViewIcon },
    {
      label: "Aguardando resposta",
      value: summary.aguardandoResposta,
      color: "text-status-neutral",
      icon: BubbleChatIcon,
    },
    { label: "Aguardando review", value: summary.aguardando, color: "text-status-waiting", icon: Clock01Icon },
    {
      label: "Precisam de atenção",
      value: summary.atencao,
      color: "text-status-attention",
      icon: Alert01Icon,
    },
    {
      label: "Tempo até 1ª aprovação",
      value: summary.tempoMedioPrimeiraAprovacaoDias,
      color: "text-white",
      icon: HourglassIcon,
    },
    {
      label: "Tempo médio até merge",
      value: summary.tempoMedioMergeDias,
      color: "text-white",
      icon: Timer01Icon,
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7 ">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg bg-card px-4 py-3 border-white/5 border">
          <p className="flex items-center gap-1.5 text-xs text-white/50 uppercase">
            <HugeiconsIcon icon={card.icon} size={17} className={card.color} />
            {card.label}
          </p>
          <p className={`mt-1 text-2xl font-semibold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
