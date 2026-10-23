import { useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Field, TextInput } from '../../../components/FormFields';
import SectionForm, { FieldGroup } from './SectionForm';
import DocumentRow from './DocumentRow';
import { str, isHttpsUrl, toDocRow as toDoc, toDocBody as toApiDoc } from './formUtils';
import { SINGLE_DOCUMENTS, MAX_BROCHURES } from '../../../data/propertyOptions';

export default function AttachmentsSection({ property, onSave, saving, readOnly }) {
  const a = property.attachments || {};
  const [docs, setDocs] = useState(() => Object.fromEntries(SINGLE_DOCUMENTS.map(({ key }) => [key, toDoc(a[key])])));
  const [brochures, setBrochures] = useState(() => (a.brochures || []).map(toDoc));
  const [keyInformationUrl, setKeyInformationUrl] = useState(str(a.keyInformationUrl));

  const submit = () => {
    const allUrls = [...Object.values(docs), ...brochures].map((d) => d.url.trim()).filter(Boolean);
    if (allUrls.some((u) => !/^https?:\/\/\S+$/i.test(u))) return toast.error('Every document needs a valid URL');
    if (keyInformationUrl.trim() && !isHttpsUrl(keyInformationUrl.trim())) {
      return toast.error('Key information link must start with https://');
    }

    const body = {
      brochures: brochures.map(toApiDoc).filter(Boolean),
      keyInformationUrl: keyInformationUrl.trim() || undefined,
    };
    SINGLE_DOCUMENTS.forEach(({ key }) => {
      const doc = toApiDoc(docs[key]);
      if (doc) body[key] = doc;
    });
    onSave(body);
  };

  return (
    <SectionForm
      title="Documents"
      description="Link to documents hosted online. The EPC is required before the listing can be submitted."
      onSubmit={submit}
      saving={saving}
      readOnly={readOnly}
    >
      <FieldGroup title="Certificates" description="EPC, floor plan and other single documents" cols={1}>
        {SINGLE_DOCUMENTS.map(({ key, label, required }) => (
          <DocumentRow
            key={key}
            label={label}
            required={required}
            doc={docs[key]}
            readOnly={readOnly}
            onChange={(doc) => setDocs((d) => ({ ...d, [key]: doc }))}
          />
        ))}
      </FieldGroup>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Brochures (max {MAX_BROCHURES})</h3>
          {!readOnly && brochures.length < MAX_BROCHURES && (
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

      <Field label="Key information link" hint="Optional https link, e.g. to a hosted key information page">
        <TextInput value={keyInformationUrl} onChange={setKeyInformationUrl} placeholder="https://…" />
      </Field>
    </SectionForm>
  );
}
