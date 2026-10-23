import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, MailCheck, MailWarning } from 'lucide-react';
import toast from 'react-hot-toast';
import { commonApi } from '../../services/endpoints';
import AuthSplitLayout from '../../components/AuthSplitLayout';
import { EMAIL_VERIFY_PANEL } from '../../data/authPanels';

/** Matches the backend's one-minute cooldown between verification emails */
const RESEND_COOLDOWN_SECONDS = 60;

export default function ResendVerificationForm() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendLink = async () => {
    setLoading(true);
    try {
      await commonApi.resendVerification({ email });
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendLink();
  };

  if (sent) {
    return (
      <AuthSplitLayout {...EMAIL_VERIFY_PANEL}>
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center lg:shadow-none lg:p-0 lg:rounded-none">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MailCheck className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-6">
            If <strong>{email}</strong> belongs to an account that isn&apos;t verified yet, we&apos;ve sent a
            new verification link. It expires in 24 hours, and any older link no longer works.
          </p>
          <Link to="/login" className="btn-primary inline-flex w-full justify-center">
            Back to Sign in
          </Link>
          <button
            type="button"
            onClick={sendLink}
            disabled={loading || cooldown > 0}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700 disabled:hover:text-gray-500 disabled:cursor-not-allowed block w-full"
          >
            {cooldown > 0 ? `Didn't receive it? Resend in ${cooldown}s` : "Didn't receive it? Resend link"}
          </button>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 block w-full"
          >
            Use a different email
          </button>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout {...EMAIL_VERIFY_PANEL}>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg">
          <MailWarning className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Resend verification email</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Verification link expired or never arrived? Enter your email and we&apos;ll send a new one.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 lg:shadow-none lg:p-0 lg:rounded-none">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send verification link'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already verified?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
