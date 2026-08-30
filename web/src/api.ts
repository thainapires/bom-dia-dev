import type {
  DailyEntry,
  DashboardResponse,
  Note,
  NoteSummary,
  NotesDayResponse,
  WakatimeRangeKey,
  WakatimeStats,
  WakatimeTimeline,
} from "./types";

async function handleJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro na requisição (${response.status})`);
  }
  return response.json();
}

export async function fetchDashboard(options?: {
  forceRefresh?: boolean;
  performanceDays?: number;
  performanceStart?: string;
  performanceEnd?: string;
}): Promise<DashboardResponse> {
  const query = new URLSearchParams();
  if (options?.forceRefresh) query.set("refresh", "true");
  if (options?.performanceDays) query.set("performanceDays", String(options.performanceDays));
  if (options?.performanceStart && options.performanceEnd) {
    query.set("performanceStart", options.performanceStart);
    query.set("performanceEnd", options.performanceEnd);
  }
  const queryString = query.toString();
  const response = await fetch(queryString ? `/api/dashboard?${queryString}` : "/api/dashboard");
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro ao buscar dados (${response.status})`);
  }
  return response.json();
}

export function fetchWakatimeStats(params: {
  range: WakatimeRangeKey;
  start?: string;
  end?: string;
}): Promise<WakatimeStats> {
  const query = new URLSearchParams({ range: params.range });
  if (params.range === "custom" && params.start && params.end) {
    query.set("start", params.start);
    query.set("end", params.end);
  }
  return fetch(`/api/wakatime?${query}`).then((res) => handleJson<WakatimeStats>(res));
}

export function fetchWakatimeTimeline(date: string): Promise<WakatimeTimeline> {
  return fetch(`/api/wakatime/timeline?date=${date}`).then((res) => handleJson<WakatimeTimeline>(res));
}

export async function fetchDailyEntry(date: string): Promise<DailyEntry | null> {
  const response = await fetch(`/api/daily/${date}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro ao buscar daily (${response.status})`);
  }
  return response.json();
}

export function fetchDailyDates(): Promise<string[]> {
  return fetch("/api/daily").then((res) => handleJson<string[]>(res));
}

export function generateDailyEntry(date: string): Promise<DailyEntry> {
  return fetch(`/api/daily/${date}/generate`, { method: "POST" }).then((res) => handleJson<DailyEntry>(res));
}

export function fetchNotesDay(date: string): Promise<NotesDayResponse> {
  return fetch(`/api/notes/day/${date}`).then((res) => handleJson<NotesDayResponse>(res));
}

export function createNote(date: string): Promise<NotesDayResponse> {
  return fetch(`/api/notes/day/${date}`, { method: "POST" }).then((res) =>
    handleJson<NotesDayResponse>(res),
  );
}

export function fetchNote(id: number): Promise<Note> {
  return fetch(`/api/notes/${id}`).then((res) => handleJson<Note>(res));
}

export function saveNote(
  id: number,
  data: { title: string; content: string },
): Promise<{ note: Note; stats: NotesDayResponse["stats"] }> {
  return fetch(`/api/notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => handleJson<{ note: Note; stats: NotesDayResponse["stats"] }>(res));
}

export function fetchRecentNotes(params: {
  limit?: number;
  beforeId?: number;
}): Promise<{ notes: NoteSummary[]; hasMore: boolean }> {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.beforeId) query.set("beforeId", String(params.beforeId));
  return fetch(`/api/notes/recent?${query}`).then((res) =>
    handleJson<{ notes: NoteSummary[]; hasMore: boolean }>(res),
  );
}

export function addChecklistItem(date: string, text: string): Promise<NotesDayResponse> {
  return fetch(`/api/notes/day/${date}/checklist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).then((res) => handleJson<NotesDayResponse>(res));
}

export function updateChecklistItem(
  date: string,
  id: number,
  data: { done?: boolean; text?: string },
): Promise<NotesDayResponse> {
  return fetch(`/api/notes/day/${date}/checklist/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => handleJson<NotesDayResponse>(res));
}

export function deleteChecklistItem(date: string, id: number): Promise<NotesDayResponse> {
  return fetch(`/api/notes/day/${date}/checklist/${id}`, { method: "DELETE" }).then((res) =>
    handleJson<NotesDayResponse>(res),
  );
}

export function reorderChecklist(date: string, orderedIds: number[]): Promise<NotesDayResponse> {
  return fetch(`/api/notes/day/${date}/checklist/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  }).then((res) => handleJson<NotesDayResponse>(res));
}

export function clearCompletedChecklist(date: string): Promise<NotesDayResponse> {
  return fetch(`/api/notes/day/${date}/checklist/clear-completed`, { method: "POST" }).then((res) =>
    handleJson<NotesDayResponse>(res),
  );
}
