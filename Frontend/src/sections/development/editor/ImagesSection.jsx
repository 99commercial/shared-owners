import { useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import SectionForm, { FieldGroup } from '../../property/editor/SectionForm';
import DocumentRow from '../../property/editor/DocumentRow';
import ImageGalleryEditor from '../../property/editor/ImageGalleryEditor';
import { toGalleryRows, toGalleryBody, toDocRow, toDocBody } from '../../property/editor/formUtils';
import { MAX_BANNER_IMAGES, MAX_DEVELOPMENT_IMAGES } from '../../../data/developmentOptions';

export default function ImagesSection({ development, onSave, saving, readOnly }) {
  const tab = development.images || {};
  const [banners, setBanners] = useState(() =>
    [...(tab.bannerImages || [])].sort((a, b) => (a.order || 0) - (b.order || 0)).map(toDocRow)
  );
  const [images, setImages] = useState(() => toGalleryRows(tab.images));

  const submit = () => {
    const urls = banners.map((b) => b.url.trim()).filter(Boolean);
    if (urls.some((u) => !/^https?:\/\/\S+$/i.test(u))) return toast.error('Every banner needs a valid image URL');
    onSave({
      bannerImages: banners.map(toDocBody).filter(Boolean).map((b, i) => ({ ...b, order: i })),
      images: toGalleryBody(images),
    });
  };

  return (
    <SectionForm
      title="Images"
      description="Wide banners for the top of the development page, and a gallery. The starred gallery image is used in search results."
      onSubmit={submit}
      saving={saving}
      readOnly={readOnly}
    >
      <FieldGroup title={`Banner Images (max ${MAX_BANNER_IMAGES})`} description="Landscape images, ideally 1920 × 600 or larger" cols={1}>
        {banners.length === 0 && <p className="text-sm text-gray-400">No banners added.</p>}
        {banners.map((doc, i) => (
          <DocumentRow
            key={i}
            label={`Banner ${i + 1}`}
            doc={doc}
            readOnly={readOnly}
            onChange={(next) => setBanners((list) => list.map((x, idx) => (idx === i ? next : x)))}
            onRemove={() => setBanners((list) => list.filter((_, idx) => idx !== i))}
          />
        ))}
        {!readOnly && banners.length < MAX_BANNER_IMAGES && (
          <button type="button" onClick={() => setBanners((list) => [...list, { url: '', fileName: '' }])} className="btn-brand-outline w-fit">
            <Plus className="w-4 h-4" /> Add banner
          </button>
        )}
      </FieldGroup>

      <FieldGroup title={`Gallery (max ${MAX_DEVELOPMENT_IMAGES})`} description="Photos and CGIs of the development" cols={1}>
        <ImageGalleryEditor images={images} onChange={setImages} max={MAX_DEVELOPMENT_IMAGES} readOnly={readOnly} />
      </FieldGroup>
    </SectionForm>
  );
}
