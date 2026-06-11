import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { uiStyles } from '../../components/ui';
import { buildLocationQrPayload } from './locationQr';

interface QrCodeProps {
  value: string;
  size?: number;
  alt?: string;
  className?: string;
}

export function QrCode({ value, size = 128, alt = 'QR', className }: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setDataUrl(null);

    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1A1917', light: '#FFFFFF' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) {
    return <span className={uiStyles.qrPrintNoCode}>—</span>;
  }

  if (!dataUrl) {
    return (
      <span
        className={className ?? uiStyles.qrPrintQr}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={className ?? uiStyles.qrCodeImage}
      style={{ width: size, height: size }}
    />
  );
}

interface LocationQrCodeProps {
  code: string;
  size?: number;
  alt?: string;
  className?: string;
}

export function LocationQrCode({ code, size, alt, className }: LocationQrCodeProps) {
  return (
    <QrCode
      value={buildLocationQrPayload(code)}
      size={size}
      alt={alt ?? code}
      className={className}
    />
  );
}
