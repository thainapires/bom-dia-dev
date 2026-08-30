import { AltArrowRightIcon } from "@solar-icons/react/linear/alt-arrow-right";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { formatHourMinute, formatRelativeDays, formatShortDate } from "../../formatting";
import type { NoteSummary } from "../../types";
import { FileIcon } from "@solar-icons/react/bold-duotone/file";
import { Button, Card } from "../ui";

interface RecentNotesCardProps {
  notes: NoteSummary[];
  hasMore: boolean;
  isLoadingMore: boolean;
  activeNoteId: number | null;
  onSelect: (note: NoteSummary) => void;
  onLoadMore: () => void;
}

function noteLabel(relative: string): string | null {
  if (relative === "hoje") return "Hoje";
  if (relative === "ontem") return "Ontem";
  return null;
}

export function RecentNotesCard({
  notes,
  hasMore,
  isLoadingMore,
  activeNoteId,
  onSelect,
  onLoadMore,
}: RecentNotesCardProps) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-foreground-soft">Notas recentes</h2>

      {notes.length === 0 ? (
        <p className="mt-3 text-sm text-foreground-subtle">Nenhuma nota ainda.</p>
      ) : (
        <div className="mt-3 flex flex-col divide-y divide-border-subtle">
          {notes.map((note) => {
            const relative = formatRelativeDays(note.createdAt);
            const dayLabel = noteLabel(relative) ?? formatShortDate(note.date);
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => onSelect(note)}
                className={`flex items-center gap-3 py-3 text-left transition rounded-md hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer ${
                  note.id === activeNoteId ? "bg-primary/10 hover:bg-primary/20" : ""
                }`}
              >
                <span className="flex h-8 w-8 ml-2 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileIcon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {note.title || "Sem título"}
                    </span>
                    <span className="flex-none text-xs text-foreground-subtle">
                      {dayLabel} · {formatHourMinute(note.createdAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-foreground-subtle">
                    {note.preview || "Nota vazia"}
                  </span>
                </span>
                <AltArrowRightIcon size={14} className="flex-none text-foreground-faint mr-2" />
              </button>
            );
          })}
        </div>
      )}

      {hasMore && (
        <Button
          onClick={onLoadMore}
          disabled={isLoadingMore}
          variant="secondary"
          className="mt-3 w-full"
        >
          {isLoadingMore && <RefreshIcon size={14} className="animate-spin" />}
          Ver mais
        </Button>
      )}
    </Card>
  );
}
