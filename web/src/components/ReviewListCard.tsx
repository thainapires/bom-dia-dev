import { Eye } from "lucide-react";
import type { ReviewItem } from "../types";
import { ReviewListItem } from "./ReviewListItem";

export function ReviewListCard({ items }: { items: ReviewItem[] }) {
  return (
    <div className="rounded-lg bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white/80">
        <Eye size={16} className="text-status-waiting" />
        Precisa revisar
      </h2>
      <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-white/40">Nenhum MR esperando sua revisão.</p>
        ) : (
          items.map((mr) => <ReviewListItem key={mr.id} mr={mr} />)
        )}
      </div>
    </div>
  );
}
