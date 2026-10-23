import { useState } from 'react';
import { Field, TextInput, SelectInput } from '../../../components/FormFields';
import SectionForm, { FieldGroup } from '../../property/editor/SectionForm';
import LocationPicker from '../../property/editor/LocationPicker';
import { clean, str, toNumber } from '../../property/editor/formUtils';
import { DEVELOPMENT_TYPES } from '../../../data/developmentOptions';

const initial = (d) => {
  const [lng, lat] = d.location?.coordinates || [];
  return {
    name: str(d.name),
    developmentType: str(d.developmentType),
    postcode: str(d.address?.postcode),
    line1: str(d.address?.line1),
    line2: str(d.address?.line2),
    townCity: str(d.address?.townCity),
    localAuthority: str(d.address?.localAuthority),
    lat: str(lat),
    lng: str(lng),
  };
};

export default function GeneralSection({ development, onSave, saving, readOnly }) {
  const [form, setForm] = useState(() => initial(development));
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const lat = toNumber(form.lat);
  const lng = toNumber(form.lng);

  const submit = () => {
    const hasPin = Number.isFinite(lat) && Number.isFinite(lng);
    onSave(
      clean({
        name: form.name.trim(),
        developmentType: form.developmentType,
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
      description="The development's name, type, address and map pin. Address and pin are needed to publish."
      onSubmit={submit}
      saving={saving}
      readOnly={readOnly}
    >
      <FieldGroup title="Basic Information" description="How the development is named on SharedOwnership">
        <Field label="Development name" required>
          <TextInput value={form.name} onChange={set('name')} maxLength={150} required />
        </Field>
        <Field label="Development type" hint="Optional, used for search engines">
          <SelectInput aria-label="Development type" value={form.developmentType} onChange={set('developmentType')} options={DEVELOPMENT_TYPES} placeholder="Not specified" />
        </Field>
      </FieldGroup>

      <FieldGroup title="Address" description="Site address of the development">
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
