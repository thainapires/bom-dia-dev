import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "./cn";
import { IoChevronDown } from "react-icons/io5";

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
    <div className="relative">
      <select
        className={cn(
          "h-[var(--control-height)] appearance-none rounded-[var(--control-radius)] border border-border-default bg-surface-hover px-3 text-sm text-foreground transition hover:bg-surface-selected focus:outline-none focus:ring-1 focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
        <IoChevronDown size={16} />
      </div>
    </div>
  );
}
