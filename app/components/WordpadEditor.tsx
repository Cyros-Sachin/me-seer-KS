import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  Mic,
  Heading1,
  Heading2,
  Heading3,
  ListOrdered,
  List,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image as ImageIcon,
  Strikethrough,
  Code,
  Quote,
  Undo2,
  Redo2,
  TextCursorInput,
  CheckSquare,
  ListChecks
} from 'lucide-react';

interface WordpadEditorProps {
  content?: string;
  onSave?: (updatedHtml: string) => void;
  onVoiceInput?: (transcript: string) => void; // Change this to pass the transcript
  editable?: boolean;
}

export const WordpadEditor: React.FC<WordpadEditorProps> = ({
  content = '',
  onSave = () => { },
  onVoiceInput = () => { },
  editable = true,
}) => {
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [interimText, setInterimText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkUrlInput, setShowLinkUrlInput] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event: any) => {
          const results = event.results;
          const lastResult = results[results.length - 1];
          const transcript = lastResult[0].transcript;

          if (lastResult.isFinal) {
            editor?.chain().focus().insertContent(transcript + ' ').run();
            setInterimText(''); // clear floating preview
          } else {
            setInterimText(transcript); // update live floating text
          }

          onVoiceInput(transcript);
        };



        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          if (isListening) {
            recognitionInstance.start();
          }
        };

        recognitionRef.current = recognitionInstance;
      }
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleVoiceInput = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc pl-6',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal pl-6',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'pl-6',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start',
        },
        nested: true,
      }),
      ListItem,
      Placeholder.configure({
        placeholder: 'Start typing here...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        validate: (href) => /^https?:\/\//.test(href),
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'focus:outline-none max-w-full px-4 py-3 min-h-[150px] relative',
      },
    },
    onUpdate: ({ editor }) => {
      onSave(editor.getHTML());
    },
    editable,
    immediatelyRender: false,
  });

  const addImage = useCallback(() => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageUrlInput(false);
    }
  }, [editor, imageUrl]);

  const setLink = useCallback(() => {
    if (linkUrl) {
      // If text is selected, use that as the link text
      if (editor?.state.selection.empty) {
        // No text selected, use the provided link text
        editor
          ?.chain()
          .focus()
          .insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText || linkUrl}</a>`)
          .run();
      } else {
        // Text is selected, make it a link
        editor
          ?.chain()
          .focus()
          .toggleLink({ href: linkUrl, target: '_blank' })
          .run();
      }
      setLinkUrl('');
      setLinkText('');
      setShowLinkUrlInput(false);
    }
  }, [editor, linkUrl, linkText]);

  if (!editor) return null;

  const json = editor.getJSON();
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('Heading') ? 'bg-gray-200' : ''}`}
          title='Heading'
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="h-6 border-l border-gray-300 mx-1"></div>

        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
          title="Align left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
          title="Align center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
          title="Align right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="h-6 border-l border-gray-300 mx-1"></div>

        <button
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run();
            } else {
              setShowLinkUrlInput(true);
              setLinkText(editor.state.selection.content().content.firstChild?.text || '');
            }
          }}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
          title="Link"
        >
          <Link2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowImageUrlInput(true)}
          className="p-2 rounded hover:bg-gray-200"
          title="Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <div className="h-6 border-l border-gray-300 mx-1"></div>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('taskList') ? 'bg-gray-200' : ''}`}
          title="Task List"
        >
          <ListChecks className="w-4 h-4" />
        </button>

        <div className="h-6 border-l border-gray-300 mx-1"></div>

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
          title="Code block"
        >
          <Code className="w-4 h-4" />
        </button>

        <button
          onClick={toggleVoiceInput}
          className={`p-2 rounded hover:bg-gray-200 ${isListening ? 'bg-red-200' : ''}`}
          title={isListening ? 'Stop voice input' : 'Start voice input'}
        >
          <Mic className={`w-4 h-4 ${isListening ? 'text-red-600' : ''}`} />
        </button>

        <div className="h-6 border-l border-gray-300 mx-1"></div>

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Link input dialog */}
      {showLinkUrlInput && (
        <div className="absolute z-20 bg-white p-4 rounded shadow-lg border" style={{ top: '60px', left: '50%', transform: 'translateX(-50%)' }}>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="border p-2 rounded w-full"
                autoFocus
              />
            </div>
            {editor?.state.selection.empty && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                  className="border p-2 rounded w-full"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setLinkUrl('');
                setLinkText('');
                setShowLinkUrlInput(false);
              }}
              className="px-3 py-1 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={setLink}
              disabled={!linkUrl}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Image input dialog */}
      {showImageUrlInput && (
        <div className="absolute z-20 bg-white p-4 rounded shadow-lg border" style={{ top: '60px', left: '50%', transform: 'translateX(-50%)' }}>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="border p-2 rounded w-full mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setImageUrl('');
                setShowImageUrlInput(false);
              }}
              className="px-3 py-1 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={addImage}
              disabled={!imageUrl}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Insert
            </button>
          </div>
        </div>
      )}

      {/* Editor content */}
      <div className="editor-content relative space-y-2 p-4 bg-white">
        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="flex bg-white shadow-lg rounded-lg border overflow-hidden">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-100' : ''}`}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-100' : ''}`}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-2 hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-gray-100' : ''}`}
              >
                <UnderlineIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (editor.isActive('link')) {
                    editor.chain().focus().unsetLink().run();
                  } else {
                    setShowLinkUrlInput(true);
                    setLinkText(editor.state.selection.content().content.firstChild?.text || '');
                  }
                }}
                className={`p-2 hover:bg-gray-100 ${editor.isActive('link') ? 'bg-gray-100' : ''}`}
              >
                <Link2 className="w-4 h-4" />
              </button>
            </div>
          </BubbleMenu>
        )}

        {json.content?.map((block: any, idx: number) => (
          <div
            key={idx}
            className="group flex items-start gap-2 w-full relative"

          >
            <div className="flex-1">
              {/* Only render the actual editable content once */}
              {idx === 0 && <EditorContent editor={editor} />}
            </div>
          </div>
        ))}
        {isListening && interimText && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded shadow border z-50 text-sm opacity-80 pointer-events-none animate-pulse">
            {interimText}
          </div>
        )}

      </div>
    </div>
  );
};