import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="min-w-0 flex-1 px-[var(--spacing-page-x)] py-[var(--spacing-page-x)] pb-20 sm:px-6 sm:py-5 sm:pb-5">
        <Outlet />
      </main>
    </div>
  );
}
