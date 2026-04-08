import { useState, useEffect } from 'react';
import type { SessionType } from '@/lib/booking';

interface Props {
  onSelect: (sessionType: SessionType) => void;
}

export default function SessionTypePicker({ onSelect }: Props) {
  const [types, setTypes] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/booking/session-types')
      .then(res => res.json())
      .then((data: SessionType[]) => {
        setTypes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load session types:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display font-semibold text-2xl text-obsidian mb-2">
        What are you looking for?
      </h2>
      <p className="font-body text-warm-gray mb-8">
        Select a session type to see available dates.
      </p>

      <div className="grid gap-4">
        {types.map(type => (
          <button
            key={type.id}
            onClick={() => {
              setSelected(type.id);
              onSelect(type);
            }}
            className={`
              w-full text-left p-6 border transition-all duration-200
              ${selected === type.id
                ? 'border-copper bg-copper/5'
                : 'border-warm-gray/30 hover:border-copper/50'
              }
            `}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold text-lg text-obsidian">
                  {type.name}
                </h3>
                <p className="font-body text-sm text-warm-gray mt-1">
                  {type.description}
                </p>
                <p className="font-mono text-xs uppercase tracking-widest text-warm-gray mt-3">
                  {formatDuration(type.duration_minutes)}
                </p>
              </div>
              <span className="font-mono text-sm text-copper whitespace-nowrap">
                {type.price_note}
              </span>
            </div>
          </button>
        ))}
      </div>
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
