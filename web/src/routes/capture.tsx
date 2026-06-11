import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import { IconBarcode, IconCamera, IconEdit, IconPlayerStop } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Badge, Button, Card, StackTight, TextField, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader } from '../features/m2/components';
import { barcodeApi, aiApi, itemsApi } from '../api/client';

export const Route = createFileRoute('/capture')({
  component: CapturePage,
});

function CapturePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [result, setResult] = useState<any>(null);
  const [resultType, setResultType] = useState<'barcode' | 'ai' | null>(null);

  const barcodeMutation = useMutation({
    mutationFn: (code: string) => barcodeApi.lookup(code),
    onSuccess: (data) => {
      setResult(data);
      setResultType('barcode');
      if (data.draft?.name) setDraftName(data.draft.name);
      if (data.draft?.category) setDraftCategory(data.draft.category);
      if (data.draft?.description) setDraftDescription(data.draft.description);
    },
  });

  const aiMutation = useMutation({
    mutationFn: (file: File) => {
      const tempId = 'temp-' + Date.now();
      return aiApi.recognizePhoto(tempId, file);
    },
    onSuccess: (data) => {
      setResult(data);
      setResultType('ai');
      if (data.draft?.name) setDraftName(data.draft.name);
      if (data.draft?.category) setDraftCategory(data.draft.category);
      if (data.draft?.description) setDraftDescription(data.draft.description);
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      itemsApi.create({
        name: draftName,
        category: draftCategory || undefined,
        description: draftDescription || undefined,
        type: 'durable',
      }),
    onSuccess: () => {
      navigate({ to: '/items' });
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FeatureHeader
        title="录入增强"
        description="条码扫描、AI 拍照识别和手动兜底共用一套确认队列。"
        meta="P1 capture"
      />

      <div className={uiStyles.featureGrid}>
        <ActionCard
          icon={<IconBarcode size={18} />}
          title="条码扫描"
          body="输入商品条码，从 Open Food Facts 查询商品信息。"
        />
        <ActionCard
          icon={<IconCamera size={18} />}
          title="AI 拍照识别"
          body="上传物品照片，AI 自动识别名称和分类。"
        />
        <ActionCard
          icon={<IconEdit size={18} />}
          title="手动录入"
          body="直接填写物品信息，快速完成录入。"
        />
      </div>

      <div className={uiStyles.twoColumn}>
        <DataCard title="条码查询">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <CameraScanner
              onDetected={(code) => {
                setBarcode(code);
                barcodeMutation.mutate(code);
              }}
              scanning={barcodeMutation.isPending}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--line, #e2e0d8)' }} />
              <span className={uiStyles.muted}>或手动输入</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--line, #e2e0d8)' }} />
            </div>
            <TextField
              label="条码号"
              placeholder="输入商品条码"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
            <Button
              onClick={() => barcodeMutation.mutate(barcode)}
              disabled={!barcode || barcodeMutation.isPending}
            >
              查询条码
            </Button>
            {barcodeMutation.isError && (
              <span style={{ color: 'var(--danger, #c53030)' }}>查询失败</span>
            )}
          </div>
        </DataCard>

        <DataCard title="AI 拍照识别">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) aiMutation.mutate(file);
              }}
            />
            <Button
              leftSection={<IconCamera size={15} />}
              onClick={() => fileInputRef.current?.click()}
              disabled={aiMutation.isPending}
            >
              {aiMutation.isPending ? '识别中…' : '拍照识别'}
            </Button>
            {aiMutation.isError && (
              <span style={{ color: 'var(--danger, #c53030)' }}>识别失败</span>
            )}
          </div>
        </DataCard>
      </div>

      {(result || resultType) && (
        <DataCard title="确认并保存">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Badge>{resultType === 'barcode' ? '条码' : 'AI 识别'}</Badge>
            <TextField label="名称" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
            <TextField label="分类" value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} />
            <TextField label="描述" value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} />
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!draftName || createMutation.isPending}
            >
              {createMutation.isPending ? '保存中…' : '保存物品'}
            </Button>
          </div>
        </DataCard>
      )}
    </div>
  );
}

function ActionCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="surface-card">
      <StackTight>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={uiStyles.iconTile}>{icon}</span>
          <h3 className={uiStyles.heading}>{title}</h3>
        </div>
        <p className={uiStyles.help}>{body}</p>
      </StackTight>
    </Card>
  );
}

function CameraScanner({
  onDetected,
  scanning,
}: {
  onDetected: (code: string) => void;
  scanning: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, []);

  async function startScanning() {
    setError(null);
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();

      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        setError('未检测到摄像头');
        return;
      }

      setActive(true);

      const controls = await reader.decodeFromVideoDevice(
        videoInputDevices[0].deviceId,
        videoRef.current!,
        (result: any) => {
          if (result) {
            onDetected(result.getText());
            controls.stop();
            setActive(false);
          }
        },
      );
      controlsRef.current = controls;
    } catch {
      setError('加载扫码模块失败，请使用手动输入');
      setActive(false);
    }
  }

  function stopScanning() {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
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
            disabled={scanning}
          >
            开启摄像头扫码
          </Button>
        ) : (
          <Button
            variant="quiet"
            leftSection={<IconPlayerStop size={15} />}
            onClick={stopScanning}
          >
            停止
          </Button>
        )}
      </div>

      {error && (
        <span style={{ color: 'var(--danger, #c53030)' }}>{error}</span>
      )}

      {active && (
        <span className={uiStyles.muted}>对准条码，自动识别中…</span>
      )}
    </div>
  );
}
