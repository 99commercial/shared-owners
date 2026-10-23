import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { commonApi } from '../../services/endpoints';
import AuthSplitLayout from '../../components/AuthSplitLayout';
import { EMAIL_VERIFY_PANEL } from '../../data/authPanels';

/** A link is single-use, so effects that run twice (StrictMode) must share one request */
const pendingVerifications = new Map();

const verifyOnce = (token, userId) => {
  const key = `${token}:${userId}`;
  if (!pendingVerifications.has(key)) {
    pendingVerifications.set(key, commonApi.verifyEmail(token, userId));
  }
  return pendingVerifications.get(key);
};

export default function VerifyEmailStatus() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    verifyOnce(token, userId)
      .then((res) => {
        if (!active) return;
        setMessage(res.data.data?.message || 'Email verified successfully!');
        setStatus('success');
      })
      .catch((err) => {
        if (!active) return;
        setMessage(
          err.response?.data?.message ||
          'This verification link is invalid or has expired. Please request a new one.'
        );
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [token, userId]);

  return (
    <AuthSplitLayout {...EMAIL_VERIFY_PANEL}>
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center lg:shadow-none lg:p-0 lg:rounded-none">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying your email…</h2>
            <p className="text-gray-500 text-sm">Please wait a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <Link to="/login" className="btn-primary inline-flex w-full justify-center">Sign in now</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <div className="space-y-3">
              <Link to="/resend-verification" className="btn-primary inline-flex w-full justify-center">
                Send a new verification link
              </Link>
              <Link to="/login" className="block text-sm text-gray-500 hover:text-gray-700">Back to Sign in</Link>
            </div>
          </>
        )}
      </div>
    </AuthSplitLayout>
  );
}
