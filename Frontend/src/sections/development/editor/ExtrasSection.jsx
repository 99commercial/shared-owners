import { useState } from 'react';
import { Field, TextArea } from '../../../components/FormFields';
import SectionForm from '../../property/editor/SectionForm';
import { clean, str } from '../../property/editor/formUtils';

export default function ExtrasSection({ development, onSave, saving, readOnly }) {
  const [summaryText, setSummaryText] = useState(str(development.extras?.summaryText));

  return (
    <SectionForm
      title="Extras"
      description="A short summary shown on your Developer Page."
      onSubmit={() => onSave(clean({ summaryText: summaryText.trim() }) || {})}
      saving={saving}
      readOnly={readOnly}
    >
      <Field label="Developer page summary" hint={`${summaryText.length}/300 characters`}>
        <TextArea value={summaryText} onChange={setSummaryText} rows={3} maxLength={300} />
      </Field>
    </SectionForm>
  );
}
