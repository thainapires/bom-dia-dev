import type { Dispatch, SetStateAction } from "react";
import {
  addChecklistItem,
  clearCompletedChecklist,
  deleteChecklistItem,
  reorderChecklist,
  updateChecklistItem,
} from "../../api";
import type { NotesDayResponse } from "../../types";

export function useChecklist(
  date: string,
  dayData: NotesDayResponse,
  setDayData: Dispatch<SetStateAction<NotesDayResponse>>,
  onError: (message: string) => void,
) {
  async function runMutation(
    apiCall: () => Promise<NotesDayResponse>,
    errorMessage: string,
    optimisticUpdate?: (prev: NotesDayResponse) => NotesDayResponse,
  ) {
    if (optimisticUpdate) setDayData(optimisticUpdate);
    try {
      setDayData(await apiCall());
    } catch (err) {
      onError(err instanceof Error ? err.message : errorMessage);
    }
  }

  function handleAddChecklistItem(text: string) {
    return runMutation(() => addChecklistItem(date, text), "Erro ao adicionar item");
  }

  function handleToggleChecklistItem(id: number, done: boolean) {
    return runMutation(
      () => updateChecklistItem(date, id, { done }),
      "Erro ao atualizar item",
      (prev) => ({
        ...prev,
        checklist: prev.checklist.map((item) => (item.id === id ? { ...item, done } : item)),
      }),
    );
  }

  function handleEditChecklistItem(id: number, text: string) {
    return runMutation(() => updateChecklistItem(date, id, { text }), "Erro ao editar item");
  }

  function handleDeleteChecklistItem(id: number) {
    return runMutation(
      () => deleteChecklistItem(date, id),
      "Erro ao remover item",
      (prev) => ({ ...prev, checklist: prev.checklist.filter((item) => item.id !== id) }),
    );
  }

  function handleReorderChecklist(orderedIds: number[]) {
    return runMutation(
      () => reorderChecklist(date, orderedIds),
      "Erro ao reordenar checklist",
      (prev) => {
        const byId = new Map(prev.checklist.map((item) => [item.id, item]));
        return {
          ...prev,
          checklist: orderedIds.map((id, position) => ({ ...byId.get(id)!, position })),
        };
      },
    );
  }

  function handleClearCompleted() {
    return runMutation(
      () => clearCompletedChecklist(date),
      "Erro ao limpar itens concluídos",
      (prev) => ({ ...prev, checklist: prev.checklist.filter((item) => !item.done) }),
    );
  }

  return {
    checklist: dayData.checklist,
    handleAddChecklistItem,
    handleToggleChecklistItem,
    handleEditChecklistItem,
    handleDeleteChecklistItem,
    handleReorderChecklist,
    handleClearCompleted,
  };
}
