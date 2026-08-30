import { CheckCircleIcon } from "@solar-icons/react/bold/check-circle";
import type { IconProps } from "@solar-icons/react";
import type { ComponentType } from "react";
import type { DailyStats } from "../../types";
import { ClipboardCheckIcon } from "@solar-icons/react/bold/clipboard-check";
import { ClockCircleIcon } from "@solar-icons/react/bold/clock-circle";
import { DocumentAddIcon } from "@solar-icons/react/bold/document-add";
import { Card } from "../ui";

interface NotesSummaryCardProps {
  stats: DailyStats;
}

interface Tile {
  label: string;
  value: string;
  icon: ComponentType<IconProps>;
  color: string;
  background: string;
}

export function NotesSummaryCard({ stats }: NotesSummaryCardProps) {
  const tiles: Tile[] = [
    {
      label: "Tarefas no total",
      value: String(stats.totalTasks),
      icon: ClipboardCheckIcon,
      color: "text-primary",
      background: "bg-primary/20",
    },
    {
      label: "Concluídas",
      value: String(stats.completedTasks),
      icon: CheckCircleIcon,
      color: "text-success",
      background: "bg-success/20",
    },
    {
      label: "Progresso do dia",
      value: `${stats.progressPercent}%`,
      icon: ClockCircleIcon,
      color: "text-pending",
      background: "bg-pending/20",
    },
    {
      label: "Palavras na nota",
      value: String(stats.wordCount),
      icon: DocumentAddIcon,
      color: "text-primary",
      background: "bg-primary/20",
    },
  ];

  return (
    <Card>
      <h2 className="text-sm font-semibold text-foreground-soft">Resumo do dia</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex gap-3 items-center rounded-md bg-surface-input border border-border-default px-6 py-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tile.background}`}>
              <tile.icon className={tile.color} size={24} />
            </div>
            <div className="flex flex-col">
              <p className={`mt-2 text-xl font-semibold ${tile.color}`}>{tile.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{tile.label}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
