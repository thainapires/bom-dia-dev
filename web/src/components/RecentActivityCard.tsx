import type { IconProps } from "@solar-icons/react";
import { CheckCircleIcon } from "@solar-icons/react/linear/check-circle";
import { FileTextIcon } from "@solar-icons/react/linear/file-text";
import { QuestionCircleIcon } from "@solar-icons/react/linear/question-circle";
import type { ComponentType } from "react";
import { formatRelativeDays } from "../formatting";
import type { ActivityItem, ActivityKind } from "../types";
import { IoGitMergeOutline } from "react-icons/io5";
import { GoGitPullRequest } from "react-icons/go";
import { MdCommit } from "react-icons/md";
import { TiFlowMerge } from "react-icons/ti";

const ICON_BY_KIND: Record<ActivityKind, ComponentType<IconProps>> = {
  commit: MdCommit,
  merge: TiFlowMerge,
  review: IoGitMergeOutline,
  abertura: GoGitPullRequest,
  issue: QuestionCircleIcon,
  comentario: FileTextIcon,
  aprovacaoRecebida: CheckCircleIcon,
};

const COLOR_BY_KIND: Record<ActivityKind, { text: string; bg: string }> = {
  commit: { text: "text-white/60", bg: "bg-white/10" },
  merge: { text: "text-purple-300", bg: "bg-purple-500/20" },
  review: { text: "text-status-ready", bg: "bg-status-ready/20" },
  abertura: { text: "text-purple-300", bg: "bg-purple-500/20" },
  issue: { text: "text-white/60", bg: "bg-white/10" },
  comentario: { text: "text-white/60", bg: "bg-white/10" },
  aprovacaoRecebida: { text: "text-status-ready", bg: "bg-status-ready/20" },
};

const LABEL_BY_KIND: Record<ActivityKind, string> = {
  commit: "Fez commits",
  merge: "Merge realizado",
  review: "Aprovou um MR",
  abertura: "Abriu um MR",
  issue: "Assumiu uma issue",
  comentario: "Comentou em um MR",
  aprovacaoRecebida: "Teu MR foi aprovado",
};

export function RecentActivityCard({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rounded-lg bg-card p-4 border-white/5 border">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white/80">
          Atividade recente
          <span className="ml-2 text-white/30">{items.length}</span>
        </h2>
        <a
          href="https://gitlab.com/users/thainapires.rp/activity"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-white/50 hover:text-white/80"
        >
          Ver tudo
        </a>
      </div>
      <div className="mt-3 flex max-h-80 flex-col gap-3 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-white/40">Nenhuma atividade registrada.</p>
        ) : (
          items.map((item, index) => {
            const Icon = ICON_BY_KIND[item.kind];
            const color = COLOR_BY_KIND[item.kind];
            return (
              <div key={index} className="flex items-start gap-3">
                <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${color.bg}`}>
                  <Icon size={16} className={color.text} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white/90">{LABEL_BY_KIND[item.kind]}</p>
                  <p className="truncate text-xs text-white/40">{item.text}</p>
                </div>
                <span className="flex-none text-xs text-white/40">{formatRelativeDays(item.createdAt)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
