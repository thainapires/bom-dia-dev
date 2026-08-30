import { beforeEach, describe, expect, it, vi } from "vitest";
import { enrichReviewItem, unresolvedCommentOwnership } from "./dashboard";
import { getApprovals, getMrDiscussions } from "./gitlab";
import type { GitlabApprovals, GitlabDiscussion, GitlabMergeRequestSummary } from "./types";

vi.mock("./gitlab", () => ({
  getApprovals: vi.fn(),
  getMrDiscussions: vi.fn(),
}));

const ME = 111;
const OUTRA_PESSOA = 222;

function nota(authorId: number, resolved: boolean, resolvable = true) {
  return { id: Math.random(), author: { id: authorId }, resolvable, resolved };
}

function discussao(notes: ReturnType<typeof nota>[]): GitlabDiscussion {
  return { id: String(Math.random()), notes };
}

function mrBase(overrides: Partial<GitlabMergeRequestSummary> = {}): GitlabMergeRequestSummary {
  return {
    id: 1,
    iid: 1,
    project_id: 1,
    title: "MR de teste",
    web_url: "https://gitlab.com/x/y/-/merge_requests/1",
    source_branch: "feat/x",
    created_at: new Date().toISOString(),
    merged_at: null,
    draft: false,
    author: { name: "Autor" },
    ...overrides,
  };
}

function approvals(approvedByMe: boolean): GitlabApprovals {
  return {
    approved: approvedByMe,
    approved_by: approvedByMe
      ? [{ user: { id: ME, username: "me", name: "Eu" }, approved_at: new Date().toISOString() }]
      : [],
    approvals_left: approvedByMe ? 0 : 1,
  };
}

describe("unresolvedCommentOwnership", () => {
  it("comentário meu pendente + de outra pessoa pendente -> mine=true, others=true", () => {
    const discussions = [discussao([nota(ME, false), nota(OUTRA_PESSOA, false)])];
    expect(unresolvedCommentOwnership(discussions, ME)).toEqual({ mine: true, others: true });
  });

  it("meu comentário resolvido + de outra pessoa pendente (mesma discussão) -> mine=false, others=true", () => {
    const discussions = [discussao([nota(ME, true), nota(OUTRA_PESSOA, false)])];
    expect(unresolvedCommentOwnership(discussions, ME)).toEqual({ mine: false, others: true });
  });

  it("comentário de outra pessoa resolvido + meu pendente -> mine=true, others=false", () => {
    const discussions = [discussao([nota(OUTRA_PESSOA, true), nota(ME, false)])];
    expect(unresolvedCommentOwnership(discussions, ME)).toEqual({ mine: true, others: false });
  });

  it("tudo resolvido -> mine=false, others=false", () => {
    const discussions = [discussao([nota(ME, true), nota(OUTRA_PESSOA, true)])];
    expect(unresolvedCommentOwnership(discussions, ME)).toEqual({ mine: false, others: false });
  });

  it("nota não resolvível (comentário simples) não conta como pendência", () => {
    const discussions = [discussao([nota(OUTRA_PESSOA, false, false)])];
    expect(unresolvedCommentOwnership(discussions, ME)).toEqual({ mine: false, others: false });
  });

  it("sem discussões -> mine=false, others=false", () => {
    expect(unresolvedCommentOwnership([], ME)).toEqual({ mine: false, others: false });
  });
});

describe("enrichReviewItem", () => {
  beforeEach(() => {
    vi.mocked(getApprovals).mockReset();
    vi.mocked(getMrDiscussions).mockReset();
  });

  it("só comentário meu pendente -> aguardandoRespostaMeus", async () => {
    vi.mocked(getApprovals).mockResolvedValue(approvals(false));
    vi.mocked(getMrDiscussions).mockResolvedValue([discussao([nota(ME, false)])]);

    const result = await enrichReviewItem(mrBase(), ME);
    expect(result.situacao).toBe("aguardandoRespostaMeus");
  });

  it("só comentário de outra pessoa pendente -> aguardandoRespostaOutros", async () => {
    vi.mocked(getApprovals).mockResolvedValue(approvals(false));
    vi.mocked(getMrDiscussions).mockResolvedValue([discussao([nota(OUTRA_PESSOA, false)])]);

    const result = await enrichReviewItem(mrBase(), ME);
    expect(result.situacao).toBe("aguardandoRespostaOutros");
  });

  it("meu comentário e de outra pessoa pendentes -> prioriza aguardandoRespostaMeus", async () => {
    vi.mocked(getApprovals).mockResolvedValue(approvals(false));
    vi.mocked(getMrDiscussions).mockResolvedValue([
      discussao([nota(ME, false), nota(OUTRA_PESSOA, false)]),
    ]);

    const result = await enrichReviewItem(mrBase(), ME);
    expect(result.situacao).toBe("aguardandoRespostaMeus");
  });

  it("meu resolvido, de outra pessoa ainda pendente -> muda para aguardandoRespostaOutros", async () => {
    vi.mocked(getApprovals).mockResolvedValue(approvals(false));
    vi.mocked(getMrDiscussions).mockResolvedValue([
      discussao([nota(ME, true), nota(OUTRA_PESSOA, false)]),
    ]);

    const result = await enrichReviewItem(mrBase(), ME);
    expect(result.situacao).toBe("aguardandoRespostaOutros");
  });

  it("tudo resolvido e ainda não aprovei -> precisaRevisar", async () => {
    vi.mocked(getApprovals).mockResolvedValue(approvals(false));
    vi.mocked(getMrDiscussions).mockResolvedValue([discussao([nota(OUTRA_PESSOA, true)])]);

    const result = await enrichReviewItem(mrBase(), ME);
    expect(result.situacao).toBe("precisaRevisar");
  });

  it("tudo resolvido e eu já aprovei -> jaAprovado", async () => {
    vi.mocked(getApprovals).mockResolvedValue(approvals(true));
    vi.mocked(getMrDiscussions).mockResolvedValue([discussao([nota(OUTRA_PESSOA, true)])]);

    const result = await enrichReviewItem(mrBase(), ME);
    expect(result.situacao).toBe("jaAprovado");
  });

  it("sem discussões e eu já aprovei -> jaAprovado", async () => {
    vi.mocked(getApprovals).mockResolvedValue(approvals(true));
    vi.mocked(getMrDiscussions).mockResolvedValue([]);

    const result = await enrichReviewItem(mrBase(), ME);
    expect(result.situacao).toBe("jaAprovado");
  });

  it("já aprovei mas ainda há comentário de outra pessoa pendente -> continua aparecendo em aguardandoRespostaOutros, não em jaAprovado", async () => {
    vi.mocked(getApprovals).mockResolvedValue(approvals(true));
    vi.mocked(getMrDiscussions).mockResolvedValue([discussao([nota(OUTRA_PESSOA, false)])]);

    const result = await enrichReviewItem(mrBase(), ME);
    expect(result.situacao).toBe("aguardandoRespostaOutros");
  });

  it("já aprovei mas ainda há comentário meu pendente -> continua aparecendo em aguardandoRespostaMeus, não em jaAprovado", async () => {
    vi.mocked(getApprovals).mockResolvedValue(approvals(true));
    vi.mocked(getMrDiscussions).mockResolvedValue([discussao([nota(ME, false)])]);

    const result = await enrichReviewItem(mrBase(), ME);
    expect(result.situacao).toBe("aguardandoRespostaMeus");
  });
});
