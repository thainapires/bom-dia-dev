import { useEffect, useState } from "react";
import { fetchRecentNotes } from "../../api";
import type { Note, NoteSummary } from "../../types";

const RECENT_PAGE_SIZE = 4;

function htmlToPreview(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

export function useRecentNotes(onError: (message: string) => void) {
  const [recentNotes, setRecentNotes] = useState<NoteSummary[]>([]);
  const [recentHasMore, setRecentHasMore] = useState(false);
  const [isLoadingMoreRecent, setIsLoadingMoreRecent] = useState(false);

  useEffect(() => {
    fetchRecentNotes({ limit: RECENT_PAGE_SIZE })
      .then((result) => {
        setRecentNotes(result.notes);
        setRecentHasMore(result.hasMore);
      })
      .catch((err) => onError(err instanceof Error ? err.message : "Erro ao buscar notas recentes"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function upsertNote(note: Note) {
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

  async function loadMore() {
    const lastId = recentNotes[recentNotes.length - 1]?.id;
    if (!lastId) return;
    setIsLoadingMoreRecent(true);
    try {
      const result = await fetchRecentNotes({ limit: RECENT_PAGE_SIZE, beforeId: lastId });
      setRecentNotes((prev) => [...prev, ...result.notes]);
      setRecentHasMore(result.hasMore);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao buscar mais notas");
    } finally {
      setIsLoadingMoreRecent(false);
    }
  }

  return { recentNotes, recentHasMore, isLoadingMoreRecent, upsertNote, loadMore };
}
