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
import { useState } from "react";
import type { FormEvent } from "react";
import type { ChecklistItem } from "../../types";
import { GoPlus } from "react-icons/go";
import { FaRegEdit, FaTrash } from "react-icons/fa";
import { MdDragIndicator } from "react-icons/md";
import { Button, Card, IconButton, Input } from "../ui";

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
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground-soft">Checklist</h2>
        <span className="text-sm text-muted-foreground">
          {completed}/{total}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-(--ease-out)"
          style={{ width: `${percent}%` }}
        />
      </div>

      <form onSubmit={handleAddItem} className="mt-4 flex gap-2">
        <Input
          type="text"
          value={newItemText}
          onChange={(event) => setNewItemText(event.target.value)}
          placeholder="Adicionar item..."
          className="min-w-0 flex-1 bg-surface-input"
        />
        <IconButton type="submit" title="Adicionar" className="border border-border-subtle bg-surface-input hover:bg-surface-selected-strong">
          <GoPlus size={16} className="stroke-1" />
        </IconButton>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={checklist.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-3 flex max-h-80 flex-col gap-2 overflow-y-auto">
            {checklist.length === 0 ? (
              <p className="text-sm text-foreground-subtle">Nenhum item no checklist.</p>
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
        <Button
          onClick={onClearCompleted}
          variant="ghost"
          icon={<FaTrash size={14} />}
          className="mt-3 h-8 rounded-md text-xs"
        >
          Limpar concluídos
        </Button>
      )}
    </Card>
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
      className="flex items-center gap-2 rounded-md bg-surface-input/80 px-2 py-2 opacity-100 transition-[opacity,transform] duration-150 ease-(--ease-out) starting:-translate-y-1 starting:opacity-0"
    >
      <button
        type="button"
        title="Arrastar pra reordenar"
        className="flex-none cursor-grab touch-none text-foreground-faint transition hover:text-muted-foreground active:cursor-grabbing"
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
          className="peer h-4 w-4 appearance-none rounded-sm bg-control-background transition-colors duration-150 checked:bg-primary"
        />
        <svg
          className="pointer-events-none absolute inset-0 h-4 w-4 scale-50 p-0.5 text-foreground opacity-0 transition-[opacity,transform] duration-150 ease-(--ease-out) peer-checked:scale-100 peer-checked:opacity-100"
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
          className="min-w-0 flex-1 rounded bg-surface-selected px-1.5 py-0.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-focus-ring"
        />
      ) : (
        <span
          className={`min-w-0 flex-1 truncate text-sm transition-colors duration-150 ${
            item.done ? "text-foreground-subtle line-through" : "text-foreground"
          }`}
        >
          {item.text}
        </span>
      )}

      <button
        type="button"
        onClick={onStartEditing}
        title="Editar"
        className="flex-none text-foreground-disabled transition hover:text-foreground-secondary active:scale-[0.9]"
      >
        <FaRegEdit size={14} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Remover"
        className="flex-none text-foreground-disabled transition hover:text-attention active:scale-[0.9]"
      >
        <FaTrash size={12} />
      </button>
    </div>
  );
}
