import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { DangerCircleIcon } from "@solar-icons/react/bold-duotone/danger-circle";
import { NotesIcon } from "@solar-icons/react/bold-duotone/notes";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { useState } from "react";
import { ChecklistCard } from "../../components/notes/ChecklistCard";
import { DateNavigation } from "../../components/notes/DateNavigation/DateNavigation";
import { NewNoteButton } from "../../components/notes/NewNoteButton";
import { NotesSummaryCard } from "../../components/notes/NotesSummaryCard";
import { RecentNotesCard } from "../../components/notes/RecentNotesCard";
import { RichTextEditor } from "../../components/notes/RichTextEditor";
import { Alert, Card, Page, PageContent, PageHeader } from "../../components/ui";
import { formatHourMinute, formatNotesDate, toISODate } from "../../formatting";
import { useChecklist } from "./useChecklist";
import { useNoteEditor } from "./useNoteEditor";
import { useRecentNotes } from "./useRecentNotes";

export function NotesPage() {
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [error, setError] = useState<string | null>(null);

  const { recentNotes, recentHasMore, isLoadingMoreRecent, upsertNote, loadMore } = useRecentNotes(setError);

  const {
    dayData,
    setDayData,
    activeNoteId,
    title,
    content,
    wordCount,
    charCount,
    isLoading,
    saveStatus,
    handleTitleChange,
    handleContentChange,
    handleWordCountChange,
    handleNewNote,
    openNote,
  } = useNoteEditor(date, setDate, setError, upsertNote);

  const {
    checklist,
    handleAddChecklistItem,
    handleToggleChecklistItem,
    handleEditChecklistItem,
    handleDeleteChecklistItem,
    handleReorderChecklist,
    handleClearCompleted,
  } = useChecklist(date, dayData, setDayData, setError);

  const isToday = date === toISODate(new Date());

  return (
    <Page>
      <PageHeader
        icon={<NotesIcon size={28} />}
        title="Notas"
        subtitle={<span className="capitalize">{formatNotesDate(date)}</span>}
        actions={
          <>
            <DateNavigation
              date={date}
              isToday={isToday}
              onDateChange={setDate}
            />

            <NewNoteButton
              onClick={handleNewNote}
              disabled={!isToday}
            />
          </>
        }
      />

      <PageContent className="space-y-[var(--section-gap)]">
        {error && <Alert>{error}</Alert>}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
          <div className="flex items-center justify-between gap-2">
            <input
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="Minha nota"
              disabled={isLoading}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground placeholder:text-foreground-subtle focus:outline-none"
            />
            <div className="flex flex-none items-center">
              {saveStatus === "saving" && (
                <span className="flex items-center opacity-100 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
                  <RefreshIcon size={16} className="animate-spin text-foreground-subtle" />
                  <span className="ml-2 text-xs font-semibold text-foreground-subtle">Salvando...</span>
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center opacity-100 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
                  <CheckCircleIcon size={16} className="text-success" />
                  <span className="ml-2 text-xs font-semibold text-success/90">Salvo agora</span>
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center opacity-100 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
                  <DangerCircleIcon size={16} className="text-attention" />
                  <span className="ml-2 text-xs font-semibold text-attention">Erro ao salvar</span>
                </span>
              )}
            </div>
          </div>

          <div className="mt-3">
            <RichTextEditor
              key={activeNoteId ?? `empty-${date}`}
              initialContent={content}
              disabled={isLoading}
              onChange={handleContentChange}
              onWordCountChange={handleWordCountChange}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-foreground-subtle">
            <span>
              {wordCount} {wordCount === 1 ? "palavra" : "palavras"} · {charCount}{" "}
              {charCount === 1 ? "caractere" : "caracteres"}
            </span>
            {dayData.note && <span>Editado às {formatHourMinute(dayData.note.updatedAt)}</span>}
          </div>
          </Card>

          <ChecklistCard
          checklist={checklist}
          onAdd={handleAddChecklistItem}
          onToggle={handleToggleChecklistItem}
          onEdit={handleEditChecklistItem}
          onDelete={handleDeleteChecklistItem}
          onReorder={handleReorderChecklist}
          onClearCompleted={handleClearCompleted}
        />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentNotesCard
          notes={recentNotes}
          hasMore={recentHasMore}
          isLoadingMore={isLoadingMoreRecent}
          activeNoteId={activeNoteId}
          onSelect={openNote}
          onLoadMore={loadMore}
        />
          <NotesSummaryCard stats={dayData.stats} />
        </div>
      </PageContent>
    </Page>
  );
}
