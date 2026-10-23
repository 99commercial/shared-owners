import { useState } from 'react';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Field, TextInput, SelectInput } from '../../../components/FormFields';
import SectionForm, { FieldGroup } from './SectionForm';
import { clean, str, isHttpsUrl } from './formUtils';
import { VIDEO_PROVIDERS } from '../../../data/propertyOptions';

export default function VideoTourSection({ property, onSave, saving, readOnly }) {
  const v = property.videoTour || {};
  const [form, setForm] = useState({
    videoProvider: v.videoProvider || 'none',
    videoUrl: str(v.videoUrl),
    virtualTourSupplier: str(v.virtualTourSupplier),
    virtualTourUrl: str(v.virtualTourUrl),
    walklyTourUrl: str(v.walklyTourUrl),
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (form.videoProvider !== 'none' && !form.videoUrl.trim()) {
      return toast.error('Video URL is required for the selected provider');
    }
    const urls = ['videoUrl', 'virtualTourUrl', 'walklyTourUrl'].filter((k) => form[k].trim());
    const bad = urls.find((k) => !isHttpsUrl(form[k].trim()));
    if (bad) return toast.error('All URLs must start with https://');

    onSave(
      clean({
        videoProvider: form.videoProvider,
        videoUrl: form.videoProvider === 'none' ? undefined : form.videoUrl.trim(),
        virtualTourSupplier: form.virtualTourSupplier.trim(),
        virtualTourUrl: form.virtualTourUrl.trim(),
        walklyTourUrl: property.isPremium ? form.walklyTourUrl.trim() : undefined,
      }) || {}
    );
  };

  return (
    <SectionForm
      title="Virtual Tours"
      description="Optional. Links must be https URLs."
      onSubmit={submit}
      saving={saving}
      readOnly={readOnly}
    >
      <FieldGroup title="Video" description="A hosted video walkthrough">
        <Field label="Provider">
          <SelectInput value={form.videoProvider} onChange={set('videoProvider')} options={VIDEO_PROVIDERS} placeholder="Choose…" />
        </Field>
        {form.videoProvider !== 'none' && (
          <Field label="Video URL" required>
            <TextInput value={form.videoUrl} onChange={set('videoUrl')} placeholder="https://www.youtube.com/watch?v=…" />
          </Field>
        )}
      </FieldGroup>

      <FieldGroup title="Virtual Tour" description="360° or interactive tour links">
        <Field label="Supplier">
          <TextInput value={form.virtualTourSupplier} onChange={set('virtualTourSupplier')} placeholder="e.g. Matterport" />
        </Field>
        <Field label="Tour URL" hint="Only the src URL from the embed code">
          <TextInput value={form.virtualTourUrl} onChange={set('virtualTourUrl')} placeholder="https://…" />
        </Field>
      </FieldGroup>

      <Field label="Walkly tour URL" floating={property.isPremium}>
        {property.isPremium ? (
          <TextInput value={form.walklyTourUrl} onChange={set('walklyTourUrl')} placeholder="https://…" />
        ) : (
          <p className="text-sm text-gray-400 flex items-center gap-2"><Lock className="w-4 h-4" /> Available on premium listings only.</p>
        )}
      </Field>
    </SectionForm>
  );
}
