import { useState } from 'react';
import type { SessionType, TimeSlot } from '@/lib/booking';

interface Props {
  sessionType: SessionType;
  date: string;
  slot: TimeSlot;
  onSuccess: (bookingId: string) => void;
  onBack: () => void;
}

export default function BookingForm({ sessionType, date, slot, onSuccess, onBack }: Props) {
  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    businessName: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/booking/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionTypeId: sessionType.id,
          date,
          startTime: slot.start,
          ...form,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      onSuccess(data.bookingId);
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setSubmitting(false);
    }
  };

  const [y, m, d] = date.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dateLabel = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div>
      <h2 className="font-display font-semibold text-2xl text-obsidian mb-2">
        Your details
      </h2>

      {/* Booking summary */}
      <div className="bg-obsidian/5 p-5 mb-8 border border-warm-gray/20">
        <div className="font-mono text-xs uppercase tracking-widest text-warm-gray mb-2">
          Booking Summary
        </div>
        <p className="font-display font-semibold text-obsidian">
          {sessionType.name}
        </p>
        <p className="font-body text-sm text-slate mt-1">
          {dateLabel}
        </p>
        <p className="font-body text-sm text-slate">
          {formatTime(slot.start)} &ndash; {formatTime(slot.end)}
        </p>
        <button
          onClick={onBack}
          className="font-mono text-xs text-copper mt-3 hover:underline"
        >
          Change date/time
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="font-mono text-xs uppercase tracking-widest text-warm-gray block mb-2">
            Name *
          </label>
          <input
            type="text"
            name="clientName"
            required
            value={form.clientName}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-warm-gray/30 bg-white text-obsidian font-body text-sm focus:outline-none focus:border-copper transition-colors"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="font-mono text-xs uppercase tracking-widest text-warm-gray block mb-2">
            Email *
          </label>
          <input
            type="email"
            name="clientEmail"
            required
            value={form.clientEmail}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-warm-gray/30 bg-white text-obsidian font-body text-sm focus:outline-none focus:border-copper transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="font-mono text-xs uppercase tracking-widest text-warm-gray block mb-2">
            Phone
          </label>
          <input
            type="tel"
            name="clientPhone"
            value={form.clientPhone}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-warm-gray/30 bg-white text-obsidian font-body text-sm focus:outline-none focus:border-copper transition-colors"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="font-mono text-xs uppercase tracking-widest text-warm-gray block mb-2">
            Business / Brand
          </label>
          <input
            type="text"
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-warm-gray/30 bg-white text-obsidian font-body text-sm focus:outline-none focus:border-copper transition-colors"
            placeholder="Your business name (if applicable)"
          />
        </div>

        <div>
          <label className="font-mono text-xs uppercase tracking-widest text-warm-gray block mb-2">
            Tell me about the shoot
          </label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-warm-gray/30 bg-white text-obsidian font-body text-sm focus:outline-none focus:border-copper transition-colors resize-none"
            placeholder="What are you looking to capture? Any specific vision, products, or goals for this session?"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 font-body text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`
            w-full py-4 font-body font-medium text-sm tracking-wide transition-all duration-200
            ${submitting
              ? 'bg-warm-gray text-bone cursor-wait'
              : 'bg-obsidian text-bone hover:bg-slate'
            }
          `}
        >
          {submitting ? 'Submitting...' : 'Request This Session'}
        </button>

        <p className="font-body text-xs text-warm-gray text-center">
          This is a request, not a confirmed booking. I'll review and follow up within 24 hours with next steps and a contract via HoneyBook.
        </p>
      </form>
    </div>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}
