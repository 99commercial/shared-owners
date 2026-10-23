import { useState } from 'react';
import { Crown } from 'lucide-react';
import { Field, TextArea } from '../../../components/FormFields';
import SectionForm from '../../property/editor/SectionForm';
import { clean, str } from '../../property/editor/formUtils';

export default function ExtrasSection({ development, onSave, saving, readOnly }) {
  const [summaryText, setSummaryText] = useState(str(development.extras?.summaryText));
  const locked = !development.isPremium;

  return (
    <SectionForm
      title="Extras"
      description="Premium developments get a short summary on your Developer Page."
      onSubmit={() => onSave(clean({ summaryText: summaryText.trim() }) || {})}
      saving={saving}
      readOnly={readOnly || locked}
    >
      {locked ? (
        <div className="flex items-start gap-3 rounded-xl bg-brand-50 border border-brand-200 px-4 py-4 text-sm text-brand-900">
          <Crown className="w-5 h-5 text-brand-600 shrink-0" />
          This section is part of the Featured Developer Package. Contact the SharedOwnership team to upgrade this development.
        </div>
      ) : (
        <Field label="Developer page summary" hint={`${summaryText.length}/300 characters`}>
          <TextArea value={summaryText} onChange={setSummaryText} rows={3} maxLength={300} />
        </Field>
      )}
    </SectionForm>
  );
}
