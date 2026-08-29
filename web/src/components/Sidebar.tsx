import { ArrowLeftIcon } from "@solar-icons/react/linear/arrow-left";
import { ArrowRightIcon } from "@solar-icons/react/linear/arrow-right";
import { NotesIcon } from "@solar-icons/react/bold-duotone/notes";
import { PulseIcon } from "@solar-icons/react/bold-duotone/pulse";
import { SettingsIcon } from '@solar-icons/react/bold/settings'
import { HomeAngleIcon } from '@solar-icons/react/bold/home-angle'
import { ChatRoundLineIcon } from '@solar-icons/react/bold/chat-round-line'
import { RoundAltArrowRightIcon } from '@solar-icons/react/bold/round-alt-arrow-right'
import { RoundAltArrowLeftIcon } from '@solar-icons/react/bold/round-alt-arrow-left'

import { NavLink } from "react-router-dom";
import { useSettings } from "../SettingsContext";
import { useState } from "react";

const ICON_SIZE = 28;

const navItems = [
  { to: "/", label: "Dashboard", icon: HomeAngleIcon, end: true },
  { to: "/daily", label: "Daily", icon: ChatRoundLineIcon, end: false },
  { to: "/notas", label: "Notas", icon: NotesIcon, end: false },
  { to: "/wakatime", label: "Wakatime", icon: PulseIcon, end: false },
  { to: "/configuracoes", label: "Configurações", icon: SettingsIcon, end: false },
];

export function Sidebar() {
  const { settings } = useSettings();
  const initial = settings.displayName.trim().charAt(0).toUpperCase() || "?";
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className={`fixed inset-x-0 bottom-0 z-20 flex h-16 w-full flex-none items-center justify-around border-t border-white/5 bg-sidebar px-2 sm:sticky sm:inset-x-auto sm:bottom-auto sm:top-0 sm:h-screen sm:flex-col sm:justify-start sm:gap-3 sm:self-start sm:border-t-0 sm:border-r sm:px-2 sm:py-4 sm:transition-[width] sm:duration-200 sm:ease-(--ease-out) ${
        expanded ? "sm:w-56 sm:items-stretch" : "sm:w-16 sm:items-center"
      }`}
    >
      <NavLink
        to="/"
        title="Home"
        className={`flex h-11 flex-none items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${expanded ? "w-full px-1" : "w-11 justify-center"}`}
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white transition hover:bg-white/20">
          {initial}
        </span>
        {expanded && (
          <span className="truncate text-sm font-medium text-white/80 opacity-100 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
            {settings.displayName || "Home"}
          </span>
        )}
      </NavLink>

      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          title={label}
          className={({ isActive }) =>
            `flex h-11 flex-none items-center gap-3 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
              expanded ? "w-full px-3" : "w-11 justify-center"
            } ${isActive ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/70"}`
          }
        >
          <Icon size={ICON_SIZE} className="flex-none" />
          {expanded && (
            <span className="truncate text-sm opacity-100 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
              {label}
            </span>
          )}
        </NavLink>
      ))}

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        title={expanded ? "Recolher menu" : "Expandir menu"}
        className={`hidden h-11 flex-none items-center gap-3 rounded-lg text-white/40 transition hover:bg-white/5 hover:text-white/70 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:mt-auto sm:flex ${
          expanded ? "w-full px-3" : "w-11 justify-center"
        }`}
      >
        {expanded ? (
          <RoundAltArrowLeftIcon size={ICON_SIZE} className="flex-none" />
        ) : (
          <RoundAltArrowRightIcon size={ICON_SIZE} className="flex-none" />
        )}
        {expanded && (
          <span className="truncate text-sm opacity-100 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
            Recolher
          </span>
        )}
      </button>
    </aside>
  );
}
