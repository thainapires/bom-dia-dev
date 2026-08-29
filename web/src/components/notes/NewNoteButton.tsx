import { AddCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
interface NewNoteButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function NewNoteButton({
  onClick,
  disabled = false,
}: NewNoteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Só é possível criar notas para hoje" : undefined}
      className="flex flex-none items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <AddCircleIcon size={16} />
      Nova nota
    </button>
  )
}