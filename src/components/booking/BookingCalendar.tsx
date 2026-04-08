import { useState, useEffect } from 'react';
import type { SessionType, TimeSlot, DayAvailability } from '@/lib/booking';

interface Props {
  sessionType: SessionType;
  onSelectSlot: (date: string, slot: TimeSlot) => void;
}

export default function BookingCalendar({ sessionType, onSelectSlot }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const monthStr = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}`;

  useEffect(() => {
    setLoading(true);
    setSelectedDate(null);
    setSelectedSlot(null);

    fetch(`/api/booking/availability?month=${monthStr}&type=${sessionType.slug}`)
      .then(res => res.json())
      .then(data => {
        setAvailability(data.availability || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load availability:', err);
        setLoading(false);
      });
  }, [monthStr, sessionType.slug]);

  const availableDates = new Set(availability.map(d => d.date));

  // Calendar grid
  const firstOfMonth = new Date(currentMonth.year, currentMonth.month - 1, 1);
  const daysInMonth = new Date(currentMonth.year, currentMonth.month, 0).getDate();
  const startDay = firstOfMonth.getDay(); // 0=Sun

  const prevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 1) return { year: prev.year - 1, month: 12 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 12) return { year: prev.year + 1, month: 1 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const monthLabel = firstOfMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const selectedDaySlots = selectedDate
    ? availability.find(d => d.date === selectedDate)?.slots || []
    : [];

  return (
    <div>
      <h2 className="font-display font-semibold text-2xl text-obsidian mb-2">
        Pick a date
      </h2>
      <p className="font-body text-warm-gray mb-8">
        {sessionType.name} — {formatDuration(sessionType.duration_minutes)}
      </p>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="font-mono text-sm text-warm-gray hover:text-obsidian transition-colors px-3 py-1"
        >
          &larr; Prev
        </button>
        <span className="font-display font-semibold text-lg text-obsidian">
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          className="font-mono text-sm text-warm-gray hover:text-obsidian transition-colors px-3 py-1"
        >
          Next &rarr;
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-8">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="font-mono text-xs text-center text-warm-gray py-2 uppercase tracking-widest">
                {d}
              </div>
            ))}

            {/* Empty cells for offset */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isAvailable = availableDates.has(dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  disabled={!isAvailable}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setSelectedSlot(null);
                  }}
                  className={`
                    aspect-square flex items-center justify-center text-sm font-body transition-all duration-150
                    ${isSelected
                      ? 'bg-obsidian text-bone'
                      : isAvailable
                        ? 'text-obsidian hover:bg-copper/10 cursor-pointer'
                        : 'text-warm-gray/40 cursor-not-allowed'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div>
              <h3 className="font-display font-semibold text-lg text-obsidian mb-4">
                Available times — {formatDateLabel(selectedDate)}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {selectedDaySlots.map(slot => {
                  const isSelected = selectedSlot?.start === slot.start;
                  return (
                    <button
                      key={slot.start}
                      onClick={() => {
                        setSelectedSlot(slot);
                        onSelectSlot(selectedDate, slot);
                      }}
                      className={`
                        py-3 px-4 text-center font-mono text-sm transition-all duration-150 border
                        ${isSelected
                          ? 'bg-copper text-bone border-copper'
                          : 'border-warm-gray/30 text-obsidian hover:border-copper'
                        }
                      `}
                    >
                      {formatTime(slot.start)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
