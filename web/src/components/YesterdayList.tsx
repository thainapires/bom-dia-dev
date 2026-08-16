import {
  CircleDot,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequestArrow,
  MessageSquareCheck,
} from "lucide-react";
import type { ActivityItem } from "../types";

const iconByKind: Record<ActivityItem["kind"], typeof GitCommitHorizontal> = {
  commit: GitCommitHorizontal,
  merge: GitMerge,
  review: MessageSquareCheck,
  abertura: GitPullRequestArrow,
  issue: CircleDot,
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function YesterdayList({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rounded-lg bg-card p-4">
      <h2 className="text-sm font-semibold text-white/80">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-status-neutral" />
        Ontem você fez
      </h2>
      <div className="mt-3 flex max-h-64 flex-col gap-1.5 overflow-y-auto font-mono text-xs">
        {items.length === 0 ? (
          <p className="font-sans text-sm text-white/40">Nenhuma atividade registrada.</p>
        ) : (
          items.map((item, index) => {
            const Icon = iconByKind[item.kind];
            return (
              <div key={index} className="flex min-w-0 items-center gap-2 text-white/70">
                <Icon size={13} className="flex-none text-white/40" />
                <span className="flex-none text-white/30">{formatTime(item.createdAt)}</span>
                <span className="min-w-0 flex-1 truncate">{item.text}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
