'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import SlashCommand, { getSuggestionItems, renderItems } from './slash-command';
import { useEffect } from 'react';

interface SlashCommandEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
}

export default function SlashCommandEditor({ initialContent, onChange }: SlashCommandEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Press / for commands, or start typing...',
        emptyEditorClass: 'is-editor-empty',
      }),
      SlashCommand.configure({
        suggestion: {
          items: getSuggestionItems,
          render: renderItems,
        },
      }),
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm sm:prose-base focus:outline-none min-h-[25rem] w-full max-w-none text-zinc-300',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Re-sync initialContent if it changes externally
  useEffect(() => {
    if (editor && initialContent !== undefined && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  return (
    <div className="relative w-full h-full">
      <EditorContent editor={editor} className="w-full h-full tiptap-editor" />
      <style jsx global>{`
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #52525b;
          pointer-events: none;
          height: 0;
        }
        .tiptap-editor .ProseMirror h1 { font-size: 2.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 1rem; color: #fff; }
        .tiptap-editor .ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #fff; }
        .tiptap-editor .ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; color: #fff; }
        .tiptap-editor .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
        .tiptap-editor .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
        .tiptap-editor .ProseMirror pre { background: #18181b; padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.1); font-family: monospace; }
        .tiptap-editor .ProseMirror code { background: #18181b; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875em; }
        .tiptap-editor .ProseMirror blockquote { border-left: 3px solid #10B981; padding-left: 1rem; color: #a1a1aa; font-style: italic; margin-top: 1rem; margin-bottom: 1rem; }
      `}</style>
    </div>
  );
}
