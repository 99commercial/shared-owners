import { useState } from 'react';
import { Field, TextInput } from '../../../components/FormFields';
import SectionForm from './SectionForm';
import { clean, str } from './formUtils';

export default function ExtrasSection({ property, onSave, saving, readOnly }) {
  const x = property.extras || {};
  const [form, setForm] = useState({
    responderEmail: str(x.responderEmail),
    announcement: str(x.announcement),
    announcementEndDate: x.announcementEndDate ? x.announcementEndDate.slice(0, 10) : '',
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

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
      description="Announcements and enquiry routing for this listing."
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
