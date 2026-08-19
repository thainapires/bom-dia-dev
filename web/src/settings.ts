export interface VisibleCards {
  pronto: boolean;
  atencao: boolean;
  precisaRevisar: boolean;
  aguardandoResposta: boolean;
  aguardando: boolean;
  ontem: boolean;
}

export interface Settings {
  displayName: string;
  visibleCards: VisibleCards;
  diasEsquecidoLimite: number;
}

export const DEFAULT_SETTINGS: Settings = {
  displayName: "Thai",
  visibleCards: {
    pronto: true,
    atencao: true,
    precisaRevisar: true,
    aguardandoResposta: true,
    aguardando: true,
    ontem: true,
  },
  diasEsquecidoLimite: 5,
};

const STORAGE_KEY = "bomdiadev:settings";

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      visibleCards: { ...DEFAULT_SETTINGS.visibleCards, ...parsed.visibleCards },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
