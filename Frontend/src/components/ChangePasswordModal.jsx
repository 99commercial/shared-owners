import { useState } from 'react';
import { X, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangePasswordModal({ onClose, sendOtpFn, changePasswordFn }) {
  const [step, setStep] = useState('send'); // send | otp
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await sendOtpFn();
      toast.success('OTP sent to your email');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await changePasswordFn({ otp, newPassword });
      toast.success('Password changed successfully!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {step === 'send' ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-primary-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Verify your identity</h4>
            <p className="text-sm text-gray-500 mb-6">We'll send a 6-digit OTP to your email address to confirm the password change.</p>
            <button onClick={handleSendOtp} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send verification code
            </button>
          </div>
        ) : (
          <form onSubmit={handleChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter 6-digit OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="input-field text-center text-xl font-mono tracking-widest"
                placeholder="000000"
              />
              <button type="button" onClick={handleSendOtp} className="text-xs text-primary-600 hover:underline mt-1">Resend OTP</button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field pr-10" placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
              <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field" placeholder="Repeat password" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Change password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
