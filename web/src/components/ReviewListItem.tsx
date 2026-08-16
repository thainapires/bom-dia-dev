import { Clock } from "lucide-react";
import { formatDiasAberto } from "../formatting";
import type { ReviewItem } from "../types";
import { StatusBadge } from "./StatusBadge";

export function ReviewListItem({ mr }: { mr: ReviewItem }) {
  return (
    <a
      href={mr.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md border-l-4 border-l-status-waiting bg-white/5 px-3 py-2 transition hover:bg-white/10"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white/90">{mr.title}</p>
        <span className="mt-1 block truncate font-mono text-xs text-white/40">
          {mr.branch} · {mr.author}
        </span>
      </div>
      <StatusBadge
        icon={Clock}
        text={formatDiasAberto(mr.diasAberto)}
        className="bg-status-waiting/15 text-status-waiting"
      />
    </a>
  );
}
