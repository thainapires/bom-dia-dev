import { describe, expect, it } from "vitest";
import { buildIssueStandupFacts, normalizeBoardStatus } from "./narrative";
import type { GitlabLabelEvent, GitlabNote, IssueDayActivity } from "./types";

const range = { after: "2026-08-24", before: "2026-08-26" };

function label(action: "add" | "remove", name: string, created_at: string): GitlabLabelEvent {
  return { action, created_at, label: { name } };
}

function note(body: string, created_at: string, system = true): GitlabNote {
  return { id: Math.random(), body, created_at, system };
}

function activity(overrides: Partial<IssueDayActivity> = {}): IssueDayActivity {
  return {
    issueIid: 1,
    projectId: 10,
    title: "Issue teste",
    url: "https://gitlab.com/x/y/-/issues/1",
    currentLabels: ["In progress"],
    currentAssignees: ["thaina"],
    issueState: "opened",
    hasCommit: false,
    labelChanges: [],
    comments: [],
    assignmentEvents: [note("assigned to @thaina", "2026-08-20T10:00:00Z")],
    stateEvents: [],
    ...overrides,
  };
}

function facts(overrides: Partial<IssueDayActivity> = {}) {
  return buildIssueStandupFacts([activity(overrides)], "thaina", range);
}

describe("normalizeBoardStatus", () => {
  it("normaliza labels de board com escopo e variações simples", () => {
    expect(normalizeBoardStatus("workflow::For code review")).toBe("For code review");
    expect(normalizeBoardStatus("qa-testing-failed")).toBe("QA Testing Failed");
    expect(normalizeBoardStatus("label qualquer")).toBeNull();
  });
});

