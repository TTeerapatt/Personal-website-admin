"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { useEffect } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Navy", value: "#0c2340" },
  { label: "Blue", value: "#1d4ed8" },
  { label: "Green", value: "#067647" },
  { label: "Red", value: "#b42318" },
  { label: "Orange", value: "#c2410c" },
  { label: "Gray", value: "#52657d" },
] as const;

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write content...",
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "rich-text-image",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: value || "",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
    editorProps: {
      attributes: {
        "data-placeholder": placeholder,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div className="rich-text-editor min-h-[200px] animate-pulse bg-[var(--surface-muted)]" />
    );
  }

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previous || "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  };

  const setImage = () => {
    const url = window.prompt("Image URL", "https://");
    if (!url || !url.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const currentColor =
    (editor.getAttributes("textStyle").color as string | undefined) || "";

  return (
    <div className={`rich-text-editor ${disabled ? "opacity-60" : ""}`}>
      <div className="rich-text-toolbar">
        <button
          type="button"
          className={editor.isActive("bold") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          className={editor.isActive("italic") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          className={editor.isActive("underline") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={disabled}
          title="Underline"
        >
          U
        </button>

        <span className="rich-text-toolbar-sep" />

        <button
          type="button"
          className={editor.isActive("bulletList") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          title="Bullet list"
        >
          • List
        </button>
        <button
          type="button"
          className={editor.isActive("orderedList") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          title="Ordered list"
        >
          1. List
        </button>
        <button
          type="button"
          className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={disabled}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          disabled={disabled}
          title="Heading 3"
        >
          H3
        </button>

        <span className="rich-text-toolbar-sep" />

        <button
          type="button"
          className={
            editor.isActive({ textAlign: "left" }) ? "is-active" : ""
          }
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          disabled={disabled}
          title="Align left"
        >
          Left
        </button>
        <button
          type="button"
          className={
            editor.isActive({ textAlign: "center" }) ? "is-active" : ""
          }
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          disabled={disabled}
          title="Align center"
        >
          Center
        </button>
        <button
          type="button"
          className={
            editor.isActive({ textAlign: "right" }) ? "is-active" : ""
          }
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          disabled={disabled}
          title="Align right"
        >
          Right
        </button>

        <span className="rich-text-toolbar-sep" />

        <label className="rich-text-color">
          <span>Color</span>
          <select
            value={currentColor}
            disabled={disabled}
            onChange={(e) => {
              const next = e.target.value;
              if (!next) {
                editor.chain().focus().unsetColor().run();
                return;
              }
              editor.chain().focus().setColor(next).run();
            }}
          >
            {TEXT_COLORS.map((color) => (
              <option key={color.label} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={editor.isActive("link") ? "is-active" : ""}
          onClick={setLink}
          disabled={disabled}
          title="Link"
        >
          Link
        </button>
        <button
          type="button"
          onClick={setImage}
          disabled={disabled}
          title="Insert image"
        >
          Image
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
