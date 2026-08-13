import type { DashboardResponse } from "./types";

export async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro ao buscar dados (${response.status})`);
  }
  return response.json();
}
