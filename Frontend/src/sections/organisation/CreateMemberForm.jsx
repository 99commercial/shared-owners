import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Lock, Briefcase, Phone, Eye, EyeOff, Loader2, UserPlus, KeyRound, ShieldCheck, Wand2, UserCog,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHero from '../../components/PageHero';
import { Field, TextInput, SelectInput } from '../../components/FormFields';
import { CardHeader, SubSection } from '../../components/account/SettingsCard';
import { useAuth } from '../../contexts/AuthContext';

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';

const generatePassword = (length = 14) => {
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (v) => PASSWORD_CHARS[v % PASSWORD_CHARS.length]).join('');
};

const adminName = (a) => {
  const p = a.organisationAdminProfile || {};
  return p.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : a.email;
};

/** Full-page form to add an organisation admin or user; `type` comes from ORG_MEMBER_TYPES */
export default function CreateMemberForm({ type }) {
  const { user } = useAuth();
  const domain = user?.email?.split('@')[1];
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', jobTitle: '', phone: '', email: '', password: '', confirm: '', assignedBy: '',
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const noun = type.singular.toLowerCase();

  const { data: admins } = useQuery({
    queryKey: type.assignAdmin?.queryKey || ['none'],
    queryFn: () => type.assignAdmin.list({ limit: 100, isActive: 'true' }).then((r) => r.data.data.items),
    enabled: Boolean(type.assignAdmin),
  });

  const create = useMutation({
    mutationFn: () => type.create({
      email: form.email.trim(),
      password: form.password,
      ...(form.assignedBy && { assignedBy: form.assignedBy }),
      profile: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        jobTitle: form.jobTitle.trim() || undefined,
        phone: form.phone.trim() || undefined,
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: type.queryKey });
      qc.invalidateQueries({ queryKey: type.dashboardKey });
      toast.success(`${type.singular} added. Share the password with them securely.`);
      navigate(type.path);
    },
    onError: (err) => toast.error(err.response?.data?.message || `Could not add ${noun}`),
  });

  const submit = (e) => {
    e.preventDefault();
    if (domain && !form.email.trim().toLowerCase().endsWith(`@${domain}`)) {
      return toast.error(`Email must be a company address ending in @${domain}`);
    }
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    create.mutate();
  };

  const fillGenerated = () => {
    const password = generatePassword();
    setForm((f) => ({ ...f, password, confirm: password }));
    setShow(true);
  };

  return (
    <>
      <PageHero
        label="Team"
        title={`Add ${type.singular}`}
        subtitle={type.createSubtitle}
        breadcrumbs={[{ label: 'Home', to: type.homePath }, { label: type.plural, to: type.path }, { label: `Add ${type.singular}` }]}
      />

      <form onSubmit={submit} className="space-y-6">
        <div className="dash-card overflow-hidden">
          <CardHeader icon={UserPlus} title={`${type.singular} Details`} description={`Who you're adding to your organisation`} />
          <div className="p-6 space-y-6">
            <SubSection title="Personal Information" description="Shown to your team on listings they work on">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                <Field label="First Name" required icon={User}>
                  <TextInput value={form.firstName} onChange={set('firstName')} required maxLength={50} />
                </Field>
                <Field label="Last Name" required icon={User}>
                  <TextInput value={form.lastName} onChange={set('lastName')} required maxLength={50} />
                </Field>
                <Field label="Job Title" icon={Briefcase}>
                  <TextInput value={form.jobTitle} onChange={set('jobTitle')} maxLength={80} placeholder="e.g. Sales Manager" />
                </Field>
                <Field label="Phone Number" icon={Phone}>
                  <TextInput type="tel" value={form.phone} onChange={set('phone')} placeholder="+44 7700 900000" />
                </Field>
              </div>
            </SubSection>

            {type.assignAdmin && (
              <SubSection title="Managing Admin" description="Optional. The admin who looks after this user's work">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  <Field label="Managing admin" icon={UserCog}>
                    <SelectInput
                      aria-label="Managing admin"
                      value={form.assignedBy}
                      onChange={set('assignedBy')}
                      placeholder="No managing admin"
                      options={(admins || []).map((a) => ({ value: a._id, label: adminName(a) }))}
                    />
                  </Field>
                </div>
              </SubSection>
            )}
          </div>
        </div>

        <div className="dash-card overflow-hidden">
          <CardHeader icon={ShieldCheck} title="Sign-in Details" description={`The ${noun} can sign in straight away with these`} />
          <div className="p-6 space-y-6">
            <SubSection title="Work Email" description={domain ? `Must be a company address ending in @${domain}` : undefined}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <Field label="Email Address" required icon={Mail}>
                  <TextInput type="email" value={form.email} onChange={set('email')} required placeholder={domain ? `name@${domain}` : ''} />
                </Field>
              </div>
            </SubSection>

            <SubSection title="Temporary Password" description="Minimum 8 characters. They can change it from their profile after signing in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                <Field label="Password" required icon={Lock}>
                  <TextInput type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} required minLength={8} className="pr-10" />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={show ? 'Hide password' : 'Show password'}>
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>
                <Field label="Confirm Password" required icon={KeyRound}>
                  <TextInput type={show ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} required minLength={8} />
                </Field>
              </div>
              <button type="button" onClick={fillGenerated} className="btn-brand-outline mt-4">
                <Wand2 className="w-4 h-4" /> Generate strong password
              </button>
            </SubSection>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to={type.path} className="btn-brand-outline">Cancel</Link>
          <button type="submit" disabled={create.isPending} className="btn-brand">
            {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Add {type.singular}
          </button>
        </div>
      </form>
    </>
  );
}
