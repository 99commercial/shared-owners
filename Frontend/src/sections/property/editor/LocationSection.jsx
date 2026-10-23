import { useState } from 'react';
import { Field, TextInput, SelectInput } from '../../../components/FormFields';
import SectionForm, { FieldGroup } from './SectionForm';
import LocationPicker from './LocationPicker';
import { clean, str, toNumber } from './formUtils';

const initial = (p) => {
  const [lng, lat] = p.location?.coordinates || [];
  return {
    name: str(p.name),
    reference: str(p.reference),
    development: str(p.development?._id || p.development),
    postcode: str(p.address?.postcode),
    line1: str(p.address?.line1),
    line2: str(p.address?.line2),
    townCity: str(p.address?.townCity),
    localAuthority: str(p.address?.localAuthority),
    lat: str(lat),
    lng: str(lng),
  };
};

/** `developments` is null for owners that can't have developments (individual users) */
export default function LocationSection({ property, developments, onSave, saving, readOnly }) {
  const [form, setForm] = useState(() => initial(property));
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const lat = toNumber(form.lat);
  const lng = toNumber(form.lng);

  const submit = () => {
    const hasPin = Number.isFinite(lat) && Number.isFinite(lng);
    onSave(
      clean({
        name: form.name.trim(),
        reference: form.reference.trim(),
        development: developments ? form.development : undefined,
        address: {
          postcode: form.postcode.trim(),
          line1: form.line1.trim(),
          line2: form.line2.trim(),
          townCity: form.townCity.trim(),
          localAuthority: form.localAuthority.trim(),
        },
        location: hasPin ? { type: 'Point', coordinates: [lng, lat] } : undefined,
      }) || {}
    );
  };

  return (
    <SectionForm
      title="General Details"
      description="Listing name, address and the map pin buyers will see."
      onSubmit={submit}
      saving={saving}
      readOnly={readOnly}
    >
      <FieldGroup title="Basic Information" description="How the listing is named and referenced">
        <Field label="Listing name" required>
          <TextInput value={form.name} onChange={set('name')} maxLength={150} required />
        </Field>
        <Field label="Your reference" hint="Optional, must be unique across your listings">
          <TextInput value={form.reference} onChange={set('reference')} maxLength={50} />
        </Field>
        {developments && (
          <Field label="Development" hint="Optional. Homes in a development share its tour, brochures and site plan">
            <SelectInput
              aria-label="Development"
              value={form.development}
              onChange={set('development')}
              placeholder="Not part of a development"
              options={developments.map((d) => ({ value: d._id, label: d.name }))}
            />
          </Field>
        )}
      </FieldGroup>

      <FieldGroup title="Address" description="Full UK postal address of the property">
        <Field label="Address line 1" required>
          <TextInput value={form.line1} onChange={set('line1')} />
        </Field>
        <Field label="Address line 2">
          <TextInput value={form.line2} onChange={set('line2')} />
        </Field>
        <Field label="Town / city" required>
          <TextInput value={form.townCity} onChange={set('townCity')} />
        </Field>
        <Field label="Postcode" required hint="UK format, e.g. SW1A 1AA">
          <TextInput value={form.postcode} onChange={(v) => set('postcode')(v.toUpperCase())} />
        </Field>
        <Field label="Local authority" required>
          <TextInput value={form.localAuthority} onChange={set('localAuthority')} placeholder="e.g. Camden" />
        </Field>
      </FieldGroup>

      <FieldGroup title="Map Location" description="Click the map to drop the pin, or type the coordinates" cols={1}>
        <LocationPicker
          lat={lat}
          lng={lng}
          disabled={readOnly}
          onPick={(la, ln) => setForm((f) => ({ ...f, lat: la.toFixed(6), lng: ln.toFixed(6) }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude" required>
            <TextInput value={form.lat} onChange={set('lat')} inputMode="decimal" />
          </Field>
          <Field label="Longitude" required>
            <TextInput value={form.lng} onChange={set('lng')} inputMode="decimal" />
          </Field>
        </div>
      </FieldGroup>
    </SectionForm>
  );
}
