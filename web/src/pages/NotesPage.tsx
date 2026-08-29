import { AddCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { DangerCircleIcon } from "@solar-icons/react/bold-duotone/danger-circle";
import { NotesIcon } from "@solar-icons/react/bold-duotone/notes";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { ArrowLeftIcon } from "@solar-icons/react/linear/arrow-left";
import { ArrowRightIcon } from "@solar-icons/react/linear/arrow-right";
import { CalendarDateLinearIcon } from "@solar-icons/react";
import { useEffect, useRef, useState } from "react";
import {
  addChecklistItem,
  clearCompletedChecklist,
  createNote,
  deleteChecklistItem,
  fetchNote,
  fetchNotesDay,
  fetchRecentNotes,
  reorderChecklist,
  saveNote,
  updateChecklistItem,
} from "../api";
import { ChecklistCard } from "../components/notes/ChecklistCard";
import { NotesSummaryCard } from "../components/notes/NotesSummaryCard";
import { RecentNotesCard } from "../components/notes/RecentNotesCard";
import { RichTextEditor } from "../components/notes/RichTextEditor";
import { addDays, formatHourMinute, formatNotesDate, toISODate } from "../formatting";
import type { Note, NoteSummary, NotesDayResponse } from "../types";

const SAVE_DELAY_MS = 800;
const RECENT_PAGE_SIZE = 5;

const EMPTY_DAY = (date: string): NotesDayResponse => ({
  date,
  note: null,
  checklist: [],
  stats: { totalTasks: 0, completedTasks: 0, wordCount: 0, progressPercent: 0 },
});

type SaveStatus = "saving" | "saved" | "error";

function htmlToPreview(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

export function NotesPage() {
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [dayData, setDayData] = useState<NotesDayResponse>(() => EMPTY_DAY(date));
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const [recentNotes, setRecentNotes] = useState<NoteSummary[]>([]);
  const [recentHasMore, setRecentHasMore] = useState(false);
  const [isLoadingMoreRecent, setIsLoadingMoreRecent] = useState(false);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeNoteIdRef = useRef<number | null>(null);
  const titleRef = useRef("");
  const contentRef = useRef("");
  const pendingOpenNoteId = useRef<number | null>(null);

  function applyActiveNote(note: Note | null) {
    activeNoteIdRef.current = note?.id ?? null;
    setActiveNoteId(note?.id ?? null);
    titleRef.current = note?.title ?? "";
    setTitle(note?.title ?? "");
    contentRef.current = note?.content ?? "";
    setContent(note?.content ?? "");
    setSaveStatus("saved");
  }

  function upsertRecentNote(note: Note) {
    const summary: NoteSummary = {
      id: note.id,
      date: note.date,
      title: note.title,
      preview: htmlToPreview(note.content),
      createdAt: note.createdAt,
    };
    setRecentNotes((prev) => {
      const exists = prev.some((item) => item.id === note.id);
      if (exists) return prev.map((item) => (item.id === note.id ? summary : item));
      return [summary, ...prev];
    });
  }

  useEffect(() => {
    let cancelled = false;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setIsLoading(true);
    setError(null);

    fetchNotesDay(date)
      .then(async (day) => {
        if (cancelled) return;
        const forceId = pendingOpenNoteId.current;
        pendingOpenNoteId.current = null;

        if (forceId !== null && day.note?.id !== forceId) {
          const specific = await fetchNote(forceId);
          if (cancelled) return;
          setDayData({ ...day, note: specific });
          applyActiveNote(specific);
        } else {
          setDayData(day);
          applyActiveNote(day.note);
        }
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

  useEffect(() => {
    fetchRecentNotes({ limit: RECENT_PAGE_SIZE })
      .then((result) => {
        setRecentNotes(result.notes);
        setRecentHasMore(result.hasMore);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao buscar notas recentes"));
  }, []);

  function scheduleSave() {
    setSaveStatus("saving");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        let id = activeNoteIdRef.current;
        if (id === null) {
          const created = await createNote(date);
          id = created.note!.id;
          activeNoteIdRef.current = id;
          setActiveNoteId(id);
          setDayData(created);
        }
        const { note, stats } = await saveNote(id, { title: titleRef.current, content: contentRef.current });
        setDayData((prev) => ({ ...prev, note, stats }));
        setSaveStatus("saved");
        upsertRecentNote(note);
      } catch (err) {
        setSaveStatus("error");
        setError(err instanceof Error ? err.message : "Erro ao salvar nota");
      }
    }, SAVE_DELAY_MS);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    titleRef.current = value;
    scheduleSave();
  }

  function handleContentChange(html: string) {
    contentRef.current = html;
    scheduleSave();
  }

  async function handleNewNote() {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    try {
      const created = await createNote(date);
      setDayData(created);
      applyActiveNote(created.note);
      if (created.note) upsertRecentNote(created.note);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar nota");
    }
  }

  async function handleSelectRecentNote(summary: NoteSummary) {
    if (summary.date !== date) {
      pendingOpenNoteId.current = summary.id;
      setDate(summary.date);
      return;
    }
    if (summary.id === activeNoteId) return;
    try {
      const note = await fetchNote(summary.id);
      setDayData((prev) => ({ ...prev, note }));
      applyActiveNote(note);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir nota");
    }
  }

  async function handleLoadMoreRecent() {
    const lastId = recentNotes[recentNotes.length - 1]?.id;
    if (!lastId) return;
    setIsLoadingMoreRecent(true);
    try {
      const result = await fetchRecentNotes({ limit: RECENT_PAGE_SIZE, beforeId: lastId });
      setRecentNotes((prev) => [...prev, ...result.notes]);
      setRecentHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar mais notas");
    } finally {
      setIsLoadingMoreRecent(false);
    }
  }

  async function handleAddChecklistItem(text: string) {
    try {
      setDayData(await addChecklistItem(date, text));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar item");
    }
  }

  async function handleToggleChecklistItem(id: number, done: boolean) {
    setDayData((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) => (item.id === id ? { ...item, done } : item)),
    }));
    try {
      setDayData(await updateChecklistItem(date, id, { done }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar item");
    }
  }

  async function handleEditChecklistItem(id: number, text: string) {
    try {
      setDayData(await updateChecklistItem(date, id, { text }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar item");
    }
  }

  async function handleDeleteChecklistItem(id: number) {
    setDayData((prev) => ({ ...prev, checklist: prev.checklist.filter((item) => item.id !== id) }));
    try {
      setDayData(await deleteChecklistItem(date, id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover item");
    }
  }

  async function handleReorderChecklist(orderedIds: number[]) {
    setDayData((prev) => {
      const byId = new Map(prev.checklist.map((item) => [item.id, item]));
      return {
        ...prev,
        checklist: orderedIds.map((id, position) => ({ ...byId.get(id)!, position })),
      };
    });
    try {
      setDayData(await reorderChecklist(date, orderedIds));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reordenar checklist");
    }
  }

  async function handleClearCompleted() {
    setDayData((prev) => ({ ...prev, checklist: prev.checklist.filter((item) => !item.done) }));
    try {
      setDayData(await clearCompletedChecklist(date));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao limpar itens concluídos");
    }
  }

  const isToday = date === toISODate(new Date());

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <NotesIcon size={28} className="text-primary" />
            <h1 className="text-2xl font-semibold text-white">Notas</h1>
          </div>
          <p className="mt-1 text-sm capitalize text-white/50">{formatNotesDate(date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDate((current) => addDays(current, -1))}
            title="Dia anterior"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-card text-white/80 transition hover:bg-white/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <ArrowLeftIcon size={16} />
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(toISODate(new Date()))}
              className="rounded-lg bg-card px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Hoje
            </button>
          )}
          <button
            type="button"
            onClick={() => setDate((current) => addDays(current, 1))}
            title="Próximo dia"
            disabled={isToday}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-card text-white/80 transition hover:bg-white/10 active:scale-[0.97] disabled:opacity-30 disabled:hover:bg-card disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <ArrowRightIcon size={16} />
          </button>
          {isToday && (
            <button
              type="button"
              onClick={handleNewNote}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <AddCircleIcon size={16} />
              Nova nota
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border-l-4 border-l-status-attention bg-card px-4 py-3 text-sm text-white/80">
          {error}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <input
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="Minha nota"
              disabled={isLoading}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white/90 placeholder:text-white/40 focus:outline-none"
            />
            <div className="flex flex-none items-center">
              {saveStatus === "saving" && (
                <span className="flex items-center opacity-100 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
                  <RefreshIcon size={16} className="animate-spin text-white/40" />
                  <span className="ml-2 text-xs font-semibold text-white/40">Salvando...</span>
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center opacity-100 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
                  <CheckCircleIcon size={16} className="text-status-ready" />
                  <span className="ml-2 text-xs font-semibold text-status-ready/90">Salvo agora</span>
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center opacity-100 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
                  <DangerCircleIcon size={16} className="text-status-attention" />
                  <span className="ml-2 text-xs font-semibold text-status-attention">Erro ao salvar</span>
                </span>
              )}
            </div>
          </div>

          <div className="mt-3">
            <RichTextEditor
              key={activeNoteId ?? `empty-${date}`}
              initialContent={content}
              disabled={isLoading}
              onChange={handleContentChange}
              onWordCountChange={(words, chars) => {
                setWordCount(words);
                setCharCount(chars);
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/40">
            <span>
              {wordCount} {wordCount === 1 ? "palavra" : "palavras"} · {charCount}{" "}
              {charCount === 1 ? "caractere" : "caracteres"}
            </span>
            {dayData.note && <span>Editado às {formatHourMinute(dayData.note.updatedAt)}</span>}
          </div>
        </div>

        <ChecklistCard
          checklist={dayData.checklist}
          onAdd={handleAddChecklistItem}
          onToggle={handleToggleChecklistItem}
          onEdit={handleEditChecklistItem}
          onDelete={handleDeleteChecklistItem}
          onReorder={handleReorderChecklist}
          onClearCompleted={handleClearCompleted}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentNotesCard
          notes={recentNotes}
          hasMore={recentHasMore}
          isLoadingMore={isLoadingMoreRecent}
          activeNoteId={activeNoteId}
          onSelect={handleSelectRecentNote}
          onLoadMore={handleLoadMoreRecent}
        />
        <NotesSummaryCard stats={dayData.stats} />
      </div>
    </div>
  );
}
