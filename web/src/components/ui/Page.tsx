import type { ReactNode } from "react";
import { cn } from "./cn";

interface PageProps {
  children: ReactNode;
  className?: string;
}

export function Page({ children, className }: PageProps) {
  return <div className={cn("mx-auto w-full max-w-[var(--page-max-width)]", className)}>{children}</div>;
}

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ icon, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          {icon && <span className="flex h-8 w-8 flex-none items-center justify-center text-primary">{icon}</span>}
          <h1 className="truncate text-2xl font-semibold text-foreground">{title}</h1>
        </div>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>}
    </header>
  );
}

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  return <div className={cn("mt-[var(--section-gap)]", className)}>{children}</div>;
}
