import { execFile } from "node:child_process";

export class GlabError extends Error {
  constructor(message: string, public readonly stderr: string) {
    super(message);
    this.name = "GlabError";
  }
}

export function glabApi<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    execFile(
      "glab",
      ["api", path],
      { maxBuffer: 1024 * 1024 * 20 },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new GlabError(
              `Falha ao chamar 'glab api ${path}': ${error.message}`,
              stderr,
            ),
          );
          return;
        }
        try {
          resolve(JSON.parse(stdout) as T);
        } catch {
          reject(
            new GlabError(
              `Resposta do glab não é um JSON válido para '${path}'`,
              stdout,
            ),
          );
        }
      },
    );
  });
}
