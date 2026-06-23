import { useTranslation } from 'react-i18next';

import * as s from './status-badge.css';

type StatusBadgeProps = {
  status: string;
};

function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const className = s.variant[status as keyof typeof s.variant] ?? s.variant.idle;

  return <span className={className}>{t(`status.${status}`, status)}</span>;
}

export { StatusBadge };
