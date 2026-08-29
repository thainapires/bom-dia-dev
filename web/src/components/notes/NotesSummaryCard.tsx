import { CheckSquareIcon } from "@solar-icons/react/bold-duotone/check-square";
import { ChecklistIcon } from "@solar-icons/react/bold-duotone/checklist";
import { PulseIcon } from "@solar-icons/react/bold-duotone/pulse";
import { TextSquareIcon } from "@solar-icons/react/bold-duotone/text-square";
import type { IconProps } from "@solar-icons/react";
import type { ComponentType } from "react";
import type { DailyStats } from "../../types";

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
      icon: ChecklistIcon,
      color: "text-status-neutral",
      background: "bg-status-neutral/20",
    },
    {
      label: "Concluídas",
      value: String(stats.completedTasks),
      icon: CheckSquareIcon,
      color: "text-status-ready",
      background: "bg-status-ready/20",
    },
    {
      label: "Progresso do dia",
      value: `${stats.progressPercent}%`,
      icon: PulseIcon,
      color: "text-status-waiting",
      background: "bg-status-waiting/20",
    },
    {
      label: "Palavras na nota",
      value: String(stats.wordCount),
      icon: TextSquareIcon,
      color: "text-primary",
      background: "bg-primary/20",
    },
  ];

  return (
    <div className="rounded-lg border border-white/5 bg-card p-4">
      <h2 className="text-sm font-semibold text-white/80">Resumo do dia</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-md bg-white/5 px-3 py-3">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tile.background}`}>
              <tile.icon className={tile.color} size={16} />
            </div>
            <p className={`mt-2 text-xl font-semibold ${tile.color}`}>{tile.value}</p>
            <p className="mt-0.5 text-xs text-white/50">{tile.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
