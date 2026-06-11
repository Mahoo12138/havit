import { uiStyles } from '../../components/ui';
import { LocationQrCode } from './QrCode';

interface QrPrintLabelProps {
  name: string;
  code?: string;
  path?: string;
}

export function QrPrintLabel({ name, code, path }: QrPrintLabelProps) {
  return (
    <div className={uiStyles.qrPrintLabel}>
      <div className={uiStyles.qrPrintQr}>
        {code ? (
          <LocationQrCode code={code} size={64} alt={name} />
        ) : (
          <span className={uiStyles.qrPrintNoCode}>—</span>
        )}
      </div>
      {code && <span className={uiStyles.qrPrintCode}>{code}</span>}
      <div className={uiStyles.qrPrintName}>{name}</div>
      {path && <div className={uiStyles.qrPrintPath}>{path}</div>}
    </div>
  );
}
