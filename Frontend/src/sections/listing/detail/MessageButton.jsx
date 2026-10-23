import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { chatApi } from '../../../services/endpoints';
import { chatHomeFor } from '../../../utils/chat';

/** Starts (or reopens) a chat with the listing owner. Guests are sent to log in. */
export default function MessageButton({ propertyId, tone = 'light' }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (!user) {
      toast('Log in to message the seller');
      navigate('/login', { state: { from: `/properties/${propertyId}` } });
      return;
    }
    const home = chatHomeFor(role);
    if (!home) {
      toast.error('Messaging is available on buyer and company accounts');
      return;
    }
    setBusy(true);
    try {
      const res = await chatApi.start(propertyId);
      navigate(`${home}/${res.data.data.conversation._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start the conversation');
    } finally {
      setBusy(false);
    }
  };

  const dark = tone === 'dark';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors disabled:opacity-60 ${
        dark ? 'bg-brand-500 text-white hover:bg-brand-600' : 'bg-brand-500 text-white hover:bg-brand-600'
      }`}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
      Message
    </button>
  );
}
