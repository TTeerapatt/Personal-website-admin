"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState } from "react";
import {
  FiAlignCenter,
  FiAlignLeft,
  FiAlignRight,
  FiBold,
  FiChevronDown,
  FiImage,
  FiItalic,
  FiList,
  FiUnderline,
} from "react-icons/fi";
import { MdFormatListNumbered } from "react-icons/md";
import apiServices from "@/app/services/apiServices";
import { validateOrThrowApiResponse } from "@/app/services/response-validator";
import { popup } from "@/app/ui/popUp";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  uploadFolder?: string;
};

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Navy", value: "#0b1f3a" },
  { label: "Blue", value: "#1d4ed8" },
  { label: "Green", value: "#067647" },
  { label: "Red", value: "#b42318" },
  { label: "Orange", value: "#c2410c" },
  { label: "Gray", value: "#52657d" },
] as const;

const MAX_FILE_BYTES = 5 * 1024 * 1024;

async function uploadEditorImage(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiServices.post(`upload`, formData, {
    params: { folder },
    headers: { Accept: "application/json" },
  });
  const result = validateOrThrowApiResponse(res) as {
    data?: { url?: string };
  };
  const url = String(result?.data?.url || "").trim();
  if (!url) throw new Error("Upload did not return a file URL");
  return url;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write content...",
  disabled = false,
  minHeight = 180,
  uploadFolder = "misc",
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const colorMenuRef = useRef<HTMLDivElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);

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
      Placeholder.configure({
        placeholder,
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
        style: `min-height: ${minHeight}px`,
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
    editor.setEditable(!disabled && !uploadingImage);
  }, [disabled, editor, uploadingImage]);

  useEffect(() => {
    if (!colorMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!colorMenuRef.current?.contains(event.target as Node)) {
        setColorMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setColorMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [colorMenuOpen]);

  if (!editor) {
    return (
      <div
        className="rich-text-editor animate-pulse bg-[var(--surface-muted)]"
        style={{ minHeight: minHeight + 56 }}
      />
    );
  }

  const applyColor = (next: string) => {
    const chain = editor.chain().focus();
    if (!next) {
      chain.unsetColor().run();
    } else {
      chain.setColor(next).run();
    }
    setColorMenuOpen(false);
  };

  const handlePickImage = async (file: File | null) => {
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      await popup.warning("File too large", "File size must not exceed 5MB");
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }

    if (!file.type.toLowerCase().startsWith("image/")) {
      await popup.warning("Invalid file", "Please upload an image file");
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadEditorImage(file, uploadFolder);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err: unknown) {
      const message =
        (err as { message?: string; errMessage?: string })?.message ||
        (err as { errMessage?: string })?.errMessage ||
        "Unable to upload image";
      await popup.error("Upload failed", message);
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const currentColor =
    (editor.getAttributes("textStyle").color as string | undefined) || "";
  const currentColorLabel =
    TEXT_COLORS.find((color) => color.value === currentColor)?.label ||
    "Default";
  const controlsDisabled = disabled || uploadingImage;

  return (
    <div className={`rich-text-editor ${disabled ? "opacity-60" : ""}`}>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => void handlePickImage(e.target.files?.[0] ?? null)}
      />

      <div className="rich-text-toolbar">
        <button
          type="button"
          className={editor.isActive("bold") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={controlsDisabled}
          title="Bold"
          aria-label="Bold"
        >
          <FiBold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={editor.isActive("italic") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={controlsDisabled}
          title="Italic"
          aria-label="Italic"
        >
          <FiItalic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={editor.isActive("underline") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={controlsDisabled}
          title="Underline"
          aria-label="Underline"
        >
          <FiUnderline className="h-3.5 w-3.5" />
        </button>

        <span className="rich-text-toolbar-sep" />

        <button
          type="button"
          className={editor.isActive("bulletList") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={controlsDisabled}
          title="Bullet list"
          aria-label="Bullet list"
        >
          <FiList className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={editor.isActive("orderedList") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={controlsDisabled}
          title="Ordered list"
          aria-label="Ordered list"
        >
          <MdFormatListNumbered className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={controlsDisabled}
          title="Heading 2"
          aria-label="Heading 2"
        >
          <span className="text-[11px] font-bold leading-none">H2</span>
        </button>
        <button
          type="button"
          className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          disabled={controlsDisabled}
          title="Heading 3"
          aria-label="Heading 3"
        >
          <span className="text-[11px] font-bold leading-none">H3</span>
        </button>

        <span className="rich-text-toolbar-sep" />

        <button
          type="button"
          className={
            editor.isActive({ textAlign: "left" }) ? "is-active" : ""
          }
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          disabled={controlsDisabled}
          title="Align left"
          aria-label="Align left"
        >
          <FiAlignLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={
            editor.isActive({ textAlign: "center" }) ? "is-active" : ""
          }
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          disabled={controlsDisabled}
          title="Align center"
          aria-label="Align center"
        >
          <FiAlignCenter className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={
            editor.isActive({ textAlign: "right" }) ? "is-active" : ""
          }
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          disabled={controlsDisabled}
          title="Align right"
          aria-label="Align right"
        >
          <FiAlignRight className="h-3.5 w-3.5" />
        </button>

        <span className="rich-text-toolbar-sep" />

        <div className="rich-text-color-menu" ref={colorMenuRef}>
          <button
            type="button"
            className={`rich-text-color-trigger ${
              colorMenuOpen ? "is-open" : ""
            }`}
            disabled={controlsDisabled}
            aria-haspopup="listbox"
            aria-expanded={colorMenuOpen}
            aria-label="Text color"
            title="Text color"
            onClick={() => setColorMenuOpen((prev) => !prev)}
          >
            <span
              className={`rich-text-color-dot ${
                currentColor ? "" : "is-default"
              }`}
              style={
                currentColor ? { backgroundColor: currentColor } : undefined
              }
            />
            <span className="rich-text-color-label">{currentColorLabel}</span>
            <FiChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </button>

          {colorMenuOpen ? (
            <div className="rich-text-color-dropdown" role="listbox">
              {TEXT_COLORS.map((color) => {
                const active = currentColor === color.value;
                return (
                  <button
                    key={color.label}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`rich-text-color-option ${
                      active ? "is-active" : ""
                    }`}
                    onClick={() => applyColor(color.value)}
                  >
                    <span
                      className={`rich-text-color-dot ${
                        color.value ? "" : "is-default"
                      }`}
                      style={
                        color.value
                          ? { backgroundColor: color.value }
                          : undefined
                      }
                    />
                    <span>{color.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={controlsDisabled}
          title={uploadingImage ? "Uploading..." : "Upload image"}
          aria-label="Upload image"
        >
          <FiImage className="h-3.5 w-3.5" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
