import type { IssueDayActivity, IssueNarrativeItem, IssueUpdateCategoria } from "./types";

// Ponto de troca: hoje é heurística por palavra-chave, mas a assinatura já é
// async e recebe só dados estruturados (sem I/O) — uma versão que manda pro
// Claude resumir pode implementar o mesmo tipo sem mexer no dashboard.ts.
export type IssueNarrativeClassifier = (
  activities: IssueDayActivity[],
) => Promise<IssueNarrativeItem[]>;

interface Rule {
  pattern: RegExp;
  categoria: IssueUpdateCategoria;
  linha: (title: string) => string;
}

// Checado antes dos comentários: mudança de label é fato estruturado, não
// inferência de texto — tem prioridade sobre qualquer keyword em comentário.
const LABEL_RULES: Rule[] = [
  {
    pattern: /bloquead|impediment/i,
    categoria: "bloqueado",
    linha: (t) => `"${t}" está bloqueado`,
  },
  {
    pattern: /pausad/i,
    categoria: "pausado",
    linha: (t) => `Pausou "${t}"`,
  },
  {
    pattern: /code.?review/i,
    categoria: "code_review",
    linha: (t) => `Terminou a implementação de "${t}", indo pra code review`,
  },
  {
    pattern: /\bqa\b/i,
    categoria: "aguardando_qa",
    linha: (t) => `"${t}" está aguardando QA`,
  },
];

const COMMENT_RULES: Rule[] = [
  {
    pattern: /bloquead|impediment/i,
    categoria: "bloqueado",
    linha: (t) => `"${t}" está com um impedimento`,
  },
  {
    pattern: /pausad/i,
    categoria: "pausado",
    linha: (t) => `Pausou "${t}"`,
  },
  {
    pattern: /aguardando.?qa/i,
    categoria: "aguardando_qa",
    linha: (t) => `"${t}" está aguardando QA`,
  },
  {
    pattern: /n(ã|a)o passou|reprovad|falhou no teste/i,
    categoria: "testado_falhou",
    linha: (t) => `"${t}" não passou no teste do QA`,
  },
  {
    pattern: /passou|testado|aprovado no qa/i,
    categoria: "testado_ok",
    linha: (t) => `"${t}" passou no QA`,
  },
  {
    pattern: /finaliz|conclu[ií]d|terminei|terminou/i,
    categoria: "finalizado",
    linha: (t) => `Finalizou "${t}"`,
  },
];

export function classifyIssueActivity(activity: IssueDayActivity): IssueNarrativeItem | null {
  for (const rule of LABEL_RULES) {
    const match = activity.labelChanges.find(
      (change) => change.action === "add" && change.label && rule.pattern.test(change.label.name),
    );
    if (match) {
      return {
        issueIid: activity.issueIid,
        projectId: activity.projectId,
        title: activity.title,
        url: activity.url,
        linha: rule.linha(activity.title),
        categoria: rule.categoria,
      };
    }
  }

  // Comentários vêm ordenados do mais recente pro mais antigo (ver
  // getIssueNotes), então a primeira regra que bater reflete o sinal mais
  // recente do dia quando há mais de um comentário relevante.
  for (const comment of activity.comments) {
    for (const rule of COMMENT_RULES) {
      if (rule.pattern.test(comment.body)) {
        return {
          issueIid: activity.issueIid,
          projectId: activity.projectId,
          title: activity.title,
          url: activity.url,
          linha: rule.linha(activity.title),
          categoria: rule.categoria,
        };
      }
    }
  }

  if (activity.hasCommit) {
    return {
      issueIid: activity.issueIid,
      projectId: activity.projectId,
      title: activity.title,
      url: activity.url,
      linha: `Trabalhou em "${activity.title}"`,
      categoria: "trabalhando",
    };
  }

  return null;
}

export const heuristicClassifier: IssueNarrativeClassifier = async (activities) =>
  activities
    .map(classifyIssueActivity)
    .filter((item): item is IssueNarrativeItem => item !== null);
