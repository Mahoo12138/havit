import { useId, type HTMLAttributes, type ReactNode } from 'react';

import { Card, CardToolbar } from './card';
import * as s from './table-card.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export interface TableCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  count?: ReactNode;
  description?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  ariaLabel?: string;
  contentClassName?: string;
}

/**
 * Standard shell for table-first cards.
 *
 * Header contract: a 56px toolbar with an optional heading (title/count/
 * description) and an optional control cluster (filters/meta/actions). When
 * there is no heading, filters occupy the left side. Rows and pagination are
 * passed through `children` and `footer`; the card is always flush.
 */
export function TableCard({
  title,
  count,
  description,
  filters,
  actions,
  meta,
  footer,
  ariaLabel,
  contentClassName,
  children,
  className,
  ...props
}: TableCardProps) {
  const titleId = useId();
  const hasHeading = title != null || description != null || count != null;
  const fallbackLabel = ariaLabel ?? (typeof title === 'string' ? title : undefined);

  return (
    <Card
      flush
      role="region"
      aria-labelledby={title != null ? titleId : undefined}
      aria-label={title != null ? undefined : fallbackLabel}
      className={cx(s.root, className)}
      {...props}
    >
      <CardToolbar>
        {hasHeading ? (
          <div className={s.heading}>
            {(title != null || count != null) && (
              <div className={s.titleRow}>
                {title != null && (
                  <h2
                    id={titleId}
                    className={s.title}
                    title={typeof title === 'string' ? title : undefined}
                  >
                    {title}
                  </h2>
                )}
                {count != null && (
                  <span className={s.count} aria-live="polite">
                    {count}
                  </span>
                )}
              </div>
            )}
            {description != null && <div className={s.description}>{description}</div>}
          </div>
        ) : filters ? (
          <div className={s.filters}>{filters}</div>
        ) : (
          <span />
        )}

        {(actions != null || meta != null || (hasHeading && filters != null)) && (
          <div className={s.controls}>
            {hasHeading && filters != null && <div className={s.filters}>{filters}</div>}
            {meta != null && (
              <span className={s.meta} aria-live="polite">
                {meta}
              </span>
            )}
            {actions != null && <div className={s.actions}>{actions}</div>}
          </div>
        )}
      </CardToolbar>

      <div className={cx(s.body, contentClassName)}>{children}</div>

      {footer != null && <div className={s.footer}>{footer}</div>}
    </Card>
  );
}
