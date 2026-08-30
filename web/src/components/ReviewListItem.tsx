import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { formatDiasAberto } from "../formatting";
import type { ReviewItem } from "../types";
import { StatusBadge } from "./StatusBadge";

interface ReviewListItemProps {
  mr: ReviewItem;
  borderColorClass: string;
  badgeColorClass: string;
}

export function ReviewListItem({ mr, borderColorClass, badgeColorClass }: ReviewListItemProps) {
  return (
    <a
      href={mr.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 rounded-md border-l-4 bg-surface-hover px-3 py-2 transition hover:bg-surface-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${borderColorClass}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{mr.title}</p>
        <span className="mt-1 block truncate font-mono text-xs text-foreground-subtle">
          {mr.branch} · {mr.author}
        </span>
      </div>
      <StatusBadge
        icon={ClockCircleIcon}
        text={formatDiasAberto(mr.diasAberto, mr.horasAberto)}
        className={badgeColorClass}
      />
    </a>
  );
}
