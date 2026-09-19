'use client';

interface TasteOption {
  value: string;
  label: string;
}

interface TasteSliderProps {
  label: string;
  options: TasteOption[];
  value: string;
  onChange: (value: string) => void;
}

export function TasteSlider({ label, options, value, onChange }: TasteSliderProps) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
        {label}
      </p>
      <div role="radiogroup" aria-label={label} className="flex gap-1">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              role="radio"
              aria-checked={active}
              type="button"
              onClick={() => onChange(o.value)}
              className="flex-1 rounded-full border py-1.5 text-xs font-medium transition-colors"
              style={{
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                background: active ? 'var(--accent-soft)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-2)',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
