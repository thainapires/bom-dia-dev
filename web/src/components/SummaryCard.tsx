import type { IconProps } from "@solar-icons/react";
import type { ComponentType } from "react";

interface SummaryCardProps {
  label: string;
  value: number;
  color: string;
  background: string;
  icon: ComponentType<IconProps>;
  subtitle: string;
  subtitleZero: string;
  size?: string;
}

export function SummaryCard({ label, value, color, background, icon: Icon, subtitle, subtitleZero, size }: SummaryCardProps) {
  return (
    <div className="rounded-lg bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-1.5 text-xs text-muted-foreground uppercase">
        {label}
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${background}`}>
          <Icon className={color} size={size} />
        </div>
      </div>
      <p className={`text-3xl font-semibold ${color}`}>{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{value > 0 ? subtitle : subtitleZero}</p>
    </div>
  );
}
