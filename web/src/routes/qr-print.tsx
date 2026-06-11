import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconPrinter } from '@tabler/icons-react';
import { Button, uiStyles } from '../components/ui';
import { FeatureHeader } from '../features/m2/components';
import { locationsApi, type Location } from '../api/client';

export const Route = createFileRoute('/qr-print')({
  component: QrPrintPage,
});

function QrPrintPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const locations = flattenTree(data?.tree ?? []);

  function handlePrint() {
    window.print();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FeatureHeader
        title={t('qrPrint.title')}
        description={t('qrPrint.description')}
        meta="ops"
      />

      <Button
        leftSection={<IconPrinter size={15} />}
        onClick={handlePrint}
        style={{ alignSelf: 'flex-start' }}
      >
        {t('qrPrint.print')}
      </Button>

      {isLoading ? (
        <div className={uiStyles.muted}>{t('common.loading')}</div>
      ) : locations.length === 0 ? (
        <div className={uiStyles.muted}>{t('qrPrint.noLocations')}</div>
      ) : (
        <div className={uiStyles.qrPrintGrid}>
          {locations.map((loc) => (
            <div key={loc.id} className={uiStyles.qrPrintLabel}>
              <div className={uiStyles.qrPrintQr}>
                {loc.qr_code ? (
                  <span className={uiStyles.qrPrintCode}>{loc.qr_code}</span>
                ) : (
                  <span className={uiStyles.qrPrintNoCode}>—</span>
                )}
              </div>
              <div className={uiStyles.qrPrintName}>{loc.name}</div>
              {loc.parent && (
                <div className={uiStyles.qrPrintPath}>{loc.parent}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .qr-print-grid { gap: 4mm; }
          .qr-print-label {
            width: 50mm;
            height: 30mm;
            border: 0.5pt solid #ccc;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

function flattenTree(
  tree: Location[],
  parent?: string,
): Array<{ id: string; name: string; qr_code?: string; parent?: string }> {
  const result: Array<{ id: string; name: string; qr_code?: string; parent?: string }> = [];
  for (const node of tree) {
    result.push({ id: node.id, name: node.name, qr_code: node.qr_code, parent });
    if (node.children) {
      result.push(...flattenTree(node.children, node.name));
    }
  }
  return result;
}
