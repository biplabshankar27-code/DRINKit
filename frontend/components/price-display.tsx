export function PriceDisplay({ price, compareAtPrice }: { price: number; compareAtPrice?: number }) {
  const hasCompare = typeof compareAtPrice === 'number' && compareAtPrice > price;
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-bold" style={{ color: 'var(--text)' }}>
        ₹{price}
      </span>
      {hasCompare && (
        <span className="text-xs line-through" style={{ color: 'var(--text-3)' }}>
          ₹{compareAtPrice}
        </span>
      )}
    </div>
  );
}
