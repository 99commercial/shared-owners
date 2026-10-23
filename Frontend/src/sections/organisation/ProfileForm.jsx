import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Mail, AtSign, Phone, Globe, MapPin, Save, Loader2, ExternalLink, UserCheck, Users, HomeIcon, Landmark, CalendarDays,
} from 'lucide-react';
import { orgApi } from '../../services/endpoints';
import PageHero from '../../components/PageHero';
import { Field, TextInput, TextArea, SelectInput } from '../../components/FormFields';
import { CardHeader, SubSection } from '../../components/account/SettingsCard';
import PhotoUploader from '../../components/account/PhotoUploader';
import PasswordSecurityCard from '../../components/account/PasswordSecurityCard';
import { ORGANISATION_TYPES } from '../../data/constants';
import {
  useOrgProfile, useUpdateOrgProfile, useUploadOrgLogo, useRemoveOrgLogo,
} from '../../hooks/useOrgProfile';
import { formatLongDate } from '../../hooks/useUserProfile';

const ADDRESS_FIELDS = ['line1', 'line2', 'city', 'county', 'postcode'];
const typeLabel = (type) => ORGANISATION_TYPES.find((t) => t.value === type)?.label || '—';

function Overview({ organisation, members, propertyCount, developmentCount }) {
  const p = organisation?.organisationProfile || {};
  const stats = [
    { icon: UserCheck, label: 'Admins', value: members?.admins?.total ?? 0 },
    { icon: Users, label: 'Users', value: members?.users?.total ?? 0 },
    { icon: HomeIcon, label: 'Properties', value: propertyCount ?? 0 },
    { icon: Landmark, label: 'Developments', value: developmentCount ?? 0 },
  ];

  return (
    <div className="dash-card p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-6">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 ring-1 ring-gray-200 overflow-hidden flex items-center justify-center shrink-0">
          {p.logoUrl ? <img src={p.logoUrl} alt="" className="w-full h-full object-contain p-1.5" /> : <Building2 className="w-8 h-8 text-gray-300" />}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-ink truncate">{p.name || 'Your organisation'}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
            <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-semibold">{typeLabel(p.type)}</span>
            <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{organisation?.email}</span>
            <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />Joined {formatLongDate(organisation?.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-[480px]">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl bg-brand-50 border border-brand-100 px-3 py-2.5 text-center">
            <Icon className="w-4 h-4 text-brand-600 mx-auto" />
            <div className="text-lg font-extrabold text-ink leading-tight mt-1">{value}</div>
            <div className="text-[11px] text-gray-500 truncate">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** organisationProfile fields saved together; the logo uploads on its own */
function CompanyDetails({ organisation }) {
  const p = organisation?.organisationProfile || {};
  const [form, setForm] = useState({
    name: p.name || '',
    type: p.type || '',
    description: p.description || '',
    contactEmail: p.contactEmail || '',
    phone: p.phone || '',
    website: p.website || '',
    address: Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, p.address?.[k] || ''])),
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setAddress = (key) => (value) => setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));
  const save = useUpdateOrgProfile();
  const upload = useUploadOrgLogo();
  const remove = useRemoveOrgLogo();

  const submit = (e) => {
    e.preventDefault();
    save.mutate({
      name: form.name.trim(),
      type: form.type,
      description: form.description.trim(),
      contactEmail: form.contactEmail.trim(),
      phone: form.phone.trim(),
      website: form.website.trim(),
      address: Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, form.address[k].trim()])),
    });
  };

  return (
    <form onSubmit={submit} className="dash-card overflow-hidden">
      <CardHeader icon={Building2} title="Company Details" description="How your organisation appears to buyers on SharedOwnership" />
      <div className="p-6 space-y-6">
        <SubSection title="Company Logo" description="Shown on your company page, listings and dashboard">
          <PhotoUploader
            currentUrl={p.logoUrl}
            upload={upload}
            remove={remove}
            shape="square"
            icon={Building2}
            noun="Logo"
            description="Use a square or landscape logo on a plain background. It's resized to fit without cropping."
          />
        </SubSection>

        <SubSection title="Basic Information" description="Your organisation's name, type and a short introduction">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            <Field label="Organisation Name" required icon={Building2}>
              <TextInput value={form.name} onChange={set('name')} required maxLength={120} />
            </Field>
            <Field label="Organisation Type" required>
              <SelectInput aria-label="Organisation type" value={form.type} onChange={set('type')} options={ORGANISATION_TYPES} />
            </Field>
            <Field label="About" className="md:col-span-2" hint="A few sentences about who you are and the homes you offer">
              <TextArea value={form.description} onChange={set('description')} rows={4} maxLength={2000} />
            </Field>
          </div>
        </SubSection>

        <SubSection title="Contact Information" description="Public contact details shown on your company page">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            <Field label="Account Email" icon={Mail} hint="Used to sign in. It can't be changed">
              <TextInput value={organisation?.email || ''} onChange={() => {}} disabled />
            </Field>
            <Field label="Public Contact Email" icon={AtSign}>
              <TextInput type="email" value={form.contactEmail} onChange={set('contactEmail')} placeholder="enquiries@company.co.uk" />
            </Field>
            <Field label="Phone Number" icon={Phone}>
              <TextInput type="tel" value={form.phone} onChange={set('phone')} placeholder="+44 20 7946 0000" />
            </Field>
            <Field label="Website" icon={Globe}>
              <TextInput type="url" value={form.website} onChange={set('website')} placeholder="https://www.company.co.uk" />
            </Field>
          </div>
        </SubSection>

        <SubSection title="Office Address" description="Your registered or main office">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            <Field label="Address Line 1" icon={MapPin}>
              <TextInput value={form.address.line1} onChange={setAddress('line1')} />
            </Field>
            <Field label="Address Line 2">
              <TextInput value={form.address.line2} onChange={setAddress('line2')} />
            </Field>
            <Field label="Town / City">
              <TextInput value={form.address.city} onChange={setAddress('city')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="County">
                <TextInput value={form.address.county} onChange={setAddress('county')} />
              </Field>
              <Field label="Postcode">
                <TextInput value={form.address.postcode} onChange={(v) => setAddress('postcode')(v.toUpperCase())} maxLength={10} />
              </Field>
            </div>
          </div>
        </SubSection>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={save.isPending} className="btn-brand">
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </form>
  );
}

export default function ProfileForm() {
  const { data, organisation, isLoading } = useOrgProfile();
  const slug = organisation?.organisationProfile?.slug;

  return (
    <>
      <PageHero
        label="Account"
        title="Company Profile"
        subtitle="Manage your organisation's details, logo and security"
        breadcrumbs={[{ label: 'Home', to: '/org' }, { label: 'Company Profile' }]}
        action={slug && (
          <Link to={`/companies/${slug}`} target="_blank" className="btn-brand-outline bg-white">
            <ExternalLink className="w-4 h-4" /> View public page
          </Link>
        )}
      />

      {isLoading && !data ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : (
        <div className="space-y-6">
          <Overview organisation={organisation} members={data?.members} propertyCount={data?.propertyCount} developmentCount={data?.developmentCount} />
          <CompanyDetails key={organisation?._id || 'company'} organisation={organisation} />
          <PasswordSecurityCard
            user={organisation}
            sendOtp={orgApi.sendPasswordOtp}
            changePassword={orgApi.changePassword}
            verifiedHint="A verified email is needed before your organisation can sign in"
          />
        </div>
      )}
    </>
  );
}
