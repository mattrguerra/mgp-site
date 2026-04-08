import { useState } from 'react';
import type { SessionType, TimeSlot } from '@/lib/booking';
import SessionTypePicker from './SessionTypePicker';
import BookingCalendar from './BookingCalendar';
import BookingForm from './BookingForm';

type Step = 'type' | 'calendar' | 'form' | 'success';

export default function BookingApp() {
  const [step, setStep] = useState<Step>('type');
  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Progress indicator
  const steps: { key: Step; label: string }[] = [
    { key: 'type', label: 'Session' },
    { key: 'calendar', label: 'Date & Time' },
    { key: 'form', label: 'Details' },
  ];
  const currentIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      {step !== 'success' && (
        <div className="flex items-center gap-2 mb-12">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`
                    w-8 h-8 flex items-center justify-center font-mono text-xs flex-shrink-0
                    ${i <= currentIndex
                      ? 'bg-obsidian text-bone'
                      : 'border border-warm-gray/40 text-warm-gray'
                    }
                  `}
                >
                  {i + 1}
                </div>
                <span
                  className={`
                    font-mono text-xs uppercase tracking-widest hidden sm:inline
                    ${i <= currentIndex ? 'text-obsidian' : 'text-warm-gray'}
                  `}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`
                    h-px flex-1
                    ${i < currentIndex ? 'bg-obsidian' : 'bg-warm-gray/30'}
                  `}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Back button */}
      {step === 'calendar' && (
        <button
          onClick={() => setStep('type')}
          className="font-mono text-sm text-warm-gray hover:text-obsidian transition-colors mb-6 block"
        >
          &larr; Change session type
        </button>
      )}

      {/* Step content */}
      {step === 'type' && (
        <SessionTypePicker
          onSelect={(type) => {
            setSessionType(type);
            setStep('calendar');
          }}
        />
      )}

      {step === 'calendar' && sessionType && (
        <BookingCalendar
          sessionType={sessionType}
          onSelectSlot={(date, slot) => {
            setSelectedDate(date);
            setSelectedSlot(slot);
            setStep('form');
          }}
        />
      )}

      {step === 'form' && sessionType && selectedDate && selectedSlot && (
        <BookingForm
          sessionType={sessionType}
          date={selectedDate}
          slot={selectedSlot}
          onBack={() => setStep('calendar')}
          onSuccess={(id) => {
            setBookingId(id);
            setStep('success');
          }}
        />
      )}

      {step === 'success' && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-deep-sage/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-deep-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display font-semibold text-3xl text-obsidian mb-4">
            Request received
          </h2>
          <p className="font-body text-lg text-slate max-w-md mx-auto mb-3">
            I'll review your booking request and follow up within 24 hours with next steps and a contract.
          </p>
          <p className="font-mono text-xs text-warm-gray">
            Booking reference: {bookingId}
          </p>
          <button
            onClick={() => {
              setStep('type');
              setSessionType(null);
              setSelectedDate(null);
              setSelectedSlot(null);
              setBookingId(null);
            }}
            className="mt-8 inline-flex items-center px-6 py-3 border border-obsidian text-obsidian font-body font-medium text-sm tracking-wide hover:bg-obsidian hover:text-bone transition-colors duration-200"
          >
            Book another session
          </button>
        </div>
      )}
    </div>
  );
}
