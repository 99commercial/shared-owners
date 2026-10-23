import { useRef, useState } from 'react';
import { User, Loader2, Camera, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const SHAPES = {
  circle: { frame: 'rounded-full', image: 'object-cover' },
  square: { frame: 'rounded-2xl', image: 'object-contain p-2' },
};

/**
 * Uploads as soon as a file is picked.
 * upload = mutation taking { file, onProgress }; remove = mutation with no variables.
 */
export default function PhotoUploader({
  currentUrl, upload, remove, shape = 'circle', icon: Icon = User, noun = 'Photo', description, label,
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const busy = upload.isPending || remove.isPending;
  const styles = SHAPES[shape];

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) return toast.error('Choose a JPG, PNG or WEBP image');
    if (file.size > MAX_PHOTO_BYTES) return toast.error('Image must be 5 MB or smaller');

    const url = URL.createObjectURL(file);
    setPreview(url);
    setProgress(0);
    upload.mutate(
      { file, onProgress: setProgress },
      { onSettled: () => { URL.revokeObjectURL(url); setPreview(null); } }
    );
  };

  const shown = preview || currentUrl;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={`group relative w-28 h-28 ${styles.frame} bg-gray-100 ring-4 ring-brand-100 overflow-hidden flex items-center justify-center shrink-0`}
        aria-label={label || `Upload ${noun.toLowerCase()}`}
      >
        {shown ? <img src={shown} alt="" className={`w-full h-full ${styles.image}`} /> : <Icon className="w-12 h-12 text-gray-300" />}
        <span className={`absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-white text-xs font-semibold transition-opacity ${busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {upload.isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin mb-1" />{progress < 100 ? `${progress}%` : 'Saving…'}</>
          ) : remove.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <><Camera className="w-5 h-5 mb-1" />Change</>
          )}
        </span>
      </button>

      <div className="flex-1 text-center sm:text-left">
        {description && <p className="text-sm text-gray-600">{description}</p>}
        <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP, up to 5 MB</p>
        <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn-brand">
            <Upload className="w-4 h-4" /> {currentUrl ? `Upload New ${noun}` : `Upload ${noun}`}
          </button>
          {currentUrl && (
            <button type="button" onClick={() => remove.mutate()} disabled={busy} className="btn-brand-outline">
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept={PHOTO_TYPES.join(',')} onChange={pick} className="hidden" />
    </div>
  );
}
