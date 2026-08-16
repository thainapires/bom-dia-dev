import type { LucideIcon } from "lucide-react";
import type { MrItem } from "../types";
import { MrListItem } from "./MrListItem";

interface MrListCardProps {
  title: string;
  items: MrItem[];
  emptyText: string;
  icon: LucideIcon;
  iconColorClass: string;
}

export function MrListCard({ title, items, emptyText, icon: Icon, iconColorClass}: MrListCardProps) {
  return (
    <div className="rounded-lg bg-card p-4 border-gray-800 border">
      <h2 className={`flex items-center gap-2 text-sm font-semibold text-white/80`}>
        <Icon size={16} className={iconColorClass} />
        {title}
        <span className="text-white/30">{items.length}</span>
      </h2>
      <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-white/40">{emptyText}</p>
        ) : (
          items.map((mr) => <MrListItem key={mr.id} mr={mr} />)
        )}
      </div>
    </div>
  );
}
