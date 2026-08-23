import type { IconProps } from "@solar-icons/react";
import { AltArrowDownIcon } from "@solar-icons/react/linear/alt-arrow-down";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";

interface CollapsibleListCardProps {
  title: string;
  count: number;
  icon: ComponentType<IconProps>;
  iconColorClass: string;
  iconBgClass: string;
  children: ReactNode;
}

export function CollapsibleListCard({
  title,
  count,
  icon: Icon,
  iconColorClass,
  iconBgClass,
  children,
}: CollapsibleListCardProps) {
  const [isOpen, setIsOpen] = useState(count > 0);

  return (
    <div className="rounded-lg bg-card p-4 border-white/5 border">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg ${iconBgClass}`}>
            <Icon size={15} strokeWidth={2} className={iconColorClass} />
          </span>
          {title}
          <div className={`flex items-center justify-center h-5 w-5 rounded-full ${iconBgClass}`}>
            <span className="text-white/30 text-xs">{count}</span>
          </div>
        </h2>
        <AltArrowDownIcon
          size={16}
          className={`flex-none text-white/40 transition-transform ${isOpen ? "" : "rotate-180"}`}
        />
      </button>
      {isOpen && <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">{children}</div>}
    </div>
  );
}
