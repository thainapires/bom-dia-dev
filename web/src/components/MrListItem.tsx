import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { DangerTriangleIcon } from "@solar-icons/react/bold-duotone/danger-triangle";
import { LikeIcon } from "@solar-icons/react/bold-duotone/like";
import type { IconProps } from "@solar-icons/react";
import type { ComponentType } from "react";
import { formatDiasAberto } from "../formatting";
import type { MrItem } from "../types";
import { StatusBadge } from "./StatusBadge";

const borderByStatus: Record<MrItem["status"], string> = {
  pronto: "border-l-status-ready",
  aguardando: "border-l-status-waiting",
  atencao: "border-l-status-attention",
};

const badgeByStatus: Record<MrItem["status"], { icon: ComponentType<IconProps>; className: string }> = {
  pronto: { icon: LikeIcon, className: "bg-status-ready/15 text-status-ready" },
  aguardando: { icon: ClockCircleIcon, className: "bg-status-waiting/15 text-status-waiting" },
  atencao: { icon: DangerTriangleIcon, className: "bg-status-attention/15 text-status-attention" },
};

function metadataText(mr: MrItem): string {
  if (mr.status === "atencao") return mr.motivoAtencao ?? "Precisa de atenção";
  if (mr.status === "pronto") {
    return mr.approvals === 1 ? "1 aprovação" : `${mr.approvals} aprovações`;
  }
  return formatDiasAberto(mr.diasAberto, mr.horasAberto);
}

export function MrListItem({ mr }: { mr: MrItem }) {
  const badge = badgeByStatus[mr.status];
  return (
    <a
      href={mr.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 rounded-md border-l-4 bg-white/5 px-3 py-2 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${borderByStatus[mr.status]}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {mr.esquecido && (
            <DangerTriangleIcon
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
