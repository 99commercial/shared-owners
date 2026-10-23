import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Save } from 'lucide-react';
import Modal from '../../../components/Modal';
import { Field, SelectInput, TextArea, TextInput } from '../../../components/FormFields';
import { ORGANISATION_TYPES } from '../../../data/constants';
import { accountName, profileOf } from '../../../utils/format';

const PERSON_FIELDS = [
  { key: 'firstName', label: 'First name', required: true },
  { key: 'lastName', label: 'Last name', required: true },
  { key: 'phone', label: 'Phone' },
];
const MEMBER_FIELDS = [...PERSON_FIELDS, { key: 'jobTitle', label: 'Job title' }];
const ADDRESS_FIELDS = [
  { key: 'line1', label: 'Address line 1' },
  { key: 'line2', label: 'Address line 2' },
  { key: 'city', label: 'Town / city' },
  { key: 'county', label: 'County' },
  { key: 'postcode', label: 'Postcode' },
];

const FIELDS_BY_ROLE = {
  user: PERSON_FIELDS,
  'organisation-admin': MEMBER_FIELDS,
  'organisation-user': MEMBER_FIELDS,
};

const initialForm = (account) => {
  const p = profileOf(account);
  if (account.role === 'organisation') {
    return {
      name: p.name || '',
      type: p.type || '',
      description: p.description || '',
      contactEmail: p.contactEmail || '',
      phone: p.phone || '',
      website: p.website || '',
      address: Object.fromEntries(ADDRESS_FIELDS.map((f) => [f.key, p.address?.[f.key] || ''])),
    };
  }
  return Object.fromEntries(FIELDS_BY_ROLE[account.role].map((f) => [f.key, p[f.key] || '']));
};

/**
 * Admin edit of an account's profile. `save(profile)` is the PATCH call for this
 * account type; it receives the same fields the owner can edit themselves.
 */
export default function EditAccountModal({ account, save, onSaved, onClose }) {
  const [form, setForm] = useState(() => initialForm(account));
  const isCompany = account.role === 'organisation';
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setAddress = (key) => (value) => setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));

  const mutation = useMutation({
    mutationFn: () => {
      const profile = { ...form };
      if (isCompany && !profile.type) delete profile.type;
      return save({ profile });
    },
    onSuccess: (res) => {
      toast.success('Profile updated');
      onSaved?.(res);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not update the profile'),
  });

  const missing = isCompany ? !form.name.trim() : !form.firstName.trim() || !form.lastName.trim();

  return (
    <Modal title={`Edit ${accountName(account)}`} onClose={onClose} maxWidth="max-w-2xl">
      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        className="space-y-5"
      >
        {isCompany ? (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Organisation name" required><TextInput value={form.name} onChange={set('name')} /></Field>
              <Field label="Type">
                <SelectInput value={form.type} onChange={set('type')} options={ORGANISATION_TYPES} placeholder="Not set" />
              </Field>
              <Field label="Contact email"><TextInput type="email" value={form.contactEmail} onChange={set('contactEmail')} /></Field>
              <Field label="Phone"><TextInput value={form.phone} onChange={set('phone')} /></Field>
              <Field label="Website" className="sm:col-span-2"><TextInput value={form.website} onChange={set('website')} placeholder="https://" /></Field>
            </div>
            <Field label="Description"><TextArea value={form.description} onChange={set('description')} rows={4} /></Field>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Address</div>
              <div className="grid sm:grid-cols-2 gap-4">
                {ADDRESS_FIELDS.map((f) => (
                  <Field key={f.key} label={f.label}><TextInput value={form.address[f.key]} onChange={setAddress(f.key)} /></Field>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {FIELDS_BY_ROLE[account.role].map((f) => (
              <Field key={f.key} label={f.label} required={f.required}>
                <TextInput value={form[f.key]} onChange={set(f.key)} />
              </Field>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500">
          The sign-in email ({account.email}) cannot be changed here. The account owner sees these changes immediately.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-brand-outline">Cancel</button>
          <button type="submit" disabled={mutation.isPending || missing} className="btn-brand disabled:opacity-50">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
