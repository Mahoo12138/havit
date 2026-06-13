import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Dialog, Spinner, Stack, StackTight, TextField, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import { itemsApi, itemsExtendedApi } from '../api/client';

export const Route = createFileRoute('/consumables')({
  component: ConsumablesPage,
});

function ConsumablesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCalibrate, setShowCalibrate] = useState<string | null>(null);
  const [signal, setSignal] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'consumables'],
    queryFn: async () => {
      const [a, b] = await Promise.all([
        itemsApi.list({ type: 'consumable_a' }),
        itemsApi.list({ type: 'consumable_b' }),
      ]);
      return [...a.items, ...b.items];
    },
  });

  const useOneMutation = useMutation({
    mutationFn: (id: string) => itemsExtendedApi.useOne(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items', 'consumables'] }),
  });

  const calibrateMutation = useMutation({
    mutationFn: ({ itemId, signal }: { itemId: string; signal: string }) =>
      itemsExtendedApi.createCalibrationEvent(itemId, { signal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', 'consumables'] });
      setShowCalibrate(null);
      setSignal('');
    },
  });

  const items = data ?? [];
  const warnings = items.filter(
    (item) => item.current_stock != null && item.min_stock_threshold != null && item.current_stock <= item.min_stock_threshold,
  );

  return (
    <Stack>
      <FeatureHeader
        title={t('consumables.title')}
        description={t('consumables.description')}
        meta={t('consumables.meta')}
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <MetricStrip
            metrics={[
              { label: t('consumables.tracked'), value: items.length },
              { label: t('consumables.belowThreshold'), value: warnings.length },
              {
                label: t('consumables.typeA'),
                value: items.filter((i) => i.type === 'consumable_a').length,
              },
            ]}
          />

          <DataCard title={t('consumables.stock')}>
            <div className={uiStyles.cardGrid}>
              {items.map((item) => (
                <Card className="surface-card" key={item.id}>
                  <Stack>
                    <StackTight>
                      <Row>
                        <Badge>{item.type === 'consumable_a' ? t('consumables.typeA') : t('consumables.typeB')}</Badge>
                        <h3 className={uiStyles.heading}>{item.name}</h3>
                      </Row>
                    </StackTight>
                    <StackTight>
                      <strong className={uiStyles.statValue}>
                        {item.current_stock ?? '—'}
                      </strong>
                      {item.min_stock_threshold != null && (
                        <span className={uiStyles.muted}>{t('consumables.threshold')} {item.min_stock_threshold}</span>
                      )}
                    </StackTight>
                    {item.type === 'consumable_b' && (
                      <Button
                        variant="quiet"
                        disabled={useOneMutation.isPending}
                        onClick={() => useOneMutation.mutate(item.id)}
                      >
                        {t('consumables.useOne')}
                      </Button>
                    )}
                    {item.type === 'consumable_a' && (
                      <Button
                        variant="quiet"
                        onClick={() => {
                          setShowCalibrate(item.id);
                          setSignal('');
                        }}
                      >
                        {t('consumables.calibrate')}
                      </Button>
                    )}
                  </Stack>
                </Card>
              ))}
            </div>
          </DataCard>
        </>
      )}

      {showCalibrate && (
        <Dialog open title={t('consumables.calibrateTitle')} onClose={() => setShowCalibrate(null)}>
          <Stack>
            <TextField
              label={t('consumables.signal')}
              placeholder={t('consumables.signalPlaceholder')}
              value={signal}
              onChange={(e) => setSignal(e.target.value)}
            />
            <Button
              onClick={() =>
                calibrateMutation.mutate({ itemId: showCalibrate, signal: signal || 'almost_empty' })
              }
              disabled={calibrateMutation.isPending}
            >
              {t('consumables.submitCalibration')}
            </Button>
          </Stack>
        </Dialog>
      )}
    </Stack>
  );
}

function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {children}
    </div>
  );
}
