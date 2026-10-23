import { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Star, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { TextInput } from '../../../components/FormFields';
import { isHttpsUrl, fileNameFromUrl } from './formUtils';

function Thumb({ url }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300"><ImageOff className="w-6 h-6" /></div>;
  }
  return <img src={url} alt="" onError={() => setBroken(true)} className="w-full h-full object-cover" />;
}

/**
 * URL-based image list with captions, ordering and a single primary image.
 * `images` / `onChange` hold rows from formUtils.toGalleryRows.
 */
export default function ImageGalleryEditor({ images, onChange, max, readOnly, emptyText = 'No images yet' }) {
  const [newUrl, setNewUrl] = useState('');
  const setImages = (fn) => onChange(fn(images));

  const addImage = () => {
    const url = newUrl.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) return toast.error('Enter a valid image URL');
    if (images.some((img) => img.url === url)) return toast.error('That image is already in the list');
    if (images.length >= max) return toast.error(`A maximum of ${max} images is allowed`);
    setImages((list) => [...list, { url, caption: '', isPrimary: list.length === 0, fileName: fileNameFromUrl(url) }]);
    setNewUrl('');
  };

  const move = (index, delta) =>
    setImages((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const makePrimary = (index) => setImages((list) => list.map((img, i) => ({ ...img, isPrimary: i === index })));

  const remove = (index) =>
    setImages((list) => {
      const next = list.filter((_, i) => i !== index);
      if (list[index].isPrimary && next.length) next[0] = { ...next[0], isPrimary: true };
      return next;
    });

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex gap-2">
          <TextInput
            value={newUrl}
            onChange={setNewUrl}
            placeholder="https://… image URL (JPEG or PNG)"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
          />
          <button type="button" onClick={addImage} className="btn-brand-outline gap-1 text-sm shrink-0">
            <Plus className="w-4 h-4" /> Add image
          </button>
        </div>
      )}
      {newUrl && !isHttpsUrl(newUrl) && /^http:/i.test(newUrl) && (
        <p className="text-xs text-amber-600">Tip: https URLs are recommended so images load on secure pages.</p>
      )}

      {images.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-sm text-gray-400">{emptyText}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <div key={img.url} className={`rounded-xl border overflow-hidden ${img.isPrimary ? 'border-brand-400 ring-2 ring-brand-100' : 'border-gray-200'}`}>
              <div className="relative aspect-video bg-gray-50">
                <Thumb url={img.url} />
                {img.isPrimary && <span className="absolute top-2 left-2 badge bg-brand-500 text-white">Primary</span>}
              </div>
              <div className="p-3 space-y-2">
                <TextInput value={img.caption} onChange={(v) => setImages((list) => list.map((x, idx) => (idx === i ? { ...x, caption: v } : x)))} placeholder="Caption" maxLength={200} />
                {!readOnly && (
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => makePrimary(i)} title="Make primary" className={`p-1.5 rounded hover:bg-gray-100 ${img.isPrimary ? 'text-amber-500' : 'text-gray-400'}`}><Star className="w-4 h-4" fill={img.isPrimary ? 'currentColor' : 'none'} /></button>
                    </div>
                    <button type="button" onClick={() => remove(i)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
