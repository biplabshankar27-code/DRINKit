export interface FlavorMeterProfile {
  smoothness?: number;
  sweetness?: number;
  body?: number;
  oak?: number;
  smoke?: number;
}

interface FlavorMeterProps {
  profile: FlavorMeterProfile;
  compact?: boolean;
}

const ROWS: { key: keyof FlavorMeterProfile; label: string }[] = [
  { key: 'smoothness', label: 'Smoothness' },
  { key: 'sweetness', label: 'Sweetness' },
  { key: 'body', label: 'Body' },
  { key: 'oak', label: 'Oak' },
  { key: 'smoke', label: 'Smoke' },
];

const DEFAULTS: Record<string, number> = {
  smoothness: 5,
  sweetness: 3,
  body: 3,
  oak: 3,
  smoke: 1,
};

export function FlavorMeter({ profile, compact = false }: FlavorMeterProps) {
  return (
    <div className="space-y-2">
      {ROWS.map(({ key, label }) => {
        const value = Math.min(10, Math.max(0, Math.round(profile[key] ?? DEFAULTS[key])));
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-20 text-xs font-medium" style={{ color: 'var(--text-2)' }}>{label}</span>
            <div
              className={`flex gap-[3px] ${compact ? 'w-24' : 'w-40'}`}
              role="img"
              aria-label={`${label}: ${value} out of 10`}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <span
                  key={i}
                  className="h-[7px] flex-1 rounded-[2px]"
                  style={{
                    background: i < value ? 'var(--accent)' : 'var(--border)',
                    opacity: i < value ? 1 : 0.7,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
