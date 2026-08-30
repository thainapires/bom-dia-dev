import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "./cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-[var(--control-height)] rounded-[var(--control-radius)] border border-border-default bg-surface-hover px-3 text-sm text-foreground transition focus:outline-none focus:ring-1 focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-[var(--control-height)] rounded-[var(--control-radius)] border border-border-default bg-surface-hover px-3 text-sm text-foreground transition hover:bg-surface-selected focus:outline-none focus:ring-1 focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
