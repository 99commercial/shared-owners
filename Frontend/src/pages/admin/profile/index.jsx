import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, Eye, EyeOff, Loader2, Lock, Mail, Phone, Save, ShieldCheck, User, UserCircle } from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import { useAuth } from '../../../hooks/useAuth';
import PageHero from '../../../components/PageHero';
import PhotoUploader from '../../../components/account/PhotoUploader';
import { CardHeader, SubSection } from '../../../components/account/SettingsCard';
import { Field, TextInput } from '../../../components/FormFields';
import InfoTile from '../../../components/admin/InfoTile';
import { formatDate, formatDateTime } from '../../../utils/format';

const MIN_PASSWORD = 8;
const errorMessage = (err, fallback) => err.response?.data?.message || fallback;

function ProfileCard({ user, updateUser }) {
  const p = user?.adminProfile || {};
  const [form, setForm] = useState({ firstName: p.firstName || '', lastName: p.lastName || '', phone: p.phone || '' });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: () => adminApi.updateProfile(form),
    onSuccess: (res) => { updateUser(res.data.data.admin); toast.success('Profile saved'); },
    onError: (err) => toast.error(errorMessage(err, 'Could not save your profile')),
  });
  const upload = useMutation({
    mutationFn: ({ file, onProgress }) => adminApi.uploadAvatar(file, onProgress),
    onSuccess: (res) => { updateUser(res.data.data.admin); toast.success('Photo updated'); },
    onError: (err) => toast.error(errorMessage(err, 'Could not upload the photo')),
  });
  const remove = useMutation({
    mutationFn: () => adminApi.removeAvatar(),
    onSuccess: (res) => { updateUser(res.data.data.admin); toast.success('Photo removed'); },
    onError: (err) => toast.error(errorMessage(err, 'Could not remove the photo')),
  });

  const dirty = form.firstName !== (p.firstName || '') || form.lastName !== (p.lastName || '') || form.phone !== (p.phone || '');

  return (
    <div className="dash-card overflow-hidden">
      <CardHeader icon={UserCircle} title="Your profile" description="How you appear across the admin panel" />
      <div className="p-6 space-y-6">
        <SubSection title="Profile photo">
          <PhotoUploader currentUrl={p.avatarUrl} upload={upload} remove={remove} icon={Camera} description="A clear photo helps your team recognise you." />
        </SubSection>
        <SubSection title="Personal details">
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-5">
              <Field label="First name" required icon={User}><TextInput value={form.firstName} onChange={set('firstName')} required /></Field>
              <Field label="Last name" required icon={User}><TextInput value={form.lastName} onChange={set('lastName')} required /></Field>
              <Field label="Phone" icon={Phone}><TextInput value={form.phone} onChange={set('phone')} /></Field>
              <Field label="Email" icon={Mail} hint="Used to sign in; it cannot be changed here"><TextInput value={user?.email} onChange={() => {}} disabled className="bg-gray-50 text-gray-500" /></Field>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={!dirty || save.isPending} className="btn-brand disabled:opacity-50">
                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
              </button>
            </div>
          </form>
        </SubSection>
      </div>
    </div>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const change = useMutation({
    mutationFn: () => adminApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    onSuccess: () => {
      toast.success('Password changed. Your other devices were signed out.');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not change the password')),
  });

  const submit = (e) => {
    e.preventDefault();
    if (form.newPassword.length < MIN_PASSWORD) return toast.error(`Use at least ${MIN_PASSWORD} characters`);
    if (form.newPassword !== form.confirm) return toast.error('Passwords do not match');
    change.mutate();
  };

  const type = show ? 'text' : 'password';
  return (
    <div className="dash-card overflow-hidden">
      <CardHeader icon={ShieldCheck} title="Password" description="Changing it signs out your other devices" />
      <form onSubmit={submit} className="p-6 space-y-5">
        <Field label="Current password" required icon={Lock}>
          <TextInput type={type} value={form.currentPassword} onChange={set('currentPassword')} required autoComplete="current-password" className="pr-10" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={show ? 'Hide passwords' : 'Show passwords'}>
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </Field>
        <Field label="New password" required icon={Lock} hint={`At least ${MIN_PASSWORD} characters`}>
          <TextInput type={type} value={form.newPassword} onChange={set('newPassword')} required autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password" required icon={Lock}>
          <TextInput type={type} value={form.confirm} onChange={set('confirm')} required autoComplete="new-password" />
        </Field>
        <div className="flex justify-end">
          <button type="submit" disabled={change.isPending} className="btn-brand">
            {change.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Update password
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminProfilePage() {
  const { user, updateUser } = useAuth();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHero
        label="Account"
        title="My profile"
        subtitle="Your admin details, photo and password"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'My profile' }]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <InfoTile icon={ShieldCheck} label="Role" value="Platform admin" />
        <InfoTile icon={UserCircle} label="Admin since" value={formatDate(user?.createdAt)} />
        <InfoTile icon={Lock} label="Last login" value={user?.lastLogin?.at ? `${formatDateTime(user.lastLogin.at)}${user.lastLogin.ip ? ` · ${user.lastLogin.ip}` : ''}` : '—'} />
      </div>
      <div className="grid xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2"><ProfileCard user={user} updateUser={updateUser} /></div>
        <PasswordCard />
      </div>
    </div>
  );
}
