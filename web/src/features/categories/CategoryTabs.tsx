import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconDots } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
  const [visibleCount, setVisibleCount] = useState<number>(Infinity);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const allTabs = useMemo(() => {
    const allCats = data?.categories ?? [];
    const cats = allCats.filter((c) => c.root_type === rootType);
    return [
      { key: 'all', label: t('categories.all') },
      ...cats.map((c) => ({ key: c.name, label: c.name })),
    ];
  }, [data?.categories, rootType, t]);

  const activeIndex = allTabs.findIndex((tab) => tab.key === value);
  const baseHasOverflow = allTabs.length > visibleCount;
  const pinActiveOverflow = baseHasOverflow && activeIndex >= visibleCount && activeIndex >= 0;
  const visibleLimit = pinActiveOverflow ? Math.max(0, visibleCount - 1) : visibleCount;
  const overflowTabs = baseHasOverflow
    ? allTabs.filter((_, index) => index >= visibleLimit && !(pinActiveOverflow && index === activeIndex))
    : [];
  const hasOverflow = overflowTabs.length > 0;

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerWidth = container.clientWidth;
    const tabEls = Array.from(container.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]'));
    // Reserve space for the overflow trigger.
    const moreButtonWidth = 40;
    let usedWidth = 0;
    let count = 0;
    for (const el of tabEls) {
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
    <div ref={containerRef} className={s.root}>
      <Tabs
        value={value}
        onValueChange={(nextValue) => {
          if (typeof nextValue === 'string') onChange(nextValue);
        }}
      >
        <TabsList className={s.list}>
          {allTabs.map((tab, i) => {
            const isPinned = pinActiveOverflow && i === activeIndex;
            const isHidden = hasOverflow && !isPinned && i >= visibleLimit;
            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className={`${s.tab}${isHidden ? ` ${s.hiddenTab}` : ''}`}
                data-pinned={isPinned || undefined}
                data-selected={value === tab.key || undefined}
              >
                {tab.label}
              </TabsTrigger>
            );
          })}
          {hasOverflow && (
            <Popover open={overflowOpen} onOpenChange={setOverflowOpen}>
              <PopoverTrigger
                className={`${s.tab} ${s.overflowTrigger}`}
              >
                <IconDots size={16} />
              </PopoverTrigger>
              <PopoverContent className={s.overflowPopup} sideOffset={6}>
                {overflowTabs.map((tab) => (
                  <Button
                    key={tab.key}
                    variant="ghost"
                    size="sm"
                    className={s.overflowItem}
                    data-selected={value === tab.key || undefined}
                    onClick={() => {
                      onChange(tab.key);
                      setOverflowOpen(false);
                    }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          )}
        </TabsList>
      </Tabs>
    </div>
  );
}
