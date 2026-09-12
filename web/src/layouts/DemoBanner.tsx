import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconInfoCircle, IconX } from '@tabler/icons-react';

import { uiStyles } from '../components/ui';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';

const DISMISSED_KEY = 'havit-demo-banner-dismissed';

export function DemoBanner({ version }: { version: string }) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1',
  );

  if (dismissed) return null;

  return (
    <div className={uiStyles.bannerOffset}>
      <Alert icon={<IconInfoCircle size={18} />}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div>
              <strong>{t('demo.mode')}</strong>{' '}
              <span className={uiStyles.muted}>
                {t('demo.version')} {version}
              </span>
            </div>
            <div>{t('demo.description')}</div>
          </div>
          <Button
            variant="subtle"
            size="icon-xs"
            aria-label={t('common.close')}
            onClick={() => {
              localStorage.setItem(DISMISSED_KEY, '1');
              setDismissed(true);
            }}
          >
            <IconX size={14} />
          </Button>
        </div>
      </Alert>
    </div>
  );
}
