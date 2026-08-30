import type { IconProps } from "@solar-icons/react";
import type { ComponentType } from "react";
import type { MrItem } from "../types";
import { CollapsibleListCard } from "./CollapsibleListCard";
import { MrListItem } from "./MrListItem";

interface MrListCardProps {
  title: string;
  items: MrItem[];
  emptyText: string;
  icon: ComponentType<IconProps>;
  iconColorClass: string;
  iconBgClass: string;
  defaultOpen?: boolean;
}

export function MrListCard({ title, items, emptyText, icon, iconColorClass, iconBgClass, defaultOpen }: MrListCardProps) {
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
        items.map((mr) => <MrListItem key={mr.id} mr={mr} />)
      )}
    </CollapsibleListCard>
  );
}
