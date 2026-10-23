import { useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Field, TextInput, TextArea, SelectInput } from '../../../components/FormFields';
import SectionForm, { FieldGroup } from '../../property/editor/SectionForm';
import DocumentRow from '../../property/editor/DocumentRow';
import CheckboxField from './CheckboxField';
import {
  clean, str, isHttpsUrl, textToHtml, htmlToText, toDocRow, toDocBody,
} from '../../property/editor/formUtils';
import { VIDEO_PROVIDERS } from '../../../data/propertyOptions';
import { MAX_DEVELOPMENT_BROCHURES } from '../../../data/developmentOptions';

const SINGLE_DOCS = [
  { key: 'sitePlan', label: 'Site plan' },
  { key: 'priceList', label: 'Price list' },
];

export default function DetailsSection({ development, onSave, saving, readOnly }) {
  const d = development.details || {};
  const [form, setForm] = useState({
    description: htmlToText(d.description),
    salesTelephone: str(d.salesTelephone),
    salesEmail: str(d.salesEmail),
    virtualTourSupplier: str(d.virtualTourSupplier),
    virtualTourUrl: str(d.virtualTourUrl),
    applyVirtualTourToProperties: Boolean(d.applyVirtualTourToProperties),
    videoProvider: d.videoProvider || 'none',
    videoUrl: str(d.videoUrl),
    applyBrochuresToProperties: Boolean(d.applyBrochuresToProperties),
    applySitePlanToProperties: Boolean(d.applySitePlanToProperties),
  });
  const [docs, setDocs] = useState(() => Object.fromEntries(SINGLE_DOCS.map(({ key }) => [key, toDocRow(d[key])])));
  const [brochures, setBrochures] = useState(() => (d.brochures || []).map(toDocRow));
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (form.videoProvider !== 'none' && !form.videoUrl.trim()) {
      return toast.error('Video URL is required for the selected provider');
    }
    const links = [form.virtualTourUrl, form.videoProvider === 'none' ? '' : form.videoUrl].map((u) => u.trim()).filter(Boolean);
    if (links.some((u) => !isHttpsUrl(u))) return toast.error('Tour and video links must start with https://');
    const docUrls = [...Object.values(docs), ...brochures].map((x) => x.url.trim()).filter(Boolean);
    if (docUrls.some((u) => !/^https?:\/\/\S+$/i.test(u))) return toast.error('Every document needs a valid URL');

    const body = clean({
      description: textToHtml(form.description),
      salesTelephone: form.salesTelephone.trim(),
      salesEmail: form.salesEmail.trim(),
      virtualTourSupplier: form.virtualTourSupplier.trim(),
      virtualTourUrl: form.virtualTourUrl.trim(),
      videoProvider: form.videoProvider,
      videoUrl: form.videoProvider === 'none' ? undefined : form.videoUrl.trim(),
    }) || {};

    Object.assign(body, {
      applyVirtualTourToProperties: form.applyVirtualTourToProperties,
      applyBrochuresToProperties: form.applyBrochuresToProperties,
      applySitePlanToProperties: form.applySitePlanToProperties,
      brochures: brochures.map(toDocBody).filter(Boolean),
    });
    SINGLE_DOCS.forEach(({ key }) => {
      const doc = toDocBody(docs[key]);
      if (doc) body[key] = doc;
    });
    onSave(body);
  };

  return (
    <SectionForm
      title="Details"
      description="Optional. What buyers see on the development page, plus shared tours and documents for its homes."
      onSubmit={submit}
      saving={saving}
      readOnly={readOnly}
    >
      <FieldGroup title="Description" description="Separate paragraphs with a blank line" cols={1}>
        <Field label="About this development">
          <TextArea value={form.description} onChange={set('description')} rows={6} maxLength={15000} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Sales Contacts" description="Leave blank to use your organisation's details">
        <Field label="Sales telephone">
          <TextInput type="tel" value={form.salesTelephone} onChange={set('salesTelephone')} placeholder="+44 20 7946 0000" />
        </Field>
        <Field label="Sales email">
          <TextInput type="email" value={form.salesEmail} onChange={set('salesEmail')} placeholder="sales@company.co.uk" />
        </Field>
      </FieldGroup>

      <FieldGroup title="Virtual Tour & Video" description="Links must be https URLs">
        <Field label="Tour supplier">
          <TextInput value={form.virtualTourSupplier} onChange={set('virtualTourSupplier')} placeholder="e.g. Matterport" />
        </Field>
        <Field label="Tour URL" hint="Only the src URL from the embed code">
          <TextInput value={form.virtualTourUrl} onChange={set('virtualTourUrl')} placeholder="https://…" />
        </Field>
        <Field label="Video provider">
          <SelectInput aria-label="Video provider" value={form.videoProvider} onChange={set('videoProvider')} options={VIDEO_PROVIDERS} />
        </Field>
        {form.videoProvider !== 'none' && (
          <Field label="Video URL" required>
            <TextInput value={form.videoUrl} onChange={set('videoUrl')} placeholder="https://www.youtube.com/watch?v=…" />
          </Field>
        )}
        <div className="md:col-span-2">
          <CheckboxField
            checked={form.applyVirtualTourToProperties}
            onChange={set('applyVirtualTourToProperties')}
            disabled={readOnly}
            label="Show this tour on homes in the development"
            hint="Homes without their own tour will use this one"
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Documents" description="Link to documents hosted online" cols={1}>
        {SINGLE_DOCS.map(({ key, label }) => (
          <DocumentRow key={key} label={label} doc={docs[key]} readOnly={readOnly} onChange={(doc) => setDocs((x) => ({ ...x, [key]: doc }))} />
        ))}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Brochures (max {MAX_DEVELOPMENT_BROCHURES})</h3>
            {!readOnly && brochures.length < MAX_DEVELOPMENT_BROCHURES && (
              <button type="button" onClick={() => setBrochures((b) => [...b, { url: '', fileName: '' }])} className="text-sm text-brand-700 font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add brochure
              </button>
            )}
          </div>
          {brochures.length === 0 && <p className="text-sm text-gray-400">No brochures added.</p>}
          <div className="space-y-3">
            {brochures.map((doc, i) => (
              <DocumentRow
                key={i}
                label={`Brochure ${i + 1}`}
                doc={doc}
                readOnly={readOnly}
                onChange={(next) => setBrochures((b) => b.map((x, idx) => (idx === i ? next : x)))}
                onRemove={() => setBrochures((b) => b.filter((_, idx) => idx !== i))}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CheckboxField
            checked={form.applyBrochuresToProperties}
            onChange={set('applyBrochuresToProperties')}
            disabled={readOnly}
            label="Use these brochures on every home"
            hint="Homes in the development can't set their own"
          />
          <CheckboxField
            checked={form.applySitePlanToProperties}
            onChange={set('applySitePlanToProperties')}
            disabled={readOnly}
            label="Use this site plan on every home"
            hint="Homes in the development can't set their own"
          />
        </div>
      </FieldGroup>
    </SectionForm>
  );
}
