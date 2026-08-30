import type { IconProps } from "@solar-icons/react";
import type { ComponentType } from "react";
import type { ReviewItem } from "../types";
import { CollapsibleListCard } from "./CollapsibleListCard";
import { ReviewListItem } from "./ReviewListItem";

interface ReviewListCardProps {
  title: string;
  items: ReviewItem[];
  emptyText: string;
  icon: ComponentType<IconProps>;
  iconColorClass: string;
  iconBgClass: string;
  borderColorClass: string;
  badgeColorClass: string;
  defaultOpen?: boolean;
}

export function ReviewListCard({
  title,
  items,
  emptyText,
  icon,
  iconColorClass,
  iconBgClass,
  borderColorClass,
  badgeColorClass,
  defaultOpen,
}: ReviewListCardProps) {
  return (
    <CollapsibleListCard
      title={title}
      count={items.length}
      icon={icon}
      iconColorClass={iconColorClass}
      iconBgClass={iconBgClass}
      defaultOpen={defaultOpen}
    >
      {items.length === 0 ? (
        <p className="text-sm text-foreground-subtle">{emptyText}</p>
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
    </CollapsibleListCard>
  );
}
