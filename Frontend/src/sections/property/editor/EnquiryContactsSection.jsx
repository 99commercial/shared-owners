import { useState } from 'react';
import { Field, TextInput } from '../../../components/FormFields';
import SectionForm, { FieldGroup } from './SectionForm';
import { clean, str } from './formUtils';

export default function EnquiryContactsSection({ property, onSave, saving, readOnly }) {
  const c = property.enquiryContacts || {};
  const [form, setForm] = useState({ salesTelephone: str(c.salesTelephone), salesEmail: str(c.salesEmail) });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () =>
    onSave(clean({ salesTelephone: form.salesTelephone.trim(), salesEmail: form.salesEmail.trim() }) || {});

  return (
    <SectionForm
      title="Enquiry Contacts"
      description="Optional. Leave blank to use the contact details on your profile."
      onSubmit={submit}
      saving={saving}
      readOnly={readOnly}
    >
      <FieldGroup>
        <Field label="Sales telephone">
          <TextInput type="tel" value={form.salesTelephone} onChange={set('salesTelephone')} placeholder="+44 20 1234 5678" />
        </Field>
        <Field label="Sales email">
          <TextInput type="email" value={form.salesEmail} onChange={set('salesEmail')} />
        </Field>
      </FieldGroup>
    </SectionForm>
  );
}
