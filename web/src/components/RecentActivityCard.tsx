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
import { Card } from "./ui";

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
  commit: { text: "text-foreground-muted", bg: "bg-surface-selected" },
  merge: { text: "text-category-purple", bg: "bg-category-purple-bg" },
  review: { text: "text-success", bg: "bg-success/20" },
  abertura: { text: "text-category-purple", bg: "bg-category-purple-bg" },
  issue: { text: "text-foreground-muted", bg: "bg-surface-selected" },
  comentario: { text: "text-foreground-muted", bg: "bg-surface-selected" },
  aprovacaoRecebida: { text: "text-success", bg: "bg-success/20" },
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
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground-soft">
          Atividade recente
          <span className="ml-2 text-foreground-disabled">{items.length}</span>
        </h2>
        <a
          href="https://gitlab.com/users/thainapires.rp/activity"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground-soft"
        >
          Ver tudo
        </a>
      </div>
      <div className="mt-3 flex max-h-80 flex-col gap-3 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-foreground-subtle">Nenhuma atividade registrada.</p>
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
                  <p className="text-sm font-medium text-foreground">{LABEL_BY_KIND[item.kind]}</p>
                  <p className="truncate text-xs text-foreground-subtle">{item.text}</p>
                </div>
                <span className="flex-none text-xs text-foreground-subtle">{formatRelativeDays(item.createdAt)}</span>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
