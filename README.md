# bom-dia-dev ☀️

Painel diário pessoal para abrir toda manhã antes de começar a trabalhar.
Mostra, de forma escaneável, o estado dos seus MRs no GitLab
(prontos pra merge, aguardando review, precisando de atenção), o tempo médio
até merge e um resumo do que foi feito no dia anterior (commits, merges,
reviews). Interface em português, dark theme.

## O que ele mostra

- **Status dos MRs abertos**, classificados em:
  - 🔴 **Atenção** — pipeline falhou ou há conflito de merge.
  - 🟢 **Pronto** — pipeline passou, tem ao menos uma aprovação e sem conflito.
  - 🟡 **Aguardando** — qualquer outro caso (aberto, ainda sem essas condições).
- **Tempo médio até merge** dos MRs recentes.
- **Resumo do dia anterior** — commits, merges e reviews, em formato parecido
  com `git log --oneline`.
- **Revisões pendentes** atribuídas a você.

## Stack

- **Backend** (`backend/`): Express + TypeScript. Não usa a lib oficial do
  GitLab nem chama a API REST diretamente — chama o binário [`glab`](https://gitlab.com/gitlab-org/cli)
  (GitLab CLI) via `child_process.execFile` e faz `JSON.parse` do stdout.
- **Frontend** (`web/`): Vite + React + TypeScript + Tailwind CSS v4
  (tema custom via `@theme`, sem `tailwind.config.js`) + lucide-react para
  ícones. Fontes Inter (sans) e JetBrains Mono (mono).
- **Docker**: `docker-compose.yml` na raiz sobe os dois serviços
  (`backend` na porta 3001, `web` na porta 5173, proxy `/api` do Vite pro
  `backend`).

## Pré-requisitos

- Node.js 20+ (ou Docker, se for rodar via `docker compose`).
- Um **Personal Access Token** do GitLab com escopo somente leitura
  (`read_api`).

## Como rodar

1. Copie o `.env.example` para `.env` na raiz e preencha com seu token:

   ```
   GITLAB_TOKEN=<seu personal access token>
   ```

2. Suba a aplicação:

   ```bash
   # Modo Docker (recomendado)
   docker compose up --build
   # abre http://localhost:5173

   # Ou sem Docker, na raiz do projeto
   npm install
   npm run dev   # roda backend (porta 3001) e web (porta 5173) juntos
   ```

## Estrutura do projeto

```
backend/src/
  glab.ts       # wrapper único de chamadas ao binário glab (glabApi<T>)
  gitlab.ts     # funções de alto nível sobre a API do GitLab (MRs, aprovações, eventos...)
  dashboard.ts  # monta o payload final: classificação, tempo médio, timeline do dia anterior
  narrative.ts  # transforma eventos do GitLab em um resumo legível
  index.ts      # única rota: GET /api/dashboard

web/src/
  App.tsx               # busca /api/dashboard, guarda estado, botão manual de atualizar
  components/           # Sidebar, Header, cards de MRs, resumo do dia, revisões pendentes, etc.
```

## Importante: autenticação com o GitLab

O backend usa um **Personal Access Token** via variável de ambiente
`GITLAB_TOKEN` — nunca a sessão OAuth interativa do `glab` (a que fica em
`~/.config/glab-cli/`). Isso é intencional: montar/copiar essa sessão OAuth
em containers ou processos paralelos já quebrou a autenticação do host
anteriormente, porque o refresh token é rotativo e de uso único, validado no
servidor do GitLab. Veja detalhes em [`CLAUDE.md`](./CLAUDE.md).

## Decisões de escopo da v1

- Sem auto-refresh — só carga inicial + botão manual.
- Sidebar: só o dashboard funciona, o resto é placeholder visual.
- Sem testes automatizados.
- Sem autenticação/multiusuário — é um painel pessoal, single-user, local.

## Licença

Projeto pessoal, sem licença definida.
