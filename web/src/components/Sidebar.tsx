import { GitMerge, GitPullRequest, History, LayoutDashboard, NotebookPen, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/notas", label: "Notas", icon: NotebookPen, end: false },
];

const inertIcons = [
  { Icon: GitMerge, label: "Merge" },
  { Icon: GitPullRequest, label: "Pull request" },
  { Icon: History, label: "Histórico" },
  { Icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-14 flex-none flex-col items-center gap-2 self-start border-r border-white/5 bg-card py-4">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          title={label}
          className={({ isActive }) =>
            `flex h-10 w-10 items-center justify-center rounded-lg transition ${
              isActive ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/70"
            }`
          }
        >
          <Icon size={20} strokeWidth={1.75} />
        </NavLink>
      ))}
      {inertIcons.map(({ Icon, label }) => (
        <button
          key={label}
          type="button"
          title={`${label} (em breve)`}
          disabled
          className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg text-white/40"
        >
          <Icon size={20} strokeWidth={1.75} />
        </button>
      ))}
    </aside>
  );
}
