import { HugeiconsIcon } from "@hugeicons/react";
import Alert01Icon from "@hugeicons/core-free-icons/Alert01Icon";
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import ThumbsUpIcon from "@hugeicons/core-free-icons/ThumbsUpIcon";
import type { IconSvgElement } from "@hugeicons/react";
import { formatDiasAberto } from "../formatting";
import type { MrItem } from "../types";
import { StatusBadge } from "./StatusBadge";

const borderByStatus: Record<MrItem["status"], string> = {
  pronto: "border-l-status-ready",
  aguardando: "border-l-status-waiting",
  atencao: "border-l-status-attention",
};

const badgeByStatus: Record<MrItem["status"], { icon: IconSvgElement; className: string }> = {
  pronto: { icon: ThumbsUpIcon, className: "bg-status-ready/15 text-status-ready" },
  aguardando: { icon: Clock01Icon, className: "bg-status-waiting/15 text-status-waiting" },
  atencao: { icon: Alert01Icon, className: "bg-status-attention/15 text-status-attention" },
};

function metadataText(mr: MrItem): string {
  if (mr.status === "atencao") return mr.motivoAtencao ?? "Precisa de atenção";
  if (mr.status === "pronto") {
    return mr.approvals === 1 ? "1 aprovação" : `${mr.approvals} aprovações`;
  }
  return formatDiasAberto(mr.diasAberto);
}

export function MrListItem({ mr }: { mr: MrItem }) {
  const badge = badgeByStatus[mr.status];
  return (
    <a
      href={mr.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 rounded-md border-l-4 bg-white/5 px-3 py-2 transition hover:bg-white/10 ${borderByStatus[mr.status]}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {mr.esquecido && (
            <HugeiconsIcon
              icon={Alert01Icon}
              size={13}
              className="flex-none text-status-attention"
              aria-label="Aberto há vários dias, pode ter sido esquecido"
            />
          )}
          <p className="truncate text-sm text-white/90">{mr.title}</p>
        </div>
        <span className="mt-1 block truncate font-mono text-xs text-white/40">{mr.branch}</span>
      </div>
      <StatusBadge icon={badge.icon} text={metadataText(mr)} className={badge.className} />
    </a>
  );
}
