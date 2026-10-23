import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { commonApi } from '../../services/endpoints';
import AuthSplitLayout from '../../components/AuthSplitLayout';
import { PASSWORD_PANEL } from '../../data/authPanels';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await commonApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthSplitLayout {...PASSWORD_PANEL}>
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center lg:shadow-none lg:p-0 lg:rounded-none">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-6">
            If <strong>{email}</strong> is registered, we've sent a password reset link.
            Check your inbox and click the link to reset your password.
          </p>
          <Link to="/login" className="btn-primary inline-flex w-full justify-center">
            Back to Sign in
          </Link>
          <button
            onClick={() => setSent(false)}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700 block w-full"
          >
            Didn't receive it? Try again
          </button>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout {...PASSWORD_PANEL}>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Forgot your password?</h1>
        <p className="text-gray-500 mt-1 text-sm">Enter your email and we'll send you a reset link</p>
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
              autoFocus
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send reset link
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Remembered it?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Back to Sign in</Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
