import type { IconProps } from "@solar-icons/react";
import { ChatLineIcon } from "@solar-icons/react/linear/chat-line";
import { CodeIcon } from "@solar-icons/react/linear/code";
import { DangerIcon } from "@solar-icons/react/linear/danger";
import { FileTextIcon } from "@solar-icons/react/linear/file-text";
import type { ComponentType } from "react";
import type { DashboardResponse } from "../types";
import { SummaryCard } from "./SummaryCard";
import { GoGitPullRequest } from "react-icons/go";

interface SummaryCardsProps {
  summary: DashboardResponse["summary"];
}

interface CardConfig {
  label: string;
  value: number;
  color: string;
  background: string;
  icon: ComponentType<IconProps>;
  subtitle: string;
  subtitleZero: string;
  size?: string;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards: CardConfig[] = [
    {
      label: "Prontos pra merge",
      value: summary.pronto,
      color: "text-success",
      background: "bg-success/20",
      icon: GoGitPullRequest,
      subtitle: "MR's prontos",
      subtitleZero: "Nenhum MR pronto",
      size: "20"
    },
    {
      label: "Precisa revisar",
      value: summary.precisaRevisar,
      color: "text-pending",
      background: "bg-pending/20",
      icon: FileTextIcon,
      subtitle: "Aguardando sua revisão",
      subtitleZero: "Nenhum MR para revisar",
    },
    {
      label: "Aguardando resposta (meus)",
      value: summary.aguardandoRespostaMeus,
      color: "text-info",
      background: "bg-info/20",
      icon: ChatLineIcon,
      subtitle: "Comentários seus sem resposta",
      subtitleZero: "Você respondeu a todos",
    },
    {
      label: "Aguardando resposta (outros)",
      value: summary.aguardandoRespostaOutros,
      color: "text-info-soft",
      background: "bg-info-soft/20",
      icon: ChatLineIcon,
      subtitle: "Comentários de colegas sem resposta",
      subtitleZero: "Nenhum comentário de colega pendente",
    },
    {
      label: "Aguardando review",
      value: summary.aguardando,
      color: "text-pending",
      background: "bg-pending/20",
      icon: CodeIcon,
      subtitle: "MR's abertos",
      subtitleZero: "Nenhum MR aguardando review",
    },
    {
      label: "Precisam de atenção",
      value: summary.atencao,
      color: "text-attention",
      background: "bg-attention/20",
      icon: DangerIcon,
      subtitle: "MR's que precisam de atenção",
      subtitleZero: "Tudo em dia! 🎉",
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </div>
  );
}
