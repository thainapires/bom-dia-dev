import { HugeiconsIcon } from "@hugeicons/react";
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon";
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon";
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  addChecklistItem,
  deleteChecklistItem,
  fetchNotes,
  saveNotes,
  toggleChecklistItem,
} from "../api";
import { addDays, formatNotesDate, toISODate } from "../formatting";
import type { NotesDay } from "../types";

const SAVE_DELAY_MS = 800;

type SaveStatus = "saving" | "saved";

export function NotesPage() {
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [notes, setNotes] = useState<NotesDay | null>(null);
  const [content, setContent] = useState("");
  const [newItemText, setNewItemText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setIsLoading(true);
    setError(null);

    fetchNotes(date)
      .then((day) => {
        if (cancelled) return;
        setNotes(day);
        setContent(day.content);
        setSaveStatus("saved");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erro ao buscar notas");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  const handleContentChange = (value: string) => {
    setContent(value);
    setSaveStatus("saving");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveNotes(date, value)
        .then(() => setSaveStatus("saved"))
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Erro ao salvar notas");
        });
    }, SAVE_DELAY_MS);
  };

  const handleAddItem = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const text = newItemText.trim();
      if (!text) return;
      try {
        const updated = await addChecklistItem(date, text);
        setNotes(updated);
        setNewItemText("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao adicionar item");
      }
    },
    [date, newItemText],
  );

  const handleToggleItem = async (id: number, done: boolean) => {
    setNotes((prev) =>
      prev
        ? { ...prev, checklist: prev.checklist.map((item) => (item.id === id ? { ...item, done } : item)) }
        : prev,
    );
    try {
      const updated = await toggleChecklistItem(date, id, done);
      setNotes(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar item");
    }
  };

  const handleDeleteItem = async (id: number) => {
    setNotes((prev) =>
      prev ? { ...prev, checklist: prev.checklist.filter((item) => item.id !== id) } : prev,
    );
    try {
      const updated = await deleteChecklistItem(date, id);
      setNotes(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover item");
    }
  };

  const isToday = date === toISODate(new Date());

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Notas</h1>
          <p className="mt-1 text-sm capitalize text-white/50">{formatNotesDate(date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDate((current) => addDays(current, -1))}
            title="Dia anterior"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-card text-white/80 transition hover:bg-white/10"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(toISODate(new Date()))}
              className="rounded-lg bg-card px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              Hoje
            </button>
          )}
          <button
            type="button"
            onClick={() => setDate((current) => addDays(current, 1))}
            title="Próximo dia"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-card text-white/80 transition hover:bg-white/10"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border-l-4 border-l-status-attention bg-card px-4 py-3 text-sm text-white/80">
          {error}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">Bloco de notas</h2>
            <div className="flex items-center">
              {saveStatus === "saving" ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin text-white/40" />
                  <span className="ml-2 text-xs font-semibold text-white/40">Salvando...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-status-ready" />
                  <span className="ml-2 text-xs font-semibold text-status-ready/90">Salvo</span>
                </>
              )}
            </div>
          </div>
          <textarea
            value={content}
            onChange={(event) => handleContentChange(event.target.value)}
            disabled={isLoading}
            placeholder="Escreva algo..."
            className="mt-3 h-72 w-full resize-none rounded-md border border-white/5 bg-white/5 p-3 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>

        <div className="rounded-lg border border-white/5 bg-card p-4">
          <h2 className="text-sm font-semibold text-white/80">
            Checklist
            <span className="ml-2 text-white/30">{notes?.checklist.length ?? 0}</span>
          </h2>

          <form onSubmit={handleAddItem} className="mt-3 flex gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(event) => setNewItemText(event.target.value)}
              placeholder="Adicionar item..."
              className="min-w-0 flex-1 rounded-md border border-white/5 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <button
              type="submit"
              title="Adicionar"
              className="flex flex-none items-center justify-center rounded-md bg-white/10 px-3 py-2 text-white/80 transition hover:bg-white/20"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
            </button>
          </form>

          <div className="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
            {!notes || notes.checklist.length === 0 ? (
              <p className="text-sm text-white/40">Nenhum item no checklist.</p>
            ) : (
              notes.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2">
                  <label className="relative flex h-4 w-4 flex-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(event) => handleToggleItem(item.id, event.target.checked)}
                      className="peer h-4 w-4 appearance-none rounded-sm bg-white checked:bg-status-ready"
                    />

                    <svg
                      className="pointer-events-none absolute inset-0 hidden h-4 w-4 p-0.5 text-white peer-checked:block"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3 3 7-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </label>
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      item.done ? "text-white/40 line-through" : "text-white/90"
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Remover"
                    className="flex-none text-white/30 transition hover:text-status-attention"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
