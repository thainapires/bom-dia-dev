import { db } from "./db";
import type { ActivityItem, ActivityKind, IssueNarrativeItem, MrItem, ReviewItem } from "./types";

export class StandupError extends Error {}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
// É só 1 chamada por dia (o dia já fica cacheado em `daily_entries`), então um
// modelo gratuito do OpenRouter é suficiente — ver lista atualizada em
// https://openrouter.ai/models?max_price=0. Configurável via env var caso
// esse modelo saia da lista de gratuitos ou fique indisponível.
const MODEL = process.env.OPENROUTER_MODEL || "minimax/minimax-m3:free";

export interface StandupPendentes {
  pronto: Array<Pick<MrItem, "title">>;
  atencao: Array<Pick<MrItem, "title" | "motivoAtencao">>;
  precisaRevisar: Array<Pick<ReviewItem, "title" | "author">>;
}

export interface StandupInput {
  ontemActivities: ActivityItem[];
  porIssue: IssueNarrativeItem[];
  pendentes: StandupPendentes;
}

export interface StandupResult {
  ontem: string;
  hoje: string;
  geradoViaLLM: boolean;
}

interface DailyEntryRow {
  date: string;
  ontem: string;
  hoje: string;
  gerado_via_llm: number;
  model: string | null;
  created_at: string;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function joinPtBr(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
}

const KIND_LABELS_PT: Record<ActivityKind, string> = {
  commit: "commit",
  merge: "merge de MR",
  review: "revisão de MR",
  abertura: "abertura de MR",
  issue: "atividade em issue",
  comentario: "comentário em MR",
  aprovacaoRecebida: "aprovação recebida",
};

// Texto legível pro prompt — preferido a um dump de JSON cru, que costuma
// gerar respostas mais robóticas/menos naturais do modelo.
export function buildPromptInput(input: StandupInput): string {
  const lines: string[] = [];

  lines.push("Atividade de ontem (ordem cronológica):");
  if (input.ontemActivities.length === 0 && input.porIssue.length === 0) {
    lines.push("- Nenhuma atividade registrada no GitLab.");
  } else {
    for (const activity of input.ontemActivities) {
      lines.push(`- [${KIND_LABELS_PT[activity.kind]}] ${activity.text}`);
    }
    for (const item of input.porIssue) {
      lines.push(`- [issue] ${item.linha}`);
    }
  }

  lines.push("");
  lines.push("Pendências pra hoje:");
  const { pronto, atencao, precisaRevisar } = input.pendentes;
  if (pronto.length === 0 && atencao.length === 0 && precisaRevisar.length === 0) {
    lines.push("- Nada pendente no momento.");
  } else {
    for (const mr of pronto) {
      lines.push(`- Pronto pra merge: "${mr.title}"`);
    }
    for (const mr of atencao) {
      lines.push(`- Precisa de atenção (${mr.motivoAtencao ?? "motivo não especificado"}): "${mr.title}"`);
    }
    for (const mr of precisaRevisar) {
      lines.push(`- Aguardando sua revisão: "${mr.title}" (autor: ${mr.author})`);
    }
  }

  return lines.join("\n");
}

const SYSTEM_PROMPT = `Você ajuda a Thainá a preparar o que ela vai falar na daily standup do time dela.
Escreva em português informal do Brasil, em primeira pessoa, como se ela estivesse falando em voz alta pro time.
Use só os fatos fornecidos pelo usuário — nunca invente detalhes, nomes ou tarefas que não estejam na lista.
Se não houver atividade suficiente pra um dos dois campos, diga isso de forma breve e natural, sem forçar conteúdo.
Seja conciso: no máximo 2-3 frases por campo.

Responda APENAS com um objeto JSON válido, sem texto antes ou depois e sem blocos de código markdown, no formato exato:
{"ontem": "...", "hoje": "..."}`;

// Extrai o primeiro `{...}` da resposta — modelos gratuitos às vezes
// embrulham o JSON em texto ou em ```json apesar da instrução no prompt.
function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new StandupError("Resposta da LLM não contém um objeto JSON");
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new StandupError("Resposta da LLM veio com JSON inválido");
  }
}

