import { useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { Field, TextInput, NumberInput, TextArea, SelectInput } from '../../../components/FormFields';
import SectionForm from './SectionForm';
import { clean, textToHtml, htmlToText } from './formUtils';
import { ELIGIBILITY_CRITERIA, formatMoney } from '../../../data/propertyOptions';

const CRITERIA_BY_TYPE = Object.fromEntries(ELIGIBILITY_CRITERIA.map((c) => [c.type, c]));

const toFormValue = (c) => {
  const kind = CRITERIA_BY_TYPE[c.type]?.kind;
  if (kind === 'boolean') return c.value ? 'true' : 'false';
  return c.value === undefined || c.value === null ? '' : String(c.value);
};

const toApiValue = (type, value) => {
  const kind = CRITERIA_BY_TYPE[type]?.kind;
  if (kind === 'boolean') return value === 'true';
  if (kind === 'money') return value === '' ? undefined : Number(value);
  if (kind === 'age') return value === '' ? undefined : Number.parseInt(value, 10);
  return value.trim();
};

const describe = ({ type, value }) => {
  const kind = CRITERIA_BY_TYPE[type]?.kind;
  const label = CRITERIA_BY_TYPE[type]?.label || type;
  if (kind === 'money') return `${label}: ${formatMoney(Number(value))}`;
  if (kind === 'age') return `${label}: ${value}`;
  if (kind === 'text') return `${label}: ${value}`;
  return value === 'true' ? label : `${label}: not required`;
};

export default function EligibilitySection({ property, onSave, saving, readOnly }) {
  const e = property.eligibility || {};
  const [criteria, setCriteria] = useState(() => (e.criteria || []).map((c) => ({ type: c.type, value: toFormValue(c) })));
  const [criteriaText, setCriteriaText] = useState(() => htmlToText(e.criteriaText));
  const [isCustomText, setIsCustomText] = useState(Boolean(e.isCustomText));
  const [newType, setNewType] = useState('');

  const available = ELIGIBILITY_CRITERIA.filter((c) => !criteria.some((x) => x.type === c.type));

  const addCriterion = () => {
    if (!newType) return;
    const kind = CRITERIA_BY_TYPE[newType].kind;
    setCriteria((list) => [...list, { type: newType, value: kind === 'boolean' ? 'true' : '' }]);
    setNewType('');
  };

  const updateValue = (index, value) =>
    setCriteria((list) => list.map((c, i) => (i === index ? { ...c, value } : c)));

  const generateText = () => {
    const lines = criteria.filter((c) => c.value !== '').map(describe);
    setCriteriaText(lines.length ? `Applicants must meet the following criteria:\n\n${lines.join('\n')}` : '');
    setIsCustomText(false);
  };

  const submit = () =>
    onSave(
      clean({
        criteria: criteria
          .map((c) => ({ type: c.type, value: toApiValue(c.type, c.value) }))
          .filter((c) => c.value !== undefined && c.value !== ''),
        criteriaText: textToHtml(criteriaText),
        isCustomText,
      }) || {}
    );

  return (
    <SectionForm
      title="Eligibility"
      description="Criteria used to mark each enquiry as priority (meets all) or non-priority."
      onSubmit={submit}
      saving={saving}
      readOnly={readOnly}
    >
      <div className="space-y-3">
        {criteria.length === 0 && <p className="text-sm text-gray-400">No criteria added.</p>}
        {criteria.map((c, i) => {
          const meta = CRITERIA_BY_TYPE[c.type];
          return (
            <div key={c.type} className="flex items-center gap-3 border border-gray-100 rounded-lg p-3">
              <div className="flex-1 text-sm font-medium text-gray-800">{meta?.label || c.type}</div>
              <div className="w-56">
                {meta?.kind === 'boolean' && (
                  <SelectInput value={c.value} onChange={(v) => updateValue(i, v)} options={[{ value: 'true', label: 'Required' }, { value: 'false', label: 'Not required' }]} placeholder="Choose…" />
                )}
                {meta?.kind === 'money' && <NumberInput value={c.value} onChange={(v) => updateValue(i, v)} min={0} step="0.01" placeholder="Amount in £" />}
                {meta?.kind === 'age' && <NumberInput value={c.value} onChange={(v) => updateValue(i, v)} min={0} max={120} step={1} placeholder="Age" />}
                {meta?.kind === 'text' && <TextInput value={c.value} onChange={(v) => updateValue(i, v)} placeholder="e.g. Borough of Camden" />}
              </div>
              {!readOnly && (
                <button type="button" onClick={() => setCriteria((list) => list.filter((_, idx) => idx !== i))} className="p-2 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}

        {!readOnly && available.length > 0 && (
          <div className="flex gap-2">
            <div className="flex-1">
              <SelectInput value={newType} onChange={setNewType} options={available.map((c) => ({ value: c.type, label: c.label }))} placeholder="Add a criterion…" />
            </div>
            <button type="button" onClick={addCriterion} disabled={!newType} className="btn-brand-outline gap-1 text-sm">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        )}
      </div>

      <Field label="Eligibility text shown to buyers" floating={false}>
        <div className="flex justify-end mb-2">
          {!readOnly && (
            <button type="button" onClick={generateText} className="text-sm text-brand-700 font-medium flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Generate from criteria
            </button>
          )}
        </div>
        <TextArea
          value={criteriaText}
          onChange={(v) => { setCriteriaText(v); setIsCustomText(true); }}
          rows={6}
          maxLength={10000}
        />
        <p className="text-xs text-gray-400 mt-1">{isCustomText ? 'Edited by hand' : 'Generated from criteria'}</p>
      </Field>
    </SectionForm>
  );
}
