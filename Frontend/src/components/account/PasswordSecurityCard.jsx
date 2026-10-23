import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  ShieldCheck, Save, Loader2, Lock, KeyRound, Eye, EyeOff, BadgeCheck, AlertCircle, Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { commonApi } from '../../services/endpoints';
import { Field, TextInput } from '../FormFields';
import { CardHeader, SubSection } from './SettingsCard';

/** Email verification status + OTP password change; sendOtp / changePassword are the role's API calls */
export default function PasswordSecurityCard({ user, sendOtp, changePassword, verifiedHint = 'A verified email is needed to receive enquiries' }) {
  const [otpSent, setOtpSent] = useState(false);
  const [form, setForm] = useState({ otp: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const requestOtp = useMutation({
    mutationFn: sendOtp,
    onSuccess: () => { setOtpSent(true); toast.success('Verification code sent to your email'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send code'),
  });

  const change = useMutation({
    mutationFn: () => changePassword({ otp: form.otp, newPassword: form.newPassword }),
    onSuccess: () => {
      toast.success('Password changed');
      setForm({ otp: '', newPassword: '', confirm: '' });
      setOtpSent(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  const resend = useMutation({
    mutationFn: () => commonApi.resendVerification({ email: user.email }),
    onSuccess: () => toast.success('Verification email sent. Check your inbox.'),
    onError: (err) => toast.error(err.response?.data?.message || 'Could not send email'),
  });

  const submit = (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return toast.error('Passwords do not match');
    change.mutate();
  };

  return (
    <div className="dash-card overflow-hidden">
      <CardHeader icon={ShieldCheck} title="Password & Security" description="Keep your account secure" />
      <div className="p-6 space-y-6">
        <SubSection title="Email Verification" description={verifiedHint}>
          {user?.isVerified ? (
            <p className="text-sm text-green-700 flex items-center gap-2"><BadgeCheck className="w-4 h-4" /> Your email address is verified.</p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-sm text-amber-800 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Your email address isn't verified yet.</p>
              <button type="button" onClick={() => resend.mutate()} disabled={resend.isPending} className="btn-brand-outline">
                {resend.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Resend email
              </button>
            </div>
          )}
        </SubSection>

        <SubSection title="Change Password" description="We'll email you a 6-digit code to confirm it's you">
          {!otpSent ? (
            <button type="button" onClick={() => requestOtp.mutate()} disabled={requestOtp.isPending} className="btn-brand">
              {requestOtp.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Send Verification Code
            </button>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-5">
                <Field label="Verification Code" required icon={KeyRound}>
                  <TextInput value={form.otp} onChange={(v) => set('otp')(v.replace(/\D/g, ''))} maxLength={6} required className="font-mono tracking-widest" placeholder="000000" />
                </Field>
                <Field label="New Password" required icon={Lock} hint="Minimum 8 characters">
                  <TextInput type={show ? 'text' : 'password'} value={form.newPassword} onChange={set('newPassword')} minLength={8} required className="pr-10" />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={show ? 'Hide password' : 'Show password'}>
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>
                <Field label="Confirm Password" required icon={Lock}>
                  <TextInput type={show ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} required />
                </Field>
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" onClick={() => requestOtp.mutate()} disabled={requestOtp.isPending} className="btn-brand-outline">Resend Code</button>
                <button type="submit" disabled={change.isPending} className="btn-brand">
                  {change.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Password
                </button>
              </div>
            </form>
          )}
        </SubSection>
      </div>
    </div>
  );
}
