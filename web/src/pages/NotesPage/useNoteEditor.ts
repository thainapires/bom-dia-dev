import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { createNote, fetchNote, fetchNotesDay, saveNote } from "../../api";
import type { Note, NoteSummary, NotesDayResponse } from "../../types";

const SAVE_DELAY_MS = 800;

const EMPTY_DAY = (date: string): NotesDayResponse => ({
  date,
  note: null,
  checklist: [],
  stats: { totalTasks: 0, completedTasks: 0, wordCount: 0, progressPercent: 0 },
});

type SaveStatus = "saving" | "saved" | "error";

export function useNoteEditor(
  date: string,
  setDate: Dispatch<SetStateAction<string>>,
  onError: (message: string) => void,
  onNoteSaved: (note: Note) => void,
) {
  const [dayData, setDayData] = useState<NotesDayResponse>(() => EMPTY_DAY(date));
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

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

  useEffect(() => {
    let cancelled = false;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setIsLoading(true);

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
        onError(err instanceof Error ? err.message : "Erro ao buscar notas");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

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
        onNoteSaved(note);
      } catch (err) {
        setSaveStatus("error");
        onError(err instanceof Error ? err.message : "Erro ao salvar nota");
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

  function handleWordCountChange(words: number, chars: number) {
    setWordCount(words);
    setCharCount(chars);
  }

  async function handleNewNote() {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    try {
      const created = await createNote(date);
      setDayData(created);
      applyActiveNote(created.note);
      if (created.note) onNoteSaved(created.note);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao criar nota");
    }
  }

  async function openNote(summary: NoteSummary) {
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
      onError(err instanceof Error ? err.message : "Erro ao abrir nota");
    }
  }

  return {
    dayData,
    setDayData,
    activeNoteId,
    title,
    content,
    wordCount,
    charCount,
    isLoading,
    saveStatus,
    handleTitleChange,
    handleContentChange,
    handleWordCountChange,
    handleNewNote,
    openNote,
  };
}
