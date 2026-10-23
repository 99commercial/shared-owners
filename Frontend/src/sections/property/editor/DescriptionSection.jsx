import { useState } from 'react';
import { Field, TextInput, NumberInput, TextArea, SelectInput } from '../../../components/FormFields';
import SectionForm, { FieldGroup } from './SectionForm';
import { clean, str, toNumber, textToHtml, htmlToText, linesToList, listToLines } from './formUtils';
import { PETS_ALLOWED, ACCESSIBILITY_STANDARDS } from '../../../data/propertyOptions';

const initial = (d = {}) => ({
  summary: str(d.summary),
  description: htmlToText(d.description),
  keyFeatures: listToLines(d.keyFeatures),
  bedrooms: str(d.bedrooms),
  bathrooms: str(d.bathrooms),
  petsAllowed: str(d.petsAllowed),
  accessibility: str(d.accessibility),
});

export default function DescriptionSection({ property, onSave, saving, readOnly }) {
  const [form, setForm] = useState(() => initial(property.description || {}));
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () =>
    onSave(
      clean({
        summary: form.summary.trim(),
        description: textToHtml(form.description),
        keyFeatures: linesToList(form.keyFeatures),
        bedrooms: toNumber(form.bedrooms),
        bathrooms: toNumber(form.bathrooms),
        petsAllowed: form.petsAllowed,
        accessibility: form.accessibility,
      }) || {}
    );

  return (
    <SectionForm
      title="Description"
      description="What buyers read on the listing page."
      onSubmit={submit}
      saving={saving}
      readOnly={readOnly}
    >
      <Field label="Summary" required hint={`${form.summary.length}/200 characters`}>
        <TextInput value={form.summary} onChange={set('summary')} maxLength={200} placeholder="One-line headline for search results" />
      </Field>
      <Field label="Full description" required hint="Separate paragraphs with a blank line">
        <TextArea value={form.description} onChange={set('description')} rows={8} maxLength={20000} />
      </Field>
      <Field label="Key features" hint="One feature per line">
        <TextArea value={form.keyFeatures} onChange={set('keyFeatures')} rows={5} placeholder={'Private balcony\nOpen-plan kitchen\nClose to station'} />
      </Field>
      <FieldGroup cols={2}>
        <Field label="Bedrooms" required hint="0 = studio">
          <NumberInput value={form.bedrooms} onChange={set('bedrooms')} min={0} max={20} step={1} />
        </Field>
        <Field label="Bathrooms" required>
          <NumberInput value={form.bathrooms} onChange={set('bathrooms')} min={0} max={20} step={1} />
        </Field>
        <Field label="Pets allowed">
          <SelectInput value={form.petsAllowed} onChange={set('petsAllowed')} options={PETS_ALLOWED} />
        </Field>
        <Field label="Accessibility standard">
          <SelectInput value={form.accessibility} onChange={set('accessibility')} options={ACCESSIBILITY_STANDARDS} />
        </Field>
      </FieldGroup>
    </SectionForm>
  );
}
