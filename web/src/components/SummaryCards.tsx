import type { IconProps } from "@solar-icons/react";
import { ChatLineIcon } from "@solar-icons/react/linear/chat-line";
import { CodeIcon } from "@solar-icons/react/linear/code";
import { DangerIcon } from "@solar-icons/react/linear/danger";
import { FileTextIcon } from "@solar-icons/react/linear/file-text";
import { ShareIcon } from "@solar-icons/react/linear/share";
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
      color: "text-status-ready",
      background: "bg-status-ready/20",
      icon: GoGitPullRequest,
      subtitle: "MR's prontos",
      subtitleZero: "Nenhum MR pronto",
      size: "20"
    },
    {
      label: "Precisa revisar",
      value: summary.precisaRevisar,
      color: "text-status-waiting",
      background: "bg-status-waiting/20",
      icon: FileTextIcon,
      subtitle: "Aguardando sua revisão",
      subtitleZero: "Nenhum MR para revisar",
    },
    {
      label: "Aguardando resposta",
      value: summary.aguardandoResposta,
      color: "text-blue-400",
      background: "bg-blue-500/20",
      icon: ChatLineIcon,
      subtitle: "Você respondeu a todos",
      subtitleZero: "Nenhum MR aguardando resposta",
    },
    {
      label: "Aguardando review",
      value: summary.aguardando,
      color: "text-purple-300",
      background: "bg-purple-500/20",
      icon: CodeIcon,
      subtitle: "MR's abertos",
      subtitleZero: "Nenhum MR aguardando review",
    },
    {
      label: "Precisam de atenção",
      value: summary.atencao,
      color: "text-status-attention",
      background: "bg-status-attention/20",
      icon: DangerIcon,
      subtitle: "MR's que precisam de atenção",
      subtitleZero: "Tudo em dia! 🎉",
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </div>
  );
}
