import type { HTMLAttributes } from "react";
import { cn } from "./cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

const paddingClass = {
  sm: "p-3",
  md: "p-[var(--card-padding)]",
  lg: "p-5",
};

export function Card({ padding = "md", className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-[var(--card-radius)] border border-border-subtle bg-surface", paddingClass[padding], className)}
      {...props}
    />
  );
}
