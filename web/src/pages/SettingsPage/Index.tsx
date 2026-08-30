import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { SettingsIcon } from "@solar-icons/react/bold/settings";
import { useSettings } from "../../SettingsContext";
import type { VisibleCards } from "../../settings";
import { Button, Card, Input, Page, PageContent, PageHeader } from "../../components/ui";

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
    <Page>
      <PageHeader
        icon={<SettingsIcon size={28} />}
        title="Configurações"
        subtitle="Preferências salvas neste navegador."
      />

      <PageContent>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
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
          </Card>

          <Card>
          <h2 className="text-sm font-semibold text-foreground-soft">Limite de dias para "esquecido"</h2>
          <p className="mt-1 text-xs text-foreground-subtle">
            MRs abertos/aguardando há mais dias que esse limite ganham o destaque de esquecido.
          </p>
          <Input
            type="number"
            min={1}
            value={settings.diasEsquecidoLimite}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (!Number.isNaN(value) && value >= 1) updateSettings({ diasEsquecidoLimite: value });
            }}
            className="mt-3 w-24"
          />

          <Button
            type="button"
            onClick={resetSettings}
            variant="secondary"
            icon={<RefreshIcon size={16} />}
            className="mt-6"
          >
            Restaurar valores padrão
          </Button>
          </Card>
        </div>
      </PageContent>
    </Page>
  );
}
