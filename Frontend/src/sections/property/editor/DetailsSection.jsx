import { useState } from 'react';
import { Plus, Trash2, Lock } from 'lucide-react';
import {
  Field, TextInput, NumberInput, TextArea, SelectInput, YesNoSelect, CheckboxGroup,
} from '../../../components/FormFields';
import SectionForm, { FieldGroup } from './SectionForm';
import {
  clean, str, toNumber, toBool, fromBool, textToHtml, htmlToText,
} from './formUtils';
import {
  SCHEME_TYPES, AVAILABILITY, PROPERTY_TYPES, TENURES, COUNCIL_TAX_BANDS, PARKING,
  OUTSIDE_SPACE, ACCESSIBLE_MEASURES, FURNISHING, APPLIANCE_OPTIONS, UNIT_SIZE_SCALES,
  ROOM_DIMENSION_UNITS, LISTED_STATUS, SEWERAGE_SUPPLY, WATER_SUPPLY, ELECTRICITY_SUPPLY,
  BROADBAND, REQUIRED_PRICING_BY_SCHEME,
} from '../../../data/propertyOptions';

const PRICING_FIELDS = [
  { key: 'fullMarketValue', label: 'Full market value (£)' },
  { key: 'monthlyRentAtMinShare', label: 'Monthly rent at minimum share (£)' },
  { key: 'serviceChargeMonthly', label: 'Service charge, monthly (£)' },
  { key: 'groundRentAnnual', label: 'Ground rent, annual (£)' },
  { key: 'monthlyRent', label: 'Monthly rent (£)' },
  { key: 'discountPercentage', label: 'Discount (%)' },
];

const initial = (d = {}) => ({
  schemeType: str(d.schemeType),
  availability: str(d.availability),
  propertyType: str(d.propertyType),
  minimumSharePercentage: str(d.minimumSharePercentage),
  tenure: str(d.tenure),
  leaseYearsRemaining: str(d.leaseYearsRemaining),
  councilTaxBand: str(d.councilTaxBand),
  floor: str(d.floor),
  pricing: Object.fromEntries(PRICING_FIELDS.map(({ key }) => [key, str(d.pricing?.[key])])),
  materials: htmlToText(d.materials),
  parking: str(d.parking),
  outsideSpace: d.outsideSpace || [],
  accessibleMeasures: d.accessibleMeasures || [],
  totalRooms: str(d.totalRooms),
  rooms: (d.rooms || []).map((r) => ({
    name: str(r.name), length: str(r.length), width: str(r.width), unit: r.unit || 'm', description: str(r.description),
  })),
  furnished: str(d.furnished),
  washingMachine: str(d.washingMachine),
  dishwasher: str(d.dishwasher),
  fridgeFreezer: str(d.fridgeFreezer),
  yearBuilt: str(d.yearBuilt),
  unitSizeValue: str(d.unitSize?.value),
  unitSizeScale: d.unitSize?.scale || 'sq_ft',
  communalLift: fromBool(d.communalLift),
  floodedInLast5Years: fromBool(d.floodedInLast5Years),
  listedStatus: str(d.listedStatus),
  heatingDetails: str(d.heatingDetails),
  sewerageSupply: str(d.sewerageSupply),
  waterSupply: str(d.waterSupply),
  electricitySupply: str(d.electricitySupply),
  broadband: str(d.broadband),
  faqs: (d.faqs || []).map((f) => ({ question: str(f.question), answer: str(f.answer) })),
});

const toBody = (f) => {
  const unitSize = toNumber(f.unitSizeValue);
  return clean({
    schemeType: f.schemeType,
    availability: f.availability,
    propertyType: f.propertyType,
    minimumSharePercentage: toNumber(f.minimumSharePercentage),
    tenure: f.tenure,
    leaseYearsRemaining: toNumber(f.leaseYearsRemaining),
    councilTaxBand: f.councilTaxBand,
    floor: toNumber(f.floor),
    pricing: Object.fromEntries(Object.entries(f.pricing).map(([k, v]) => [k, toNumber(v)])),
    materials: textToHtml(f.materials),
    parking: f.parking,
    outsideSpace: f.outsideSpace,
    accessibleMeasures: f.accessibleMeasures,
    totalRooms: toNumber(f.totalRooms),
    rooms: f.rooms
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(), length: toNumber(r.length), width: toNumber(r.width), unit: r.unit, description: r.description.trim(),
      })),
    furnished: f.furnished,
    washingMachine: f.washingMachine,
    dishwasher: f.dishwasher,
    fridgeFreezer: f.fridgeFreezer,
    yearBuilt: toNumber(f.yearBuilt),
    unitSize: unitSize !== undefined ? { value: unitSize, scale: f.unitSizeScale } : undefined,
    communalLift: toBool(f.communalLift),
    floodedInLast5Years: toBool(f.floodedInLast5Years),
    listedStatus: f.listedStatus,
    heatingDetails: f.heatingDetails.trim(),
    sewerageSupply: f.sewerageSupply,
    waterSupply: f.waterSupply,
    electricitySupply: f.electricitySupply,
    broadband: f.broadband,
    faqs: f.faqs.filter((q) => q.question.trim() && q.answer.trim()),
  }) || {};
};

