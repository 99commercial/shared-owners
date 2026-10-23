import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Loader2, MailWarning } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { commonApi } from '../../services/endpoints';
import AuthSplitLayout from '../../components/AuthSplitLayout';
import { LOGIN_PANEL } from '../../data/authPanels';

const REDIRECT = {
  user: '/user',
  organisation: '/org',
  'organisation-admin': '/org-admin',
  'organisation-user': '/org-user',
  admin: '/admin',
};

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUnverifiedEmail('');
    try {
      const res = await commonApi.login({ email, password });
      const { user, role, accessToken, refreshToken } = res.data.data;
      login(user, role, { accessToken, refreshToken });
      toast.success('Welcome back!');
      const from = location.state?.from;
      const next = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
        ? from
        : (REDIRECT[role] || '/');
      navigate(next);
    } catch (err) {
      const details = err.response?.data?.details;
      if (details?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(details.email || email);
      } else {
        toast.error(err.response?.data?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout {...LOGIN_PANEL}>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 lg:shadow-none lg:p-0 lg:rounded-none">
        {unverifiedEmail && (
          <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <MailWarning className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">Please verify your email first</p>
              <p className="text-amber-800 mt-1">
                Your account is created but <strong>{unverifiedEmail}</strong> isn&apos;t verified yet.
                Click the link in the verification email, or get a new one if it expired.
              </p>
              <Link
                to={`/resend-verification?email=${encodeURIComponent(unverifiedEmail)}`}
                className="inline-block mt-2 font-semibold text-primary-600 hover:text-primary-700"
              >
                Resend verification email →
              </Link>
            </div>
          </div>
        )}

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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Create one
            </Link>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Verification link expired?{' '}
            <Link to="/resend-verification" className="text-primary-600 hover:text-primary-700 font-medium">
              Resend it
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
