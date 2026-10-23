import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Building2, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { commonApi } from '../../services/endpoints';
import AuthSplitLayout from '../../components/AuthSplitLayout';
import { PASSWORD_PANEL } from '../../data/authPanels';

export default function ResetPasswordForm() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await commonApi.resetPassword({ userId, token, newPassword: password });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthSplitLayout {...PASSWORD_PANEL}>
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center lg:shadow-none lg:p-0 lg:rounded-none">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Link to="/login" className="btn-primary inline-flex w-full justify-center">Sign in now</Link>
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
        <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
        <p className="text-gray-500 mt-1 text-sm">Choose a strong new password</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 lg:shadow-none lg:p-0 lg:rounded-none">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-10" placeholder="Min. 8 characters" autoFocus />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field" placeholder="Repeat your password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Reset password
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Link expired?{' '}
          <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">Request a new one</Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
