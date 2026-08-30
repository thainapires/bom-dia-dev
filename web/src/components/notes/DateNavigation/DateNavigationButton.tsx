import type { ReactNode } from "react";
import { IconButton } from "../../ui";

export function DateNavigationButton({
  icon,
  onClick,
  disabled,
  title,
}: {
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
}) {
  return (
    <IconButton onClick={onClick} disabled={disabled} title={title} aria-label={title} className="h-8 w-8 rounded-md bg-transparent">
      {icon}
    </IconButton>
  );
}
