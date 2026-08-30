import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { useSettings } from "../../SettingsContext";
import type { VisibleCards } from "../../settings";

const CARD_LABELS: Record<keyof VisibleCards, string> = {
  pronto: "Pronto pra merge",
  atencao: "Precisa de atenção",
  precisaRevisar: "Precisa revisar",
  aguardandoRespostaMeus: "Aguardando resolução — meus comentários",
  aguardandoRespostaOutros: "Aguardando resolução — comentários de outros",
  aguardando: "Aguardando review",
  jaAprovado: "MRs abertos que já aprovei",
  atividadeRecente: "Atividade recente",
};

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();

  const toggleCard = (key: keyof VisibleCards) => {
    updateSettings({ visibleCards: { ...settings.visibleCards, [key]: !settings.visibleCards[key] } });
  };

  return (
    <div>
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preferências salvas neste navegador.</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border-subtle bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground-soft">Cards visíveis no dashboard</h2>
          <div className="mt-3 flex flex-col gap-2">
            {(Object.keys(CARD_LABELS) as (keyof VisibleCards)[]).map((key) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded-md bg-surface-hover px-3 py-2 text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  checked={settings.visibleCards[key]}
                  onChange={() => toggleCard(key)}
                  className="h-4 w-4 rounded-sm"
                />
                {CARD_LABELS[key]}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border-subtle bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground-soft">Limite de dias para "esquecido"</h2>
          <p className="mt-1 text-xs text-foreground-subtle">
            MRs abertos/aguardando há mais dias que esse limite ganham o destaque de esquecido.
          </p>
          <input
            type="number"
            min={1}
            value={settings.diasEsquecidoLimite}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (!Number.isNaN(value) && value >= 1) updateSettings({ diasEsquecidoLimite: value });
            }}
            className="mt-3 w-24 rounded-md border border-border-subtle bg-surface-hover px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-focus-ring"
          />

          <button
            type="button"
            onClick={resetSettings}
            className="mt-6 flex items-center gap-2 rounded-lg bg-surface-selected px-3 py-2 text-sm text-foreground-soft transition hover:bg-surface-selected-strong active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <RefreshIcon size={16} />
            Restaurar valores padrão
          </button>
        </div>
      </div>
    </div>
  );
}
