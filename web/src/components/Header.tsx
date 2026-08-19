import { HugeiconsIcon } from "@hugeicons/react";
import PencilEdit01Icon from "@hugeicons/core-free-icons/PencilEdit01Icon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { TIMEZONE, getSaoPauloHour } from "../formatting";
import { useSettings } from "../SettingsContext";

function greeting(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formattedDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: TIMEZONE,
  });
}

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({ onRefresh, isRefreshing }: HeaderProps) {
  const now = new Date();
  const { settings, updateSettings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(settings.displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = `${greeting(getSaoPauloHour())}, ${settings.displayName}`;
  }, [settings.displayName]);

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  const startEdit = () => {
    setDraftName(settings.displayName);
    setIsEditing(true);
  };

  const commitEdit = () => {
    const trimmed = draftName.trim();
    if (trimmed) updateSettings({ displayName: trimmed });
    setIsEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="flex items-center text-xl font-semibold text-white sm:text-2xl">
          {greeting(getSaoPauloHour(now))},&nbsp;
          {isEditing ? (
            <input
              ref={inputRef}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commitEdit}
              autoFocus
              className="rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-xl font-semibold text-white outline-none sm:text-2xl"
              style={{ width: `${Math.max(draftName.length, 3) + 1}ch` }}
            />
          ) : (
            <button
              type="button"
              onClick={startEdit}
              title="Editar nome"
              className="group -mx-1.5 flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition hover:bg-white/10"
            >
              {settings.displayName}
              <HugeiconsIcon
                icon={PencilEdit01Icon}
                size={14}
                className="text-white/40 opacity-0 transition group-hover:opacity-100"
              />
            </button>
          )}
        </h1>
        <p className="mt-1 text-sm capitalize text-white/50">{formattedDate(now)}</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex flex-none items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-50"
      >
        <HugeiconsIcon icon={RefreshIcon} size={16} className={isRefreshing ? "animate-spin" : ""} />
        Atualizar
      </button>
    </div>
  );
}
