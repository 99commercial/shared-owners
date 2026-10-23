import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { commonApi } from '../../services/endpoints';

const EMPTY_FORM = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sent, setSent] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const send = useMutation({
    mutationFn: () => commonApi.sendContactMessage({ ...form, phone: form.phone.trim() || undefined }),
    onSuccess: () => {
      setSent(true);
      toast.success("Message sent! We'll be in touch soon.");
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not send your message. Please try again.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    send.mutate();
  };

  if (sent) {
    return (
      <div className="card p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
        <p className="text-gray-500 text-sm mb-6">Thank you for reaching out. We'll get back to you within 24 hours.</p>
        <button onClick={() => { setSent(false); setForm(EMPTY_FORM); }} className="btn-secondary">Send another message</button>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your name</label>
            <input type="text" required maxLength={120} value={form.name} onChange={set('name')} className="input-field" placeholder="Jane Smith" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input type="email" required value={form.email} onChange={set('email')} className="input-field" placeholder="jane@example.com" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="tel" maxLength={20} value={form.phone} onChange={set('phone')} className="input-field" placeholder="07700 900123" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input type="text" required maxLength={200} value={form.subject} onChange={set('subject')} className="input-field" placeholder="How can we help?" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
          <textarea required rows={5} maxLength={5000} value={form.message} onChange={set('message')} className="input-field resize-none" placeholder="Tell us more…" />
        </div>
        <button type="submit" disabled={send.isPending} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          {send.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {send.isPending ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </div>
  );
}
