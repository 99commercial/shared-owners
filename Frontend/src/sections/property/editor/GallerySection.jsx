import { useState } from 'react';
import SectionForm from './SectionForm';
import ImageGalleryEditor from './ImageGalleryEditor';
import { toGalleryRows, toGalleryBody } from './formUtils';
import { MAX_GALLERY_IMAGES } from '../../../data/propertyOptions';

export default function GallerySection({ property, onSave, saving, readOnly }) {
  const [images, setImages] = useState(() => toGalleryRows(property.gallery?.images));

  return (
    <SectionForm
      title="Images"
      description={`At least one image is required. The starred image is shown in search results (max ${MAX_GALLERY_IMAGES}).`}
      onSubmit={() => onSave({ images: toGalleryBody(images) })}
      saving={saving}
      readOnly={readOnly}
    >
      <ImageGalleryEditor images={images} onChange={setImages} max={MAX_GALLERY_IMAGES} readOnly={readOnly} />
    </SectionForm>
  );
}
