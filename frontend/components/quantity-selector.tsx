'use client';

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const disabled = (n: number) => n < min || n > max;

  return (
    <div
      role="group"
      aria-label="Quantity"
      className="inline-flex items-center rounded-full border"
      style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled(value - 1)}
        className="btn btn-quiet h-9 w-9 rounded-full text-lg leading-none"
      >
        −
      </button>
      <output aria-label={`Quantity: ${value}`} className="w-9 text-center text-sm font-semibold">
        {value}
      </output>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled(value + 1)}
        className="btn btn-quiet h-9 w-9 rounded-full text-lg leading-none"
      >
        +
      </button>
    </div>
  );
}
