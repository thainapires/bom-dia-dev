import { HugeiconsIcon } from "@hugeicons/react";
import Activity01Icon from "@hugeicons/core-free-icons/Activity01Icon";
import DashboardSquare01Icon from "@hugeicons/core-free-icons/DashboardSquare01Icon";
import GitMergeIcon from "@hugeicons/core-free-icons/GitMergeIcon";
import GitPullRequestIcon from "@hugeicons/core-free-icons/GitPullRequestIcon";
import HistoryIcon from "@hugeicons/core-free-icons/HistoryIcon";
import Note01Icon from "@hugeicons/core-free-icons/Note01Icon";
import Setting07Icon from "@hugeicons/core-free-icons/Setting07Icon";
import { NavLink } from "react-router-dom";
import { useSettings } from "../SettingsContext";

const ICON_SIZE = 22;

const navItems = [
  { to: "/", label: "Dashboard", icon: DashboardSquare01Icon, end: true },
  { to: "/notas", label: "Notas", icon: Note01Icon, end: false },
  { to: "/wakatime", label: "Wakatime", icon: Activity01Icon, end: false },
  { to: "/configuracoes", label: "Configurações", icon: Setting07Icon, end: false },
];

const inertIcons = [
  { Icon: GitMergeIcon, label: "Merge" },
  { Icon: GitPullRequestIcon, label: "Pull request" },
  { Icon: HistoryIcon, label: "Histórico" },
];

export function Sidebar() {
  const { settings } = useSettings();
  const initial = settings.displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <aside className="fixed inset-x-0 bottom-0 z-20 flex h-16 w-full flex-none items-center justify-around border-t border-white/5 bg-card px-2 sm:sticky sm:inset-x-auto sm:bottom-auto sm:top-0 sm:h-screen sm:w-20 sm:flex-col sm:justify-start sm:gap-2 sm:self-start sm:border-t-0 sm:border-r sm:px-0 sm:py-4">
      <NavLink
        to="/configuracoes"
        title="Configurações"
        className="flex h-11 w-11 flex-none items-center justify-center"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white transition hover:bg-white/20">
          {initial}
        </span>
      </NavLink>

      {navItems.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          title={label}
          className={({ isActive }) =>
            `flex h-11 w-11 flex-none items-center justify-center rounded-lg transition ${
              isActive ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/70"
            }`
          }
        >
          <HugeiconsIcon icon={icon} size={ICON_SIZE} strokeWidth={1.75} />
        </NavLink>
      ))}

      {inertIcons.map(({ Icon, label }) => (
        <button
          key={label}
          type="button"
          title={`${label} (em breve)`}
          disabled
          className="hidden h-11 w-11 flex-none cursor-not-allowed items-center justify-center rounded-lg text-white/40 sm:flex"
        >
          <HugeiconsIcon icon={Icon} size={ICON_SIZE} strokeWidth={1.75} />
        </button>
      ))}
    </aside>
  );
}
