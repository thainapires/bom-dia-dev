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
  defaultOpen?: boolean;
}

export function CollapsibleListCard({
  title,
  count,
  icon: Icon,
  iconColorClass,
  iconBgClass,
  children,
  defaultOpen,
}: CollapsibleListCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? count > 0);

  return (
    <div className="rounded-lg bg-surface p-4 border-border-subtle border">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground-soft">
          <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg ${iconBgClass}`}>
            <Icon size={15} strokeWidth={2} className={iconColorClass} />
          </span>
          {title}
          <div className={`flex items-center justify-center h-5 w-5 rounded-full ${iconBgClass}`}>
            <span className="text-foreground-disabled text-xs">{count}</span>
          </div>
        </h2>
        <AltArrowDownIcon
          size={16}
          className={`flex-none text-foreground-subtle transition-transform duration-200 ease-(--ease-out) ${isOpen ? "" : "rotate-180"}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-(--ease-out) ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
