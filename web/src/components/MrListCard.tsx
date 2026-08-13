import type { MrItem } from "../types";
import { MrListItem } from "./MrListItem";

interface MrListCardProps {
  title: string;
  items: MrItem[];
  emptyText: string;
  accentColor: string;
}

export function MrListCard({ title, items, emptyText, accentColor }: MrListCardProps) {
  return (
    <div className="rounded-lg bg-card p-4">
      <h2 className="text-sm font-semibold text-white/80">
        <span className={`mr-2 inline-block h-2 w-2 rounded-full ${accentColor}`} />
        {title}
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
