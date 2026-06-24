import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconDots } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { categoriesApi } from '../../api/client';
import * as s from './CategoryTabs.css';

interface CategoryTabsProps {
  rootType: 'physical' | 'virtual';
  value: string;
  onChange: (v: string) => void;
}

export function CategoryTabs({ rootType, value, onChange }: CategoryTabsProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(Infinity);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const allCats = data?.categories ?? [];
  const cats = allCats.filter((c) => c.root_type === rootType);

  // Build tab list: "全部" first, then category tabs
  const allTabs = [
    { key: 'all', label: t('categories.all') },
    ...cats.map((c) => ({ key: c.name, label: c.name })),
  ];

  const overflowTabs = allTabs.slice(visibleCount);
  const hasOverflow = overflowTabs.length > 0;
  const overflowActive = overflowTabs.some((tab) => tab.key === value);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerWidth = container.clientWidth;
    // Reserve space for the "..." button (approx 40px)
    const moreButtonWidth = 40;
    let usedWidth = 0;
    let count = 0;
    for (const el of tabsRef.current) {
      if (!el) continue;
      const tabWidth = el.offsetWidth + 4; // gap
      if (usedWidth + tabWidth + moreButtonWidth > containerWidth && count > 0) {
        break;
      }
      usedWidth += tabWidth;
      count++;
    }
    setVisibleCount(Math.max(1, count));
  }, []);

  // Measure on mount, resize, and when tabs change
  useEffect(() => {
    // Initial measurement after a tick to let tabs render
    const timer = setTimeout(measure, 50);
    const container = containerRef.current;
    if (!container) return () => clearTimeout(timer);

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [measure, allTabs.length]);

  // Reset measurement when tabs change
  useEffect(() => {
    setVisibleCount(Infinity);
  }, [allTabs.length]);

  return (
    <div
      ref={containerRef}
      className={s.root}
      role="tablist"
    >
      {allTabs.map((tab, i) => {
        const isHidden = hasOverflow && i >= visibleCount;
        return (
          <button
            key={tab.key}
            ref={(el) => { tabsRef.current[i] = el; }}
            role="tab"
            className={`${s.tab}${isHidden ? ` ${s.hiddenTab}` : ''}`}
            data-selected={(isHidden ? overflowActive && value === tab.key : value === tab.key) || undefined}
            aria-selected={value === tab.key}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
      {hasOverflow && (
        <Popover open={overflowOpen} onOpenChange={setOverflowOpen}>
          <PopoverTrigger
            className={s.tab}
            data-selected={overflowActive || undefined}
          >
            <IconDots size={16} />
          </PopoverTrigger>
          <PopoverContent className={s.overflowPopup} sideOffset={6}>
            {overflowTabs.map((tab) => (
              <button
                key={tab.key}
                className={s.overflowItem}
                data-selected={value === tab.key || undefined}
                onClick={() => {
                  onChange(tab.key);
                  setOverflowOpen(false);
                }}
              >
                {tab.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
