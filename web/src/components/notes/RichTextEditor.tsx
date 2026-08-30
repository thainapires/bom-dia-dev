import { CharacterCount } from "@tiptap/extension-character-count";
import { Placeholder } from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useEffect, useMemo } from "react";
import { MdFormatBold, MdFormatItalic, MdFormatListBulleted, MdFormatListNumbered, MdFormatUnderlined, MdOutlineInsertLink } from "react-icons/md";

const TOOLBAR_BUTTON_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted transition hover:bg-surface-selected hover:text-foreground active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const EDITOR_PROPS = {
  attributes: {
    class:
      "prose-notes min-h-56 w-full rounded-md border border-border-subtle bg-surface-input p-3 text-sm text-foreground focus:outline-none",
  },
};

interface RichTextEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
  onWordCountChange?: (words: number, characters: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  initialContent,
  onChange,
  onWordCountChange,
  placeholder = "Escreva algo...",
  disabled,
}: RichTextEditorProps) {

  const extensions = useMemo(
    () => [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: !disabled,
    editorProps: EDITOR_PROPS,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
      onWordCountChange?.(
        currentEditor.storage.characterCount.words(),
        currentEditor.storage.characterCount.characters(),
      );
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    onWordCountChange?.(
      editor.storage.characterCount.words(),
      editor.storage.characterCount.characters(),
    );
  }, [editor]);

  if (!editor) return null;

  function toggleLink() {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("URL do link:");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 border-b border-border-subtle pb-3">
        <button
          type="button"
          title="Negrito"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive("bold") ? "bg-surface-selected text-foreground" : ""}`}
        >
          <MdFormatBold size={24} />
        </button>
        <button
          type="button"
          title="Itálico"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive("italic") ? "bg-surface-selected text-foreground" : ""}`}
        >
          <MdFormatItalic size={24} />
        </button>
        <button
          type="button"
          title="Sublinhado"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive("underline") ? "bg-surface-selected text-foreground" : ""}`}
        >
          <MdFormatUnderlined size={24} />
        </button>
        <span className="mx-1 h-5 w-px bg-surface-selected" />
        <button
          type="button"
          title="Lista"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive("bulletList") ? "bg-surface-selected text-foreground" : ""}`}
        >
          <MdFormatListBulleted size={24} />
        </button>
        <button
          type="button"
          title="Lista numerada"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive("orderedList") ? "bg-surface-selected text-foreground" : ""}`}
        >
          <MdFormatListNumbered size={24} />
        </button>
        <span className="mx-1 h-5 w-px bg-surface-selected" />
        <button
          type="button"
          title={editor.isActive("link") ? "Remover link" : "Adicionar link"}
          onClick={toggleLink}
          className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive("link") ? "bg-surface-selected text-foreground" : ""}`}
        >
          <MdOutlineInsertLink size={24} />
        </button>
      </div>
      <EditorContent editor={editor} className="mt-3" />
    </div>
  );
}
