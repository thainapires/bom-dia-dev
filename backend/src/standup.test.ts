import { describe, expect, it } from "vitest";
import { buildPromptInput, generateViaHeuristica } from "./standup";
import type { StandupInput } from "./standup";

function input(overrides: Partial<StandupInput> = {}): StandupInput {
  return {
    ontemActivities: [],
    porIssue: [],
    issues: [],
    pendentes: { pronto: [], atencao: [], precisaRevisar: [] },
    ...overrides,
  };
}

describe("buildPromptInput", () => {
  it("sinaliza claramente quando não há atividade nem pendência, pra não induzir a LLM a inventar conteúdo", () => {
    const text = buildPromptInput(input());
    expect(text).toContain("Nenhuma atividade comprovada no GitLab.");
    expect(text).toContain("Nada pendente no momento.");
  });

  it("lista atividades e pendências com os dados fornecidos", () => {
    const text = buildPromptInput(
      input({
        ontemActivities: [{ kind: "commit", text: "fix: bug X", createdAt: "2026-08-25T10:00:00Z" }],
        pendentes: {
          pronto: [{ title: "Adiciona endpoint Y" }],
          atencao: [{ title: "MR Z", motivoAtencao: "Pipeline falhando" }],
          precisaRevisar: [{ title: "MR W", author: "Fulano" }],
        },
      }),
    );
    expect(text).toContain("fix: bug X");
    expect(text).toContain("2026-08-25T10:00:00Z");
    expect(text).toContain('Pronto pra merge: "Adiciona endpoint Y"');
    expect(text).toContain('Precisa de atenção (Pipeline falhando): "MR Z"');
    expect(text).toContain('Aguardando sua revisão: "MR W" (autor: Fulano)');
  });
});

describe("generateViaHeuristica (fallback quando a LLM falha ou está indisponível)", () => {
  it("sem atividade e sem pendência -> frases neutras", () => {
    const result = generateViaHeuristica(input());
    expect(result.ontem).toBe("Ontem foi tranquilo, sem atividade registrada no GitLab.");
    expect(result.hoje).toBe("Hoje não tenho nada pendente por enquanto.");
  });

  it("conta atividades de ontem por tipo", () => {
    const result = generateViaHeuristica(
      input({
        ontemActivities: [
          { kind: "commit", text: "a", createdAt: "2026-08-25T10:00:00Z" },
          { kind: "commit", text: "b", createdAt: "2026-08-25T11:00:00Z" },
          { kind: "merge", text: "c", createdAt: "2026-08-25T12:00:00Z" },
        ],
      }),
    );
    expect(result.ontem).toBe("Ontem eu fiz 2 commits e mergeei 1 MR.");
  });

  it("inclui issue relevante pra hoje sem transformar estado em evento", () => {
    const text = buildPromptInput(
      input({
        issues: [
          {
            issueIid: 10,
            projectId: 20,
            title: "Issue em andamento",
            url: "https://gitlab.com/x/y/-/issues/10",
            currentStatus: "In progress",
            statusAtPeriodStart: "In progress",
            currentAssignees: ["thaina"],
            isAssignedToMe: true,
            wasAssignedBeforePeriod: true,
            assignedDuringPeriod: [],
            statusTransitions: [],
            commentsDuringPeriod: [],
            hasCommitDuringPeriod: false,
            yesterdayFacts: [],
            todayFacts: ["estado atual: In progress; pode continuar como trabalho em andamento"],
            todayRelevance: "active",
            priority: 60,
          },
        ],
      }),
    );

    expect(text).toContain('"currentStatus":"In progress"');
    expect(text).toContain('"wasAssignedBeforePeriod":true');
    expect(text).not.toContain("peguei");
    expect(text).not.toContain("comecei");
  });

  it("não envia corpo de comentários no payload da LLM", () => {
    const text = buildPromptInput(
      input({
        issues: [
          {
            issueIid: 10,
            projectId: 20,
            title: "Issue comentada",
            url: "https://gitlab.com/x/y/-/issues/10",
            currentStatus: "In progress",
            statusAtPeriodStart: "In progress",
            currentAssignees: ["thaina"],
            isAssignedToMe: true,
            wasAssignedBeforePeriod: true,
            assignedDuringPeriod: [],
            statusTransitions: [],
            commentsDuringPeriod: [{ createdAt: "2026-08-25T12:00:00Z" }],
            hasCommitDuringPeriod: false,
            yesterdayFacts: ["comentário registrado em 2026-08-25T12:00:00Z"],
            todayFacts: [],
            todayRelevance: "passive",
            priority: 0,
          },
        ],
      }),
    );

    expect(text).toContain("comentário registrado em 2026-08-25T12:00:00Z");
    expect(text).not.toContain("body");
    expect(text).not.toContain("descrição");
  });

  it("resume pendências de hoje", () => {
    const result = generateViaHeuristica(
      input({
        pendentes: {
          pronto: [{ title: "A" }],
          atencao: [],
          precisaRevisar: [{ title: "B", author: "X" }, { title: "C", author: "Y" }],
        },
      }),
    );
    expect(result.hoje).toBe("Hoje pretendo dar merge em 1 MR e revisar 2 MRs.");
  });
});
