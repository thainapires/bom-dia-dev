import { HugeiconsIcon } from "@hugeicons/react";
import Refresh01Icon from "@hugeicons/core-free-icons/Refresh01Icon";
import { useSettings } from "../SettingsContext";
import type { VisibleCards } from "../settings";

const CARD_LABELS: Record<keyof VisibleCards, string> = {
  pronto: "Pronto pra merge",
  atencao: "Precisa de atenção",
  precisaRevisar: "Precisa revisar",
  aguardandoResposta: "Aguardando resolução de comentário",
  aguardando: "Aguardando review",
  ontem: "Ontem você fez",
};

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();

  const toggleCard = (key: keyof VisibleCards) => {
    updateSettings({ visibleCards: { ...settings.visibleCards, [key]: !settings.visibleCards[key] } });
  };

  return (
    <div>
      <div>
        <h1 className="text-xl font-semibold text-white sm:text-2xl">Configurações</h1>
        <p className="mt-1 text-sm text-white/50">Preferências salvas neste navegador.</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-card p-4">
          <h2 className="text-sm font-semibold text-white/80">Cards visíveis no dashboard</h2>
          <div className="mt-3 flex flex-col gap-2">
            {(Object.keys(CARD_LABELS) as (keyof VisibleCards)[]).map((key) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-white/90"
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

        <div className="rounded-lg border border-white/5 bg-card p-4">
          <h2 className="text-sm font-semibold text-white/80">Limite de dias para "esquecido"</h2>
          <p className="mt-1 text-xs text-white/40">
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
            className="mt-3 w-24 rounded-md border border-white/5 bg-white/5 px-3 py-2 text-sm text-white/90 focus:outline-none focus:ring-1 focus:ring-white/20"
          />

          <button
            type="button"
            onClick={resetSettings}
            className="mt-6 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white/80 transition hover:bg-white/20"
          >
            <HugeiconsIcon icon={Refresh01Icon} size={16} />
            Restaurar valores padrão
          </button>
        </div>
      </div>
    </div>
  );
}
