import { formatDiasAberto } from "../formatting";
import type { MrItem } from "../types";

const borderByStatus: Record<MrItem["status"], string> = {
  pronto: "border-l-status-ready",
  aguardando: "border-l-status-waiting",
  atencao: "border-l-status-attention",
};

function metadata(mr: MrItem): string {
  if (mr.status === "atencao") return mr.motivoAtencao ?? "Precisa de atenção";
  if (mr.status === "pronto") {
    return mr.approvals === 1 ? "1 aprovação" : `${mr.approvals} aprovações`;
  }
  return formatDiasAberto(mr.diasAberto);
}

export function MrListItem({ mr }: { mr: MrItem }) {
  return (
    <a
      href={mr.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-md border-l-4 bg-white/5 px-3 py-2 transition hover:bg-white/10 ${borderByStatus[mr.status]}`}
    >
      <p className="truncate text-sm text-white/90">{mr.title}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs text-white/40">{mr.branch}</span>
        <span className="flex-none text-xs text-white/50">{metadata(mr)}</span>
      </div>
    </a>
  );
}
