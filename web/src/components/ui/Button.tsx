import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
}

const variantClass = {
  primary: "bg-primary text-foreground hover:bg-primary/90 disabled:hover:bg-primary",
  secondary: "bg-surface text-foreground-soft hover:bg-surface-selected disabled:hover:bg-surface",
  ghost: "bg-transparent text-foreground-muted hover:bg-surface-selected hover:text-foreground",
};

export function Button({ variant = "secondary", icon, className, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-[var(--control-height)] flex-none items-center justify-center gap-2 rounded-[var(--control-radius)] px-3 text-sm font-medium transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
