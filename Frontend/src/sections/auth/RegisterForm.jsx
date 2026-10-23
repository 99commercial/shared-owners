import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Eye, EyeOff, Loader2, User, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { commonApi } from '../../services/endpoints';
import AuthSplitLayout from '../../components/AuthSplitLayout';
import Dropdown from '../../components/Dropdown';
import { EMAIL_VERIFY_PANEL, REGISTER_PANEL } from '../../data/authPanels';
import { ORGANISATION_TYPES as ORG_TYPES } from '../../data/constants';

export default function RegisterForm() {
  const [type, setType] = useState('user');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [uForm, setUForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [oForm, setOForm] = useState({ name: '', orgType: 'housing_association', email: '', password: '' });

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await commonApi.register({
        type: 'user',
        email: uForm.email,
        password: uForm.password,
        profile: { firstName: uForm.firstName, lastName: uForm.lastName },
      });
      setRegisteredEmail(res.data.data.user.email);
      toast.success('Account created! Please verify your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await commonApi.register({
        type: 'organisation',
        email: oForm.email,
        password: oForm.password,
        profile: { name: oForm.name, type: oForm.orgType },
      });
      setRegisteredEmail(res.data.data.user.email);
      toast.success('Organisation registered! Please verify your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (registeredEmail) {
    return (
      <AuthSplitLayout {...EMAIL_VERIFY_PANEL}>
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center lg:shadow-none lg:p-0 lg:rounded-none">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verify your email</h2>
          <p className="text-gray-500 mb-6 text-sm">
            We&apos;ve sent a verification link to <strong>{registeredEmail}</strong>. Click it to activate
            your account — you can sign in once your email is verified. The link expires in 24 hours.
          </p>
          <Link to="/login" className="btn-primary w-full flex items-center justify-center">
            Go to Sign in
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            Link expired or didn&apos;t arrive?{' '}
            <Link
              to={`/resend-verification?email=${encodeURIComponent(registeredEmail)}`}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Resend verification email
            </Link>
          </p>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout {...REGISTER_PANEL}>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="text-gray-500 mt-1 text-sm">Join SharedOwnership today</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 lg:shadow-none lg:p-0 lg:rounded-none">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setType('user')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${type === 'user' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <User className="w-4 h-4" /> Individual
          </button>
          <button
            type="button"
            onClick={() => setType('organisation')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${type === 'organisation' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Briefcase className="w-4 h-4" /> Organisation
          </button>
        </div>

        {type === 'user' ? (
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                <input type="text" required value={uForm.firstName} onChange={(e) => setUForm({ ...uForm, firstName: e.target.value })} className="input-field" placeholder="Jane" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
                <input type="text" required value={uForm.lastName} onChange={(e) => setUForm({ ...uForm, lastName: e.target.value })} className="input-field" placeholder="Smith" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input type="email" required value={uForm.email} onChange={(e) => setUForm({ ...uForm, email: e.target.value })} className="input-field" placeholder="jane@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required minLength={8} value={uForm.password} onChange={(e) => setUForm({ ...uForm, password: e.target.value })} className="input-field pr-10" placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Create account
            </button>
          </form>
        ) : (
          <form onSubmit={handleOrgSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Organisation name</label>
              <input type="text" required value={oForm.name} onChange={(e) => setOForm({ ...oForm, name: e.target.value })} className="input-field" placeholder="Acme Housing Ltd" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Organisation type</label>
              <Dropdown
                aria-label="Organisation type"
                value={oForm.orgType}
                onChange={(v) => setOForm({ ...oForm, orgType: v })}
                options={ORG_TYPES}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company email</label>
              <input type="email" required value={oForm.email} onChange={(e) => setOForm({ ...oForm, email: e.target.value })} className="input-field" placeholder="contact@yourcompany.co.uk" />
              <p className="text-xs text-gray-500 mt-1">Must be a company email (no Gmail, Outlook, etc.)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required minLength={8} value={oForm.password} onChange={(e) => setOForm({ ...oForm, password: e.target.value })} className="input-field pr-10" placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Register organisation
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
