import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/** Full-screen photo viewer. Arrow keys move, Escape closes. */
export default function Lightbox({ images, index, onIndex, onClose, title }) {
  const count = images.length;
  const go = (step) => onIndex((index + step + count) % count);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((i) => (i + 1) % count);
      if (e.key === 'ArrowLeft') onIndex((i) => (i - 1 + count) % count);
    };
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [count, onClose, onIndex]);

  const image = images[index];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 text-white" role="dialog" aria-modal="true" aria-label={`${title} photos`}>
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        <p className="text-sm font-semibold truncate">{title}</p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/70">{index + 1} / {count}</span>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 sm:px-16">
        <img src={image.url} alt={image.caption || title} className="max-h-full max-w-full object-contain rounded-lg" />
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute left-2 sm:left-5 p-3 rounded-full bg-white/10 hover:bg-white/20" aria-label="Previous photo"><ChevronLeft className="w-6 h-6" /></button>
            <button type="button" onClick={() => go(1)} className="absolute right-2 sm:right-5 p-3 rounded-full bg-white/10 hover:bg-white/20" aria-label="Next photo"><ChevronRight className="w-6 h-6" /></button>
          </>
        )}
      </div>

      {image.caption && <p className="text-center text-sm text-white/80 px-4 pt-3">{image.caption}</p>}

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 sm:px-6 py-4 justify-start sm:justify-center">
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => onIndex(i)}
              className={`shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-opacity ${i === index ? 'border-white' : 'border-transparent opacity-50 hover:opacity-90'}`}
              aria-label={`Photo ${i + 1}`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
