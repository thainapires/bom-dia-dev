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
}

export function MrListCard({ title, items, emptyText, icon, iconColorClass, iconBgClass }: MrListCardProps) {
  return (
    <CollapsibleListCard
      title={title}
      count={items.length}
      icon={icon}
      iconColorClass={iconColorClass}
      iconBgClass={iconBgClass}
    >
      {items.length === 0 ? (
        <p className="text-sm text-white/40">{emptyText}</p>
      ) : (
        items.map((mr) => <MrListItem key={mr.id} mr={mr} />)
      )}
    </CollapsibleListCard>
  );
}
