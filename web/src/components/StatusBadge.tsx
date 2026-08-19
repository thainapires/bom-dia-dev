import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

export function StatusBadge({
  icon,
  text,
  className,
}: {
  icon: IconSvgElement;
  text: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex flex-none items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium ${className}`}
    >
      <HugeiconsIcon icon={icon} size={14} />
      {text}
    </span>
  );
}
