import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconCamera, IconPlayerStop } from '@tabler/icons-react';
import { Button, uiStyles } from '../../components/ui';

interface QrScannerProps {
  onDetected: (raw: string) => void;
  busy?: boolean;
}

export function QrScanner({ onDetected, busy }: QrScannerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  async function startScanning() {
    setError(null);
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (devices.length === 0) {
        setError(t('capture.cameraError'));
        return;
      }

      setActive(true);
      const controls = await reader.decodeFromVideoDevice(
        devices[0].deviceId,
        videoRef.current!,
        (result) => {
          if (result) {
            onDetected(result.getText());
            controls.stop();
            setActive(false);
          }
        },
      );
      controlsRef.current = controls;
    } catch {
      setError(t('capture.cameraLoadError'));
      setActive(false);
    }
  }

  function stopScanning() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActive(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          background: '#111',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          display: active ? 'block' : 'none',
        }}
      >
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '2px solid rgba(13, 148, 136, 0.8)',
            borderRadius: '0.5rem',
            pointerEvents: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {!active ? (
          <Button
            leftSection={<IconCamera size={15} />}
            onClick={startScanning}
            disabled={busy}
          >
            {t('capture.openCamera')}
          </Button>
        ) : (
          <Button
            variant="quiet"
            leftSection={<IconPlayerStop size={15} />}
            onClick={stopScanning}
          >
            {t('capture.stopCamera')}
          </Button>
        )}
      </div>

      {error && <span style={{ color: 'var(--danger, #c53030)' }}>{error}</span>}
      {active && <span className={uiStyles.muted}>{t('capture.scanning')}</span>}
    </div>
  );
}
