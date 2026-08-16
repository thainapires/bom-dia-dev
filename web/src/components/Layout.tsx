import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-5">
        <Outlet />
      </main>
    </div>
  );
}
