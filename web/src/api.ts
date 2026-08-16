import type { DashboardResponse, NotesDay } from "./types";

async function handleJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro na requisição (${response.status})`);
  }
  return response.json();
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro ao buscar dados (${response.status})`);
  }
  return response.json();
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
