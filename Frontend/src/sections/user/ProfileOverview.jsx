import { Link } from 'react-router-dom';
import {
  User, Mail, Phone, ShieldCheck, Hash, CalendarDays, RefreshCw, Pencil, BadgeCheck, AlertCircle, LogIn,
} from 'lucide-react';
import PageHero from '../../components/PageHero';
import { useUserProfile, formatLongDate } from '../../hooks/useUserProfile';
import { labelize } from '../../data/propertyOptions';

function InfoTile({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
      <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-brand-700" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
        <div className={`text-sm font-medium text-ink mt-0.5 break-words ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="px-6 py-6 not-first:border-t not-first:border-gray-100">
      <h3 className="text-[15px] font-semibold text-ink mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

export default function ProfileOverview() {
  const { user } = useUserProfile();
  const p = user?.userProfile || {};
  const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Your name';

  return (
    <>
      <PageHero
        label="Profile"
        title="My Profile"
        subtitle="View your personal information and account details"
        breadcrumbs={[{ label: 'Home', to: '/user' }, { label: 'Profile' }]}
        tabs={[{ key: 'profile', label: 'User Profile', icon: User }]}
        activeTab="profile"
        onTabChange={() => {}}
      />

      <div className="dash-card overflow-hidden">
        <div className="relative bg-gradient-to-r from-brand-600 to-brand-400 px-6 py-6">
          <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex flex-wrap items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white ring-4 ring-white/60 overflow-hidden flex items-center justify-center shadow-lg">
              {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-9 h-9 text-gray-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-extrabold text-white truncate">{name}</h2>
              <p className="text-sm text-white/80">Personal Information</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${user?.isActive === false ? 'bg-red-100 text-red-700' : 'bg-white text-brand-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user?.isActive === false ? 'bg-red-500' : 'bg-green-500'}`} />
                {user?.isActive === false ? 'Inactive' : 'Active'}
              </span>
              <Link to="/user/account" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-xs font-bold uppercase tracking-wide text-brand-700">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Link>
            </div>
          </div>
        </div>

        <Section title="Personal Details">
          <InfoTile icon={User} label="First Name" value={p.firstName} />
          <InfoTile icon={User} label="Last Name" value={p.lastName} />
          <InfoTile icon={Mail} label="Email Address" value={user?.email} />
          <InfoTile icon={Phone} label="Phone Number" value={p.phone} />
          <InfoTile icon={ShieldCheck} label="Role" value={user?.role ? labelize(user.role) : ''} />
          <InfoTile
            icon={user?.isVerified ? BadgeCheck : AlertCircle}
            label="Email Status"
            value={user?.isVerified ? 'Verified' : 'Not verified'}
          />
        </Section>

        <Section title="Account Information">
          <InfoTile icon={Hash} label="User ID" value={user?._id} mono />
          <InfoTile icon={CalendarDays} label="Member Since" value={formatLongDate(user?.createdAt)} />
          <InfoTile icon={RefreshCw} label="Last Updated" value={formatLongDate(user?.updatedAt)} />
          {user?.lastLogin?.at && <InfoTile icon={LogIn} label="Last Login" value={formatLongDate(user.lastLogin.at)} />}
        </Section>
      </div>
    </>
  );
}