describe("buildIssueStandupFacts", () => {
  it("issue já atribuída antes e ainda In progress vira só trabalho atual, sem evento de ontem", () => {
    const [fact] = facts();

    expect(fact.wasAssignedBeforePeriod).toBe(true);
    expect(fact.assignedDuringPeriod).toEqual([]);
    expect(fact.statusTransitions).toEqual([]);
    expect(fact.yesterdayFacts).toEqual([]);
    expect(fact.todayRelevance).toBe("active");
  });

  it("detecta atribuição dentro do período", () => {
    const [fact] = facts({ assignmentEvents: [note("assigned to @thaina", "2026-08-25T10:00:00Z")] });

    expect(fact.wasAssignedBeforePeriod).toBe(false);
    expect(fact.assignedDuringPeriod).toEqual(["2026-08-25T10:00:00Z"]);
    expect(fact.yesterdayFacts).toContain("atribuída a mim em 2026-08-25T10:00:00Z");
  });

  it("In progress -> For code review no período vira transição comprovada", () => {
    const [fact] = facts({
      currentLabels: ["For code review"],
      labelChanges: [
        label("add", "In progress", "2026-08-20T09:00:00Z"),
        label("remove", "In progress", "2026-08-25T11:00:00Z"),
        label("add", "For code review", "2026-08-25T11:00:00Z"),
      ],
    });

    expect(fact.statusAtPeriodStart).toBe("In progress");
    expect(fact.statusTransitions).toEqual([{ from: "In progress", to: "For code review", timestamp: "2026-08-25T11:00:00Z" }]);
    expect(fact.yesterdayFacts.join(" ")).toContain("desenvolvimento enviado para code review");
  });

  it("issue já estava For code review antes do período e não cria evento de envio", () => {
    expect(
      facts({
        currentLabels: ["For code review"],
        labelChanges: [label("add", "For code review", "2026-08-20T09:00:00Z")],
      }),
    ).toEqual([]);
  });

  it("For code review -> Code Review Failed gera atenção", () => {
    const [fact] = facts({
      currentLabels: ["Code Review Failed"],
      labelChanges: [
        label("add", "For code review", "2026-08-20T09:00:00Z"),
        label("remove", "For code review", "2026-08-25T11:00:00Z"),
        label("add", "Code Review Failed", "2026-08-25T11:00:00Z"),
      ],
    });

    expect(fact.statusTransitions[0]).toMatchObject({ from: "For code review", to: "Code Review Failed" });
    expect(fact.todayRelevance).toBe("attention");
  });

  it("Code Review Failed -> In progress reconhece volta para ajustes", () => {
    const [fact] = facts({
      currentLabels: ["In progress"],
      labelChanges: [
        label("add", "Code Review Failed", "2026-08-20T09:00:00Z"),
        label("remove", "Code Review Failed", "2026-08-25T11:00:00Z"),
        label("add", "In progress", "2026-08-25T11:00:00Z"),
      ],
    });

    expect(fact.yesterdayFacts.join(" ")).toContain("voltou para desenvolvimento para ajustes de review");
  });

  it("In Testing atual não vira plano de hoje automaticamente", () => {
    expect(facts({ currentLabels: ["In Testing"] })).toEqual([]);
  });

  it("In Testing -> QA Testing Failed gera atenção", () => {
    const [fact] = facts({
      currentLabels: ["QA Testing Failed"],
      labelChanges: [
        label("add", "In Testing", "2026-08-20T09:00:00Z"),
        label("remove", "In Testing", "2026-08-25T11:00:00Z"),
        label("add", "QA Testing Failed", "2026-08-25T11:00:00Z"),
      ],
    });

    expect(fact.statusTransitions[0]).toMatchObject({ from: "In Testing", to: "QA Testing Failed" });
    expect(fact.todayRelevance).toBe("attention");
  });

  it("QA Testing Failed -> In progress reconhece correção de QA", () => {
    const [fact] = facts({
      currentLabels: ["In progress"],
      labelChanges: [
        label("add", "QA Testing Failed", "2026-08-20T09:00:00Z"),
        label("remove", "QA Testing Failed", "2026-08-25T11:00:00Z"),
        label("add", "In progress", "2026-08-25T11:00:00Z"),
      ],
    });

    expect(fact.yesterdayFacts.join(" ")).toContain("voltou para desenvolvimento para correção de QA");
  });

  it("For Production Testing -> Production Testing Failed gera atenção alta", () => {
    const [fact] = facts({
      currentLabels: ["Production Testing Failed"],
      labelChanges: [
        label("add", "For Production Testing", "2026-08-20T09:00:00Z"),
        label("remove", "For Production Testing", "2026-08-25T11:00:00Z"),
        label("add", "Production Testing Failed", "2026-08-25T11:00:00Z"),
      ],
    });

    expect(fact.statusTransitions[0]).toMatchObject({ from: "For Production Testing", to: "Production Testing Failed" });
    expect(fact.todayRelevance).toBe("attention");
    expect(fact.priority).toBe(100);
  });

  it("fechamento dentro do período vira transição comprovada", () => {
    const [fact] = facts({
      issueState: "closed",
      currentLabels: [],
      labelChanges: [label("add", "Done", "2026-08-20T09:00:00Z")],
      stateEvents: [{ state: "closed", created_at: "2026-08-25T15:00:00Z" }],
    });

    expect(fact.statusTransitions[0]).toMatchObject({ from: "Done", to: "Closed" });
    expect(fact.yesterdayFacts.join(" ")).toContain("tarefa concluída");
  });

  it("issue antiga Done ou Closed é ignorada quando não há evento recente", () => {
    expect(facts({ currentLabels: ["Done"] })).toEqual([]);
    expect(facts({ issueState: "closed", currentLabels: [] })).toEqual([]);
  });

  it("mudança para Done dentro do período pode entrar como conclusão", () => {
    const [fact] = facts({
      currentLabels: ["Done"],
      labelChanges: [
        label("add", "In progress", "2026-08-20T09:00:00Z"),
        label("remove", "In progress", "2026-08-25T11:00:00Z"),
        label("add", "Done", "2026-08-25T11:00:00Z"),
      ],
    });

    expect(fact.statusTransitions[0]).toMatchObject({ from: "In progress", to: "Done" });
    expect(fact.yesterdayFacts.join(" ")).toContain("tarefa concluída");
  });

  it("sem atividade comprovada e sem estado relevante não gera fatos", () => {
    expect(facts({ currentLabels: ["For QA Testing"] })).toEqual([]);
  });

  it("assignee atual sem histórico suficiente não diz que foi atribuída no período", () => {
    const [fact] = facts({ assignmentEvents: [] });

    expect(fact.wasAssignedBeforePeriod).toBe(false);
    expect(fact.assignedDuringPeriod).toEqual([]);
    expect(fact.yesterdayFacts).toEqual([]);
  });

  it("estado atual sem histórico suficiente usa formulação factual para hoje", () => {
    const [fact] = facts({ currentLabels: ["To do"], labelChanges: [], assignmentEvents: [] });

    expect(fact.statusAtPeriodStart).toBe("To do");
    expect(fact.statusTransitions).toEqual([]);
    expect(fact.todayFacts).toEqual(["estado atual: To do; candidata a trabalho se fizer sentido pela prioridade"]);
  });

  it("não carrega corpo de comentário nos fatos", () => {
    const [fact] = facts({ comments: [note("texto privado", "2026-08-25T12:00:00Z", false)] });

    expect(fact.commentsDuringPeriod).toEqual([{ createdAt: "2026-08-25T12:00:00Z" }]);
    expect(JSON.stringify(fact)).not.toContain("texto privado");
  });
});
