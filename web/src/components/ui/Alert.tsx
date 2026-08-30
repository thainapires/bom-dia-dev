import type { ReactNode } from "react";
import { cn } from "./cn";

interface AlertProps {
  children: ReactNode;
  className?: string;
}

export function Alert({ children, className }: AlertProps) {
  return (
    <div className={cn("rounded-[var(--card-radius)] border-l-4 border-l-attention bg-surface px-4 py-3 text-sm text-foreground-soft", className)}>
      {children}
    </div>
  );
}
