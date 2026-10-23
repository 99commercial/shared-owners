import { Link } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';

export function PageLoader() {
  return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
}

export function PageError({ error, backTo, backLabel = 'Go back' }) {
  return (
    <div className="dash-card p-10 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-sm text-red-600">{error?.response?.data?.message || 'Something went wrong while loading this page'}</p>
      {backTo && <Link to={backTo} className="btn-brand-outline mt-5 inline-flex">{backLabel}</Link>}
    </div>
  );
}
