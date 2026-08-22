import type { IconProps } from "@solar-icons/react";
import type { ComponentType } from "react";
import type { ReviewItem } from "../types";
import { ReviewListItem } from "./ReviewListItem";

interface ReviewListCardProps {
  title: string;
  items: ReviewItem[];
  emptyText: string;
  icon: ComponentType<IconProps>;
  iconColorClass: string;
  borderColorClass: string;
  badgeColorClass: string;
}

export function ReviewListCard({
  title,
  items,
  emptyText,
  icon: Icon,
  iconColorClass,
  borderColorClass,
  badgeColorClass,
}: ReviewListCardProps) {
  return (
    <div className="rounded-lg bg-card p-4 border-white/5 border">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white/80">
        <Icon size={16} className={iconColorClass} />
        {title}
        <span className="text-white/30">{items.length}</span>
      </h2>
      <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-white/40">{emptyText}</p>
        ) : (
          items.map((mr) => (
            <ReviewListItem
              key={mr.id}
              mr={mr}
              borderColorClass={borderColorClass}
              badgeColorClass={badgeColorClass}
            />
          ))
        )}
      </div>
    </div>
  );
}
