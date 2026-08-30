import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function IconButton({ className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-[var(--control-height)] w-[var(--control-height)] flex-none items-center justify-center rounded-[var(--control-radius)] bg-surface text-foreground-soft transition hover:bg-surface-selected active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-surface disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
