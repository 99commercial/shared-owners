import { useContext, useState } from 'react';
import { Lock } from 'lucide-react';
import { Field, TextInput } from '../../../components/FormFields';
import SectionForm, { SectionHeader } from './SectionForm';
import { EditorStepContext } from './editorContext';
import { clean, str } from './formUtils';

export default function ExtrasSection({ property, onSave, saving, readOnly }) {
  const { footer } = useContext(EditorStepContext);
  const x = property.extras || {};
  const [form, setForm] = useState({
    responderEmail: str(x.responderEmail),
    announcement: str(x.announcement),
    announcementEndDate: x.announcementEndDate ? x.announcementEndDate.slice(0, 10) : '',
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  if (!property.isPremium) {
    return (
      <div className="dash-card">
        <SectionHeader title="Extras" description="Premium options shown on the listing." />
        <div className="px-6 py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-brand-600" />
          </div>
          <h3 className="font-semibold text-ink">Premium feature</h3>
          <p className="text-sm text-gray-500 mt-1">Announcements and responder emails are available on premium listings only.</p>
        </div>
        {footer}
      </div>
    );
  }

  const submit = () =>
    onSave(
      clean({
        responderEmail: form.responderEmail.trim(),
        announcement: form.announcement.trim(),
        announcementEndDate: form.announcement.trim() ? form.announcementEndDate : undefined,
      }) || {}
    );

  return (
    <SectionForm
      title="Extras"
      description="Premium options shown on the listing."
      onSubmit={submit}
      saving={saving}
      readOnly={readOnly}
    >
      <Field label="Responder email" hint="Copied on every enquiry for this listing">
        <TextInput type="email" value={form.responderEmail} onChange={set('responderEmail')} />
      </Field>
      <Field label="Announcement" hint={`${form.announcement.length}/150 characters`}>
        <TextInput value={form.announcement} onChange={set('announcement')} maxLength={150} placeholder="e.g. Open day this Saturday" />
      </Field>
      <Field label="Hide announcement after">
        <TextInput type="date" value={form.announcementEndDate} onChange={set('announcementEndDate')} disabled={!form.announcement.trim()} />
      </Field>
    </SectionForm>
  );
}
