import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconChevronLeft, IconChevronRight, IconDots } from '@tabler/icons-react';

import { Button } from './button';
import * as s from './pagination.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cx(s.root, className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cx(s.content, className)}
      {...props}
    />
  );
}

function PaginationItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" className={cx(s.item, className)} {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
  disabled?: boolean;
  size?: 'icon' | 'icon-xs' | 'icon-sm' | 'default' | 'sm' | 'xs';
} & Omit<React.ComponentProps<'a'>, 'onClick'> & {
  onClick?: React.ComponentProps<typeof Button>['onClick'];
};

function PaginationLink({
  className,
  isActive,
  disabled,
  size = 'icon-xs',
  onClick,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? 'outline' : 'ghost'}
      size={size}
      className={cx(disabled && s.linkDisabled, className)}
      nativeButton={false}
      disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
      onClick={
        disabled
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
            }
          : onClick
      }
      render={
        <a
          aria-current={isActive ? 'page' : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    />
  );
}

function PaginationPrevious({
  className,
  text,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  const { t } = useTranslation();
  return (
    <PaginationLink aria-label={t('pagination.previous')} size="xs" className={className} {...props}>
      <IconChevronLeft size={14} data-icon="inline-start" />
      <span className={s.prevNextText}>{text ?? t('pagination.previous')}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  const { t } = useTranslation();
  return (
    <PaginationLink aria-label={t('pagination.next')} size="xs" className={className} {...props}>
      <span className={s.prevNextText}>{text ?? t('pagination.next')}</span>
      <IconChevronRight size={14} data-icon="inline-end" />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  const { t } = useTranslation();
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cx(s.ellipsis, className)}
      {...props}
    >
      <IconDots size={14} />
      <span className={s.srOnly}>{t('pagination.more')}</span>
    </span>
  );
}

/**
 * Page range with ellipsis markers, following shadcn's usePagination range
 * helper: always shows the first and last page plus `siblingCount` pages
 * on each side of the current one; dropped spans collapse into ellipsis items.
 */
function usePaginationRange({
  page,
  totalPages,
  siblingCount = 1,
}: {
  page: number;
  totalPages: number;
  siblingCount?: number;
}): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  return useMemo(() => {
    const totalSpots = siblingCount * 2 + 5;
    if (totalPages <= totalSpots) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const left = Math.max(page - siblingCount, 1);
    const right = Math.min(page + siblingCount, totalPages);
    const showLeftEllipsis = left > 2;
    const showRightEllipsis = right < totalPages - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      const count = left + (2 * siblingCount + 2);
      return [...Array.from({ length: count }, (_, i) => i + 1), 'ellipsis-end', totalPages];
    }
    if (showLeftEllipsis && !showRightEllipsis) {
      const count = (2 * siblingCount + 2) + (totalPages - right) + 1;
      return [1, 'ellipsis-start', ...Array.from({ length: count }, (_, i) => totalPages - count + 1 + i)];
    }
    return [
      1,
      'ellipsis-start',
      ...Array.from({ length: right - left + 1 }, (_, i) => left + i),
      'ellipsis-end',
      totalPages,
    ];
  }, [page, totalPages, siblingCount]);
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  usePaginationRange,
};