export default function DetailsSection({ property, onSave, saving, readOnly }) {
  const [form, setForm] = useState(() => initial(property.details || {}));
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setPricing = (key) => (value) => setForm((f) => ({ ...f, pricing: { ...f.pricing, [key]: value } }));

  const updateRow = (listKey, index, key, value) =>
    setForm((f) => ({ ...f, [listKey]: f[listKey].map((row, i) => (i === index ? { ...row, [key]: value } : row)) }));
  const addRow = (listKey, row) => setForm((f) => ({ ...f, [listKey]: [...f[listKey], row] }));
  const removeRow = (listKey, index) => setForm((f) => ({ ...f, [listKey]: f[listKey].filter((_, i) => i !== index) }));

  const pricingRequired = form.availability !== 'coming_soon' ? REQUIRED_PRICING_BY_SCHEME[form.schemeType] || [] : [];

  return (
    <SectionForm
      title="Property Details"
      description="Scheme, pricing, features and material information. Required pricing fields depend on the scheme type."
      onSubmit={() => onSave(toBody(form))}
      saving={saving}
      readOnly={readOnly}
    >
      <FieldGroup title="Scheme Information" description="Scheme type, tenure and how the home is offered" cols={3}>
        <Field label="Scheme type" required>
          <SelectInput value={form.schemeType} onChange={set('schemeType')} options={SCHEME_TYPES} />
        </Field>
        <Field label="Availability" required>
          <SelectInput value={form.availability} onChange={set('availability')} options={AVAILABILITY} />
        </Field>
        <Field label="Property type" required>
          <SelectInput value={form.propertyType} onChange={set('propertyType')} options={PROPERTY_TYPES} />
        </Field>
        <Field label="Tenure" required>
          <SelectInput value={form.tenure} onChange={set('tenure')} options={TENURES} />
        </Field>
        <Field label="Lease years remaining">
          <NumberInput value={form.leaseYearsRemaining} onChange={set('leaseYearsRemaining')} min={0} />
        </Field>
        <Field label="Council tax band">
          <SelectInput value={form.councilTaxBand} onChange={set('councilTaxBand')} options={COUNCIL_TAX_BANDS} />
        </Field>
        <Field label="Floor" hint="0 = ground, -1 = basement">
          <NumberInput value={form.floor} onChange={set('floor')} min={-2} />
        </Field>
        <Field label="Minimum share (%)" required={pricingRequired.includes('minimumSharePercentage')}>
          <NumberInput value={form.minimumSharePercentage} onChange={set('minimumSharePercentage')} min={1} max={100} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Pricing" description="All amounts in pounds (£)" cols={3}>
        {PRICING_FIELDS.map(({ key, label }) => (
          <Field key={key} label={label} required={pricingRequired.includes(key)}>
            <NumberInput
              value={form.pricing[key]}
              onChange={setPricing(key)}
              min={0}
              max={key === 'discountPercentage' ? 100 : undefined}
              step="0.01"
            />
          </Field>
        ))}
      </FieldGroup>

      <FieldGroup title="Size & Rooms" description="Floor area and room count" cols={3}>
        <Field label="Unit size">
          <div className="flex gap-2">
            <NumberInput value={form.unitSizeValue} onChange={set('unitSizeValue')} min={0} />
            <div className="w-28 shrink-0">
              <SelectInput value={form.unitSizeScale} onChange={set('unitSizeScale')} options={UNIT_SIZE_SCALES} placeholder="Unit" />
            </div>
          </div>
        </Field>
        <Field label="Total rooms">
          <NumberInput value={form.totalRooms} onChange={set('totalRooms')} min={0} />
        </Field>
        <Field label="Year built">
          <NumberInput value={form.yearBuilt} onChange={set('yearBuilt')} min={1000} />
        </Field>
      </FieldGroup>

      <div className="pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-ink">Room dimensions</h3>
          {!readOnly && (
            <button type="button" onClick={() => addRow('rooms', { name: '', length: '', width: '', unit: 'm', description: '' })} className="text-sm text-brand-700 font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add room
            </button>
          )}
        </div>
        {form.rooms.length === 0 && <p className="text-sm text-gray-400">No rooms added.</p>}
        <div className="space-y-3">
          {form.rooms.map((room, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4"><TextInput placeholder="Room name" value={room.name} onChange={(v) => updateRow('rooms', i, 'name', v)} /></div>
              <div className="col-span-2"><NumberInput placeholder="Length" value={room.length} onChange={(v) => updateRow('rooms', i, 'length', v)} min={0} step="0.01" /></div>
              <div className="col-span-2"><NumberInput placeholder="Width" value={room.width} onChange={(v) => updateRow('rooms', i, 'width', v)} min={0} step="0.01" /></div>
              <div className="col-span-2"><SelectInput value={room.unit} onChange={(v) => updateRow('rooms', i, 'unit', v)} options={ROOM_DIMENSION_UNITS} placeholder="Unit" /></div>
              <div className="col-span-2 flex justify-end">
                {!readOnly && (
                  <button type="button" onClick={() => removeRow('rooms', i)} className="p-2.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <FieldGroup title="Features" description="Outside space, accessibility and appliances" cols={1}>
        <Field label="Outside space" floating={false}><CheckboxGroup value={form.outsideSpace} onChange={set('outsideSpace')} options={OUTSIDE_SPACE} /></Field>
        <Field label="Accessibility measures" floating={false}><CheckboxGroup value={form.accessibleMeasures} onChange={set('accessibleMeasures')} options={ACCESSIBLE_MEASURES} /></Field>
      </FieldGroup>

      <FieldGroup cols={3}>
        <Field label="Parking"><SelectInput value={form.parking} onChange={set('parking')} options={PARKING} /></Field>
        <Field label="Furnishing"><SelectInput value={form.furnished} onChange={set('furnished')} options={FURNISHING} /></Field>
        <Field label="Communal lift"><YesNoSelect value={form.communalLift} onChange={set('communalLift')} /></Field>
        <Field label="Washing machine"><SelectInput value={form.washingMachine} onChange={set('washingMachine')} options={APPLIANCE_OPTIONS} /></Field>
        <Field label="Dishwasher"><SelectInput value={form.dishwasher} onChange={set('dishwasher')} options={APPLIANCE_OPTIONS} /></Field>
        <Field label="Fridge freezer"><SelectInput value={form.fridgeFreezer} onChange={set('fridgeFreezer')} options={APPLIANCE_OPTIONS} /></Field>
      </FieldGroup>

      <FieldGroup title="Material Information" description="Utilities and disclosures required by trading standards" cols={3}>
        <Field label="Listed status"><SelectInput value={form.listedStatus} onChange={set('listedStatus')} options={LISTED_STATUS} /></Field>
        <Field label="Flooded in last 5 years"><YesNoSelect value={form.floodedInLast5Years} onChange={set('floodedInLast5Years')} /></Field>
        <Field label="Broadband"><SelectInput value={form.broadband} onChange={set('broadband')} options={BROADBAND} /></Field>
        <Field label="Sewerage"><SelectInput value={form.sewerageSupply} onChange={set('sewerageSupply')} options={SEWERAGE_SUPPLY} /></Field>
        <Field label="Water"><SelectInput value={form.waterSupply} onChange={set('waterSupply')} options={WATER_SUPPLY} /></Field>
        <Field label="Electricity"><SelectInput value={form.electricitySupply} onChange={set('electricitySupply')} options={ELECTRICITY_SUPPLY} /></Field>
      </FieldGroup>
      <Field label="Heating details"><TextInput value={form.heatingDetails} onChange={set('heatingDetails')} placeholder="e.g. Gas central heating" /></Field>
      <Field label="Other material information" hint="Separate paragraphs with a blank line">
        <TextArea value={form.materials} onChange={set('materials')} rows={4} />
      </Field>

      <div className="pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-ink">FAQs</h3>
          {property.isPremium && !readOnly && (
            <button type="button" onClick={() => addRow('faqs', { question: '', answer: '' })} className="text-sm text-brand-700 font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add FAQ
            </button>
          )}
        </div>
        {!property.isPremium ? (
          <p className="text-sm text-gray-400 flex items-center gap-2"><Lock className="w-4 h-4" /> FAQs are available on premium listings only.</p>
        ) : (
          <div className="space-y-3">
            {form.faqs.length === 0 && <p className="text-sm text-gray-400">No FAQs added.</p>}
            {form.faqs.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <TextInput placeholder="Question" value={faq.question} onChange={(v) => updateRow('faqs', i, 'question', v)} />
                  {!readOnly && <button type="button" onClick={() => removeRow('faqs', i)} className="p-2.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <TextArea placeholder="Answer" rows={2} value={faq.answer} onChange={(v) => updateRow('faqs', i, 'answer', v)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionForm>
  );
}
