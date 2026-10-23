import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bold, Italic, Underline, Strikethrough, Heading2, Heading3, Pilcrow, Quote, List, ListOrdered, Link2, Unlink,
  ImagePlus, Minus, Undo2, Redo2, RemoveFormatting, Loader2,
} from 'lucide-react';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const TOOLS = [
  [
    { icon: Bold, label: 'Bold', run: () => document.execCommand('bold') },
    { icon: Italic, label: 'Italic', run: () => document.execCommand('italic') },
    { icon: Underline, label: 'Underline', run: () => document.execCommand('underline') },
    { icon: Strikethrough, label: 'Strikethrough', run: () => document.execCommand('strikeThrough') },
  ],
  [
    { icon: Heading2, label: 'Heading', run: () => document.execCommand('formatBlock', false, 'h2') },
    { icon: Heading3, label: 'Subheading', run: () => document.execCommand('formatBlock', false, 'h3') },
    { icon: Pilcrow, label: 'Paragraph', run: () => document.execCommand('formatBlock', false, 'p') },
    { icon: Quote, label: 'Quote', run: () => document.execCommand('formatBlock', false, 'blockquote') },
  ],
  [
    { icon: List, label: 'Bulleted list', run: () => document.execCommand('insertUnorderedList') },
    { icon: ListOrdered, label: 'Numbered list', run: () => document.execCommand('insertOrderedList') },
    { icon: Minus, label: 'Divider', run: () => document.execCommand('insertHorizontalRule') },
  ],
  [
    {
      icon: Link2,
      label: 'Link',
      run: () => {
        const url = window.prompt('Link address (https://…, mailto: or tel:)');
        if (!url) return;
        if (!/^(https:\/\/|mailto:|tel:)/i.test(url.trim())) {
          toast.error('Links must start with https://, mailto: or tel:');
          return;
        }
        document.execCommand('createLink', false, url.trim());
      },
    },
    { icon: Unlink, label: 'Remove link', run: () => document.execCommand('unlink') },
    { icon: RemoveFormatting, label: 'Clear formatting', run: () => document.execCommand('removeFormat') },
  ],
  [
    { icon: Undo2, label: 'Undo', run: () => document.execCommand('undo') },
    { icon: Redo2, label: 'Redo', run: () => document.execCommand('redo') },
  ],
];

/**
 * Minimal WYSIWYG for blog articles. Produces the HTML the backend keeps
 * (headings, lists, quotes, links, https images, dividers); anything else is
 * stripped server-side. `uploadImage(file)` must resolve to the image URL.
 * The content is read once on mount, so remount (key) to load another post.
 */
export default function RichTextEditor({ value, onChange, uploadImage, placeholder = 'Start writing…' }) {
  const editorRef = useRef(null);
  const fileRef = useRef(null);
  const rangeRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value || '';
    document.execCommand('defaultParagraphSeparator', false, 'p');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => onChange(editorRef.current.innerHTML);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current.contains(selection.anchorNode)) {
      rangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    editorRef.current.focus();
    const selection = window.getSelection();
    if (rangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(rangeRef.current);
    }
  };

  const run = (tool) => {
    restoreSelection();
    tool.run();
    emit();
  };

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return toast.error('Choose a JPG, PNG or WEBP image');
    if (file.size > MAX_IMAGE_BYTES) return toast.error('Image must be 5 MB or smaller');
    setUploading(true);
    try {
      const url = await uploadImage(file);
      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      restoreSelection();
      document.execCommand('insertHTML', false, `<img src="${url}" alt="${alt.replace(/"/g, '')}"><p><br></p>`);
      emit();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload the image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-300 focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-500/15 overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5 sticky top-0 z-10">
        {TOOLS.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5 pr-1 mr-1 border-r border-gray-200 last:border-0">
            {group.map((tool) => (
              <button
                key={tool.label}
                type="button"
                title={tool.label}
                aria-label={tool.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(tool)}
                className="p-1.5 rounded-md text-gray-600 hover:bg-white hover:text-brand-700 hover:shadow-sm"
              >
                <tool.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        ))}
        {uploadImage && (
          <button
            type="button"
            title="Insert image"
            disabled={uploading}
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold text-gray-600 hover:bg-white hover:text-brand-700 hover:shadow-sm disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            Image
          </button>
        )}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={() => { saveSelection(); emit(); }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        className="article-body min-h-[420px] max-h-[70vh] overflow-y-auto px-6 py-5 focus:outline-none"
      />
      <input ref={fileRef} type="file" accept={IMAGE_TYPES.join(',')} onChange={pickImage} className="hidden" />
    </div>
  );
}
