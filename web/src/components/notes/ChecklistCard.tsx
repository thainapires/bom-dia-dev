import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AddCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { HamburgerMenuIcon } from "@solar-icons/react/linear/hamburger-menu";
import { Pen2Icon } from "@solar-icons/react/linear/pen-2";
import { useState } from "react";
import type { FormEvent } from "react";
import type { ChecklistItem } from "../../types";
import { PlusMinusBoldDuotoneIcon } from "@solar-icons/react";
import { GoPlus } from "react-icons/go";
import { MdDragIndicator } from "react-icons/md";
import { FaEdit, FaRegEdit, FaTrash } from "react-icons/fa";

interface ChecklistCardProps {
  checklist: ChecklistItem[];
  onAdd: (text: string) => void;
  onToggle: (id: number, done: boolean) => void;
  onEdit: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  onReorder: (orderedIds: number[]) => void;
  onClearCompleted: () => void;
}

export function ChecklistCard({
  checklist,
  onAdd,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
  onClearCompleted,
}: ChecklistCardProps) {
  const [newItemText, setNewItemText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const total = checklist.length;
  const completed = checklist.filter((item) => item.done).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  function handleAddItem(event: FormEvent) {
    event.preventDefault();
    const text = newItemText.trim();
    if (!text) return;
    onAdd(text);
    setNewItemText("");
  }

  function startEditing(item: ChecklistItem) {
    setEditingId(item.id);
    setEditingText(item.text);
  }

  function commitEdit() {
    if (editingId === null) return;
    const text = editingText.trim();
    if (text) onEdit(editingId, text);
    setEditingId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = checklist.findIndex((item) => item.id === active.id);
    const newIndex = checklist.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(checklist, oldIndex, newIndex).map((item) => item.id));
  }

  return (
    <div className="rounded-lg border border-white/5 bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/80">Checklist</h2>
        <span className="text-sm text-white/50">
          {completed}/{total}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-(--ease-out)"
          style={{ width: `${percent}%` }}
        />
      </div>

      <form onSubmit={handleAddItem} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(event) => setNewItemText(event.target.value)}
          placeholder="Adicionar item..."
          className="min-w-0 flex-1 rounded-md border border-white/5 bg-card-input px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <button
          type="submit"
          title="Adicionar"
          className="flex flex-none items-center justify-center rounded-md border border-white/5 bg-card-input px-3 py-2 text-white/80 transition hover:bg-white/20 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <GoPlus size={16} style={{ strokeWidth: '0.2px', stroke: 'currentColor' }}/>
        </button>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={checklist.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-3 flex max-h-80 flex-col gap-2 overflow-y-auto">
            {checklist.length === 0 ? (
              <p className="text-sm text-white/40">Nenhum item no checklist.</p>
            ) : (
              checklist.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  isEditing={editingId === item.id}
                  editingText={editingText}
                  onEditingTextChange={setEditingText}
                  onCommitEdit={commitEdit}
                  onStartEditing={() => startEditing(item)}
                  onToggle={(done) => onToggle(item.id, done)}
                  onDelete={() => onDelete(item.id)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {completed > 0 && (
        <button
          type="button"
          onClick={onClearCompleted}
          className="mt-3 flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-xs text-white/50 transition hover:bg-white/10 hover:text-white/70 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <FaTrash size={14} />
          Limpar concluídos
        </button>
      )}
    </div>
  );
}

interface ChecklistRowProps {
  item: ChecklistItem;
  isEditing: boolean;
  editingText: string;
  onEditingTextChange: (value: string) => void;
  onCommitEdit: () => void;
  onStartEditing: () => void;
  onToggle: (done: boolean) => void;
  onDelete: () => void;
}

function ChecklistRow({
  item,
  isEditing,
  editingText,
  onEditingTextChange,
  onCommitEdit,
  onStartEditing,
  onToggle,
  onDelete,
}: ChecklistRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md bg-card-input/80 px-2 py-2 opacity-100 transition-[opacity,transform] duration-150 ease-(--ease-out) starting:-translate-y-1 starting:opacity-0"
    >
      <button
        type="button"
        title="Arrastar pra reordenar"
        className="flex-none cursor-grab touch-none text-white/20 transition hover:text-white/50 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <MdDragIndicator size={16} />
      </button>

      <label className="relative flex h-4 w-4 flex-none cursor-pointer">
        <input
          type="checkbox"
          checked={item.done}
          onChange={(event) => onToggle(event.target.checked)}
          className="peer h-4 w-4 appearance-none rounded-sm bg-white transition-colors duration-150 checked:bg-primary"
        />
        <svg
          className="pointer-events-none absolute inset-0 h-4 w-4 scale-50 p-0.5 text-white opacity-0 transition-[opacity,transform] duration-150 ease-(--ease-out) peer-checked:scale-100 peer-checked:opacity-100"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </label>

      {isEditing ? (
        <input
          autoFocus
          type="text"
          value={editingText}
          onChange={(event) => onEditingTextChange(event.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(event) => {
            if (event.key === "Enter") onCommitEdit();
          }}
          className="min-w-0 flex-1 rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/90 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      ) : (
        <span
          className={`min-w-0 flex-1 truncate text-sm transition-colors duration-150 ${
            item.done ? "text-white/40 line-through" : "text-white/90"
          }`}
        >
          {item.text}
        </span>
      )}

      <button
        type="button"
        onClick={onStartEditing}
        title="Editar"
        className="flex-none text-white/30 transition hover:text-white/70 active:scale-[0.9]"
      >
        <FaRegEdit size={14} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Remover"
        className="flex-none text-white/30 transition hover:text-status-attention active:scale-[0.9]"
      >
        <FaTrash size={12} />
      </button>
    </div>
  );
}
