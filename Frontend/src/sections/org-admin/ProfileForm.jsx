import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { orgAdminApi, authApi } from '../../services/endpoints';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/PageHeader';
import ChangePasswordModal from '../../components/ChangePasswordModal';

export default function ProfileForm() {
  const { user, updateUser } = useAuth();
  const p = user?.organisationAdminProfile || {};
  const [form, setForm] = useState({
    firstName: p.firstName || '',
    lastName: p.lastName || '',
    phone: p.phone || '',
    jobTitle: p.jobTitle || '',
  });
  const [saving, setSaving] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await orgAdminApi.updateProfile({ profile: form });
      updateUser(res.data.data);
      toast.success('Saved');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="My Profile" />
      <div className="card p-6 mb-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label><input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label><input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="input-field" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label><input value={user?.email || ''} disabled className="input-field bg-gray-50 text-gray-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title</label><input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" /></div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Save</button>
        </form>
      </div>
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Security</h3>
        <button onClick={() => setShowPassModal(true)} className="btn-secondary flex items-center gap-2 text-sm"><Lock className="w-4 h-4" />Change Password</button>
      </div>
      {showPassModal && (
        <ChangePasswordModal
          onClose={() => setShowPassModal(false)}
          sendOtpFn={() => authApi.sendPasswordOtpOrgAdmin()}
          changePasswordFn={(data) => authApi.changePasswordOrgAdmin(data)}
        />
      )}
    </div>
  );
}
