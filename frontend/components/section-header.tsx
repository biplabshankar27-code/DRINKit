import Link from 'next/link';

export function SectionHeader({ eyebrow, title, subtitle, ctaHref, ctaLabel }: { eyebrow?: string; title: string; subtitle?: string; ctaHref?: string; ctaLabel?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="display-2">{title}</h2>
        {subtitle && <p className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>{subtitle}</p>}
      </div>
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="btn btn-quiet btn-sm">{ctaLabel} →</Link>
      )}
    </div>
  );
}

export function EmptyState({ title, message, ctaHref, ctaLabel }: { title: string; message?: string; ctaHref?: string; ctaLabel?: string }) {
  return (
    <div className="card flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="font-display text-2xl" style={{ color: 'var(--accent)' }}>{title}</div>
      {message && <p className="mt-2 max-w-md text-sm" style={{ color: 'var(--text-2)' }}>{message}</p>}
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="btn btn-primary btn-sm mt-5">{ctaLabel}</Link>
      )}
    </div>
  );
}
