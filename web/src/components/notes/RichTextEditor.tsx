import { CharacterCount } from "@tiptap/extension-character-count";
import { Placeholder } from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useEffect, useMemo } from "react";
import { LinkIcon } from "@solar-icons/react/linear/link";
import { ListIcon } from "@solar-icons/react/linear/list";
import { ListCheckIcon } from "@solar-icons/react/linear/list-check";
import { TextBoldIcon } from "@solar-icons/react/linear/text-bold";
import { TextItalicIcon } from "@solar-icons/react/linear/text-italic";
import { TextUnderlineIcon } from "@solar-icons/react/linear/text-underline";
import { MdFormatBold, MdFormatItalic, MdFormatListBulleted, MdFormatListNumbered, MdFormatUnderlined, MdOutlineInsertLink } from "react-icons/md";

const TOOLBAR_BUTTON_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white/90 active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

// Hoisted (referência estável) pelo mesmo motivo do `extensions` memoizado
// abaixo — o useEditor do Tiptap recria a view sempre que esse objeto muda
// de referência entre renders.
const EDITOR_PROPS = {
  attributes: {
    class:
      "prose-notes min-h-56 w-full rounded-md border border-white/5 bg-card-input p-3 text-sm text-white/90 focus:outline-none",
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
  // Precisa ser memoizado: o useEditor do Tiptap compara `extensions` por
  // referência a cada render e chama `setOptions` (recriando a view/perdendo
  // foco) sempre que o array é uma instância nova — o que aconteceria em
  // todo render se essas extensões fossem recriadas inline aqui.
  const extensions = useMemo(
    () => [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // O Tiptap só aplica a opção `editable` na criação do editor — mudanças
    // posteriores precisam de `setEditable()` explícito, senão o editor fica
    // preso pra sempre no estado (des)habilitado inicial.
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    onWordCountChange?.(
      editor.storage.characterCount.words(),
      editor.storage.characterCount.characters(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="flex flex-wrap items-center gap-1 border-b border-white/5 pb-3">
        <button
          type="button"
          title="Negrito"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive("bold") ? "bg-white/10 text-white" : ""}`}
        >
          <MdFormatBold size={24} />
        </button>
        <button
          type="button"
          title="Itálico"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive("italic") ? "bg-white/10 text-white" : ""}`}
        >
          <MdFormatItalic size={24} />
        </button>
        <button
          type="button"
          title="Sublinhado"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive("underline") ? "bg-white/10 text-white" : ""}`}
        >
          <MdFormatUnderlined size={24} />
        </button>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button
          type="button"
          title="Lista"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive("bulletList") ? "bg-white/10 text-white" : ""}`}
        >
          <MdFormatListBulleted size={24} />
        </button>
        <button
          type="button"
          title="Lista numerada"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive("orderedList") ? "bg-white/10 text-white" : ""}`}
        >
          <MdFormatListNumbered size={24} />
        </button>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button
          type="button"
          title={editor.isActive("link") ? "Remover link" : "Adicionar link"}
          onClick={toggleLink}
          className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive("link") ? "bg-white/10 text-white" : ""}`}
        >
          <MdOutlineInsertLink size={24} />
        </button>
      </div>
      <EditorContent editor={editor} className="mt-3" />
    </div>
  );
}