async function generateViaLLM(input: StandupInput): Promise<{ ontem: string; hoje: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new StandupError("OPENROUTER_API_KEY não configurada");
  }

  let response: Response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "bom-dia-dev",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildPromptInput(input) },
        ],
      }),
    });
  } catch (error) {
    throw new StandupError(error instanceof Error ? error.message : "Erro de rede na chamada ao OpenRouter");
  }

  if (!response.ok) {
    const body = await response.text();
    throw new StandupError(`Falha na chamada ao OpenRouter (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new StandupError("Resposta do OpenRouter sem conteúdo");
  }

  const parsed = extractJsonObject(content) as { ontem?: unknown; hoje?: unknown };
  if (typeof parsed.ontem !== "string" || typeof parsed.hoje !== "string") {
    throw new StandupError("Resposta da LLM veio em formato inesperado");
  }

  return { ontem: parsed.ontem, hoje: parsed.hoje };
}

export function generateViaHeuristica(input: StandupInput): { ontem: string; hoje: string } {
  const counts: Record<ActivityKind, number> = {
    commit: 0,
    merge: 0,
    review: 0,
    abertura: 0,
    issue: input.porIssue.length,
    comentario: 0,
    aprovacaoRecebida: 0,
  };
  for (const item of input.ontemActivities) counts[item.kind]++;

  const ontemParts: string[] = [];
  if (counts.commit > 0) ontemParts.push(`fiz ${counts.commit} ${pluralize(counts.commit, "commit", "commits")}`);
  if (counts.abertura > 0) ontemParts.push(`abri ${counts.abertura} ${pluralize(counts.abertura, "MR", "MRs")}`);
  if (counts.merge > 0) ontemParts.push(`mergeei ${counts.merge} ${pluralize(counts.merge, "MR", "MRs")}`);
  if (counts.review > 0) ontemParts.push(`revisei ${counts.review} ${pluralize(counts.review, "MR", "MRs")}`);
  if (counts.issue > 0) ontemParts.push(`avancei em ${counts.issue} ${pluralize(counts.issue, "issue", "issues")}`);

  const ontem =
    ontemParts.length === 0
      ? "Ontem foi tranquilo, sem atividade registrada no GitLab."
      : `Ontem eu ${joinPtBr(ontemParts)}.`;

  const { pronto, atencao, precisaRevisar } = input.pendentes;
  const hojeParts: string[] = [];
  if (pronto.length > 0) hojeParts.push(`dar merge em ${pronto.length} ${pluralize(pronto.length, "MR", "MRs")}`);
  if (precisaRevisar.length > 0) {
    hojeParts.push(`revisar ${precisaRevisar.length} ${pluralize(precisaRevisar.length, "MR", "MRs")}`);
  }
  if (atencao.length > 0) {
    hojeParts.push(`resolver ${atencao.length} ${pluralize(atencao.length, "pendência", "pendências")}`);
  }

  const hoje = hojeParts.length === 0 ? "Hoje não tenho nada pendente por enquanto." : `Hoje pretendo ${joinPtBr(hojeParts)}.`;

  return { ontem, hoje };
}

function getStoredEntry(date: string): StandupResult | null {
  const row = db
    .prepare<[string], DailyEntryRow>("SELECT * FROM daily_entries WHERE date = ?")
    .get(date);
  if (!row) return null;
  return { ontem: row.ontem, hoje: row.hoje, geradoViaLLM: Boolean(row.gerado_via_llm) };
}

function storeEntry(date: string, result: StandupResult): void {
  db.prepare(
    `INSERT INTO daily_entries (date, ontem, hoje, gerado_via_llm, model, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       ontem = excluded.ontem, hoje = excluded.hoje,
       gerado_via_llm = excluded.gerado_via_llm, model = excluded.model, created_at = excluded.created_at`,
  ).run(date, result.ontem, result.hoje, result.geradoViaLLM ? 1 : 0, result.geradoViaLLM ? MODEL : null, new Date().toISOString());
}

// `persist=false` é usado pelo range customizado de `/api/dashboard` (feature
// de debug, não exposta na UI) — não deve sobrescrever o registro histórico
// do dia corrente com uma janela de datas arbitrária.
export async function getOrCreateStandup(
  date: string,
  input: StandupInput,
  options: { persist?: boolean } = {},
): Promise<StandupResult> {
  const persist = options.persist ?? true;

  if (persist) {
    const existing = getStoredEntry(date);
    if (existing) return existing;
  }

  try {
    const { ontem, hoje } = await generateViaLLM(input);
    const result: StandupResult = { ontem, hoje, geradoViaLLM: true };
    if (persist) storeEntry(date, result);
    return result;
  } catch (error) {
    // Não persiste o fallback: se a falha for passageira (rate-limit do
    // modelo gratuito, instabilidade momentânea), a próxima chamada do dia
    // tenta a LLM de novo em vez de ficar presa no texto heurístico.
    console.error(
      "[standup] Falha ao gerar via LLM, usando fallback heurístico (não persistido):",
      error instanceof Error ? error.message : error,
    );
    return { ...generateViaHeuristica(input), geradoViaLLM: false };
  }
}

export function getDailyEntry(date: string): (StandupResult & { date: string; criadoEm: string }) | null {
  const row = db
    .prepare<[string], DailyEntryRow>("SELECT * FROM daily_entries WHERE date = ?")
    .get(date);
  if (!row) return null;
  return {
    date: row.date,
    ontem: row.ontem,
    hoje: row.hoje,
    geradoViaLLM: Boolean(row.gerado_via_llm),
    criadoEm: row.created_at,
  };
}

export function listDailyDates(): string[] {
  return db
    .prepare<[], { date: string }>("SELECT date FROM daily_entries ORDER BY date DESC")
    .all()
    .map((row) => row.date);
}
