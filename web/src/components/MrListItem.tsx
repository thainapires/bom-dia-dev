import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { DangerTriangleIcon } from "@solar-icons/react/bold-duotone/danger-triangle";
import { LikeIcon } from "@solar-icons/react/bold-duotone/like";
import type { IconProps } from "@solar-icons/react";
import type { ComponentType } from "react";
import { formatDiasAberto } from "../formatting";
import type { MrItem } from "../types";
import { StatusBadge } from "./StatusBadge";

const borderByStatus: Record<MrItem["status"], string> = {
  pronto: "border-l-success",
  aguardando: "border-l-pending",
  atencao: "border-l-attention",
};

const badgeByStatus: Record<MrItem["status"], { icon: ComponentType<IconProps>; className: string }> = {
  pronto: { icon: LikeIcon, className: "bg-success/15 text-success" },
  aguardando: { icon: ClockCircleIcon, className: "bg-pending/15 text-pending" },
  atencao: { icon: DangerTriangleIcon, className: "bg-attention/15 text-attention" },
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
      className={`flex items-center gap-2 rounded-md border-l-4 bg-surface-hover px-3 py-2 transition hover:bg-surface-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${borderByStatus[mr.status]}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {mr.esquecido && (
            <DangerTriangleIcon
              size={13}
              className="flex-none text-attention"
              aria-label="Aberto há vários dias, pode ter sido esquecido"
            />
          )}
          <p className="truncate text-sm text-foreground">{mr.title}</p>
        </div>
        <span className="mt-1 block truncate font-mono text-xs text-foreground-subtle">{mr.branch}</span>
      </div>
      <StatusBadge icon={badge.icon} text={metadataText(mr)} className={badge.className} />
    </a>
  );
}
