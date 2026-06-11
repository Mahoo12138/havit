import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Badge, Button, Card, Dialog, Spinner, Stack, StackTight, TextField, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import { itemsApi, itemsExtendedApi } from '../api/client';

export const Route = createFileRoute('/consumables')({
  component: ConsumablesPage,
});

function ConsumablesPage() {
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
        title="消耗品"
        description="类型 A 用购买事件预测库存，类型 B 用一键计数和寿命倒计时。"
        meta="A/B model"
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <MetricStrip
            metrics={[
              { label: '追踪项', value: items.length },
              { label: '低于阈值', value: warnings.length },
              {
                label: '类型 A',
                value: items.filter((i) => i.type === 'consumable_a').length,
              },
            ]}
          />

          <DataCard title="库存管理">
            <div className={uiStyles.cardGrid}>
              {items.map((item) => (
                <Card className="surface-card" key={item.id}>
                  <Stack>
                    <StackTight>
                      <Row>
                        <Badge>{item.type === 'consumable_a' ? '类型 A' : '类型 B'}</Badge>
                        <h3 className={uiStyles.heading}>{item.name}</h3>
                      </Row>
                    </StackTight>
                    <StackTight>
                      <strong className={uiStyles.statValue}>
                        {item.current_stock ?? '—'}
                      </strong>
                      {item.min_stock_threshold != null && (
                        <span className={uiStyles.muted}>阈值 {item.min_stock_threshold}</span>
                      )}
                    </StackTight>
                    {item.type === 'consumable_b' && (
                      <Button
                        variant="quiet"
                        disabled={useOneMutation.isPending}
                        onClick={() => useOneMutation.mutate(item.id)}
                      >
                        使用一个
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
                        校准
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
        <Dialog open title="校准消耗速度" onClose={() => setShowCalibrate(null)}>
          <Stack>
            <TextField
              label="信号"
              placeholder="例如：plenty_left 或 almost_empty"
              value={signal}
              onChange={(e) => setSignal(e.target.value)}
            />
            <Button
              onClick={() =>
                calibrateMutation.mutate({ itemId: showCalibrate, signal: signal || 'almost_empty' })
              }
              disabled={calibrateMutation.isPending}
            >
              提交校准
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
