'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { FilterSidebar } from '@/components/filter-sidebar';
import type { ShopFilters } from '@/lib/search-params';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: ShopFilters;
  onChange: (patch: Partial<ShopFilters>) => void;
  onClear: () => void;
  categories: { name: string; productCount: number }[];
}

export function FilterDrawer({ open, onClose, filters, onChange, onClear, categories }: FilterDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] lg:hidden"
        >
          <button
            aria-label="Close filters"
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: 'color-mix(in srgb, var(--text) 40%, transparent)' }}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col"
            style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
              <span className="eyebrow">Filters</span>
              <button
                onClick={onClose}
                aria-label="Close filters"
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: 'var(--elevated)', color: 'var(--text)' }}
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <FilterSidebar filters={filters} onChange={onChange} onClear={onClear} categories={categories} />
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
