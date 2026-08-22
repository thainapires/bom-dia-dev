import type { IconProps } from "@solar-icons/react";
import type { ComponentType } from "react";

export function StatusBadge({
  icon: Icon,
  text,
  className,
}: {
  icon: ComponentType<IconProps>;
  text: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex flex-none items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium ${className}`}
    >
      <Icon size={14} />
      {text}
    </span>
  );
}
