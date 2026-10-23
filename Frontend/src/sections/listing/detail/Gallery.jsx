import { useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, Images, ImageOff } from 'lucide-react';
import Lightbox from './Lightbox';

/** Large photo with two smaller ones beside it, like the reference design; any photo opens the viewer */
export default function Gallery({ images, title, label }) {
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(null);
  const count = images.length;

  if (!count) {
    return (
      <div className="aspect-[21/9] rounded-2xl border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center text-gray-400">
        <ImageOff className="w-10 h-10" />
        <p className="text-sm mt-2">Photos coming soon</p>
      </div>
    );
  }

  const current = images[index];
  const side = images.filter((_, i) => i !== index).slice(0, 2);
  const sideIndex = (img) => images.indexOf(img);
  const go = (step) => setIndex((i) => (i + step + count) % count);

  return (
    <>
      <div className={`grid gap-3 ${side.length ? 'lg:grid-cols-[2fr_1fr]' : ''}`}>
        <div className="relative group aspect-[16/10] lg:aspect-auto lg:h-[460px] 2xl:h-[560px] rounded-2xl overflow-hidden bg-gray-900">
          <button type="button" onClick={() => setViewer(index)} className="absolute inset-0 w-full h-full" aria-label="Open photo viewer">
            <img src={current.url} alt={current.caption || title} className="w-full h-full object-cover" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />
          <span className="pointer-events-none absolute top-4 left-4 px-2.5 py-1 rounded-md bg-black/60 text-xs font-bold text-white">{index + 1} / {count}</span>
          <p className="pointer-events-none absolute bottom-4 left-4 right-28 text-white font-bold drop-shadow truncate">{current.caption || label}</p>
          {count > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button type="button" onClick={() => go(-1)} className="w-9 h-9 rounded-full bg-white/90 text-ink flex items-center justify-center shadow hover:bg-white" aria-label="Previous photo"><ChevronLeft className="w-4 h-4" /></button>
              <button type="button" onClick={() => go(1)} className="w-9 h-9 rounded-full bg-white/90 text-ink flex items-center justify-center shadow hover:bg-white" aria-label="Next photo"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
          <button type="button" onClick={() => setViewer(index)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Full screen"><Expand className="w-4 h-4" /></button>
        </div>

        {side.length > 0 && (
          <div className="hidden lg:grid grid-rows-2 gap-3 h-[460px] 2xl:h-[560px]">
            {side.map((img, i) => {
              const isLast = i === side.length - 1 && count > 2;
              return (
                <button
                  key={`${img.url}-${i}`}
                  type="button"
                  onClick={() => (isLast ? setViewer(sideIndex(img)) : setIndex(sideIndex(img)))}
                  aria-label={isLast ? `View all ${count} photos` : `Show photo ${sideIndex(img) + 1}`}
                  className="relative rounded-2xl overflow-hidden bg-gray-900 group"
                >
                  <img src={img.url} alt={img.caption || title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {isLast && (
                    <span className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                      <Images className="w-6 h-6" />
                      <span className="text-sm font-bold mt-1">View all {count} photos</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {viewer !== null && <Lightbox images={images} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} title={title} />}
    </>
  );
}
