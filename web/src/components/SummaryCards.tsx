import { ChatRoundIcon } from "@solar-icons/react/bold-duotone/chat-round";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { DangerTriangleIcon } from "@solar-icons/react/bold-duotone/danger-triangle";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { HourglassIcon } from "@solar-icons/react/bold-duotone/hourglass";
import { StopwatchIcon } from "@solar-icons/react/bold-duotone/stopwatch";
import type { DashboardResponse } from "../types";

interface SummaryCardsProps {
  summary: DashboardResponse["summary"];
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { label: "Prontos pra merge", value: summary.pronto, color: "text-status-ready", icon: CheckCircleIcon },
    { label: "Precisa revisar", value: summary.precisaRevisar, color: "text-status-waiting", icon: EyeIcon },
    {
      label: "Aguardando resposta",
      value: summary.aguardandoResposta,
      color: "text-status-neutral",
      icon: ChatRoundIcon,
    },
    { label: "Aguardando review", value: summary.aguardando, color: "text-status-waiting", icon: ClockCircleIcon },
    {
      label: "Precisam de atenção",
      value: summary.atencao,
      color: "text-status-attention",
      icon: DangerTriangleIcon,
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
      icon: StopwatchIcon,
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7 ">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg bg-card px-4 py-3 border-white/5 border">
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
