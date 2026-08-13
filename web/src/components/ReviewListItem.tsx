import { formatDiasAberto } from "../formatting";
import type { ReviewItem } from "../types";

export function ReviewListItem({ mr }: { mr: ReviewItem }) {
  return (
    <a
      href={mr.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-md border-l-4 border-l-status-waiting bg-white/5 px-3 py-2 transition hover:bg-white/10"
    >
      <p className="truncate text-sm text-white/90">{mr.title}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs text-white/40">{mr.branch}</span>
        <span className="flex-none text-xs text-white/50">
          {mr.author} · {formatDiasAberto(mr.diasAberto)}
        </span>
      </div>
    </a>
  );
}
