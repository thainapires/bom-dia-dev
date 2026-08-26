import type {
  DailyEntry,
  DashboardResponse,
  NotesDay,
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

export async function fetchDashboard(options?: { forceRefresh?: boolean }): Promise<DashboardResponse> {
  const url = options?.forceRefresh ? "/api/dashboard?refresh=true" : "/api/dashboard";
  const response = await fetch(url);
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

// `null` significa "sem registro pra essa data" (404) — não é um erro a
// exibir, é o estado natural de dias sem daily gerada ainda.
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

export function fetchNotes(date: string): Promise<NotesDay> {
  return fetch(`/api/notes/${date}`).then((res) => handleJson<NotesDay>(res));
}

export function saveNotes(date: string, content: string): Promise<NotesDay> {
  return fetch(`/api/notes/${date}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  }).then((res) => handleJson<NotesDay>(res));
}

export function addChecklistItem(date: string, text: string): Promise<NotesDay> {
  return fetch(`/api/notes/${date}/checklist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).then((res) => handleJson<NotesDay>(res));
}

export function toggleChecklistItem(
  date: string,
  id: number,
  done: boolean,
): Promise<NotesDay> {
  return fetch(`/api/notes/${date}/checklist/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  }).then((res) => handleJson<NotesDay>(res));
}

export function deleteChecklistItem(date: string, id: number): Promise<NotesDay> {
  return fetch(`/api/notes/${date}/checklist/${id}`, { method: "DELETE" }).then((res) =>
    handleJson<NotesDay>(res),
  );
}
