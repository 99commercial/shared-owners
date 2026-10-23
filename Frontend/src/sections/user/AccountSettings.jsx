import { useState } from 'react';
import { User, Mail, Phone, Save, Loader2, UserCog } from 'lucide-react';
import { authApi } from '../../services/endpoints';
import PageHero from '../../components/PageHero';
import { Field, TextInput } from '../../components/FormFields';
import { CardHeader, SubSection } from '../../components/account/SettingsCard';
import PhotoUploader from '../../components/account/PhotoUploader';
import PasswordSecurityCard from '../../components/account/PasswordSecurityCard';
import {
  useUserProfile, useUpdateUserProfile, useUploadUserAvatar, useRemoveUserAvatar,
} from '../../hooks/useUserProfile';

/** userProfile fields saved together; the photo uploads on its own */
function ProfileDetails({ user }) {
  const p = user?.userProfile || {};
  const [form, setForm] = useState({
    firstName: p.firstName || '',
    lastName: p.lastName || '',
    phone: p.phone || '',
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const save = useUpdateUserProfile('Profile updated');
  const upload = useUploadUserAvatar();
  const remove = useRemoveUserAvatar();

  const submit = (e) => {
    e.preventDefault();
    save.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
    });
  };

  return (
    <form onSubmit={submit} className="dash-card overflow-hidden">
      <CardHeader icon={UserCog} title="Edit Profile" description="Update your photo, name and contact details" />
      <div className="p-6 space-y-6">
        <SubSection title="Profile Photo" description="Shown on your profile and dashboard">
          <PhotoUploader
            currentUrl={p.avatarUrl}
            upload={upload}
            remove={remove}
            label="Upload profile photo"
            description="Upload a clear, square photo of yourself. It's cropped to a circle automatically."
          />
        </SubSection>

        <SubSection title="Basic Information" description="Your name as shown on enquiries and listings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            <Field label="First Name" required icon={User}>
              <TextInput value={form.firstName} onChange={set('firstName')} required maxLength={50} />
            </Field>
            <Field label="Last Name" required icon={User}>
              <TextInput value={form.lastName} onChange={set('lastName')} required maxLength={50} />
            </Field>
          </div>
        </SubSection>

        <SubSection title="Contact Information" description="How buyers and admins can reach you">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            <Field label="Email Address" icon={Mail} hint="Email can't be changed">
              <TextInput value={user?.email || ''} onChange={() => {}} disabled />
            </Field>
            <Field label="Phone Number" icon={Phone}>
              <TextInput type="tel" value={form.phone} onChange={set('phone')} placeholder="+44 7700 900000" />
            </Field>
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

export default function AccountSettings() {
  const { user, isLoading } = useUserProfile();

  return (
    <>
      <PageHero
        label="Account"
        title="Edit Profile"
        subtitle="Manage your personal details, photo and security"
        breadcrumbs={[{ label: 'Home', to: '/user' }, { label: 'Profile', to: '/user/profile' }, { label: 'Edit Profile' }]}
      />

      {isLoading && !user ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : (
        <div className="space-y-6">
          <ProfileDetails key={user?._id || 'profile'} user={user} />
          <PasswordSecurityCard user={user} sendOtp={authApi.sendPasswordOtpUser} changePassword={authApi.changePasswordUser} />
        </div>
      )}
    </>
  );
}
