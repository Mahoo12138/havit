import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconFileImport, IconInfoCircle } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Row,
  Stack,
  StackTight,
  uiStyles,
  useToast,
} from '../components/ui';
import { importApi, type ImportResult } from '../api/client';
import { useNetworkStatus } from '../utils/useNetworkStatus';

export const Route = createFileRoute('/import')({
  component: ImportPage,
});

function ImportPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const isOnline = useNetworkStatus();

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const format = file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv';
      const text = await file.text();
      return importApi.items(format, text);
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['locations'] });
      toast.show(`已创建 ${data.created} 条，失败 ${data.failed} 条`);
    },
    onError: (e: Error) => toast.show(`导入失败：${e.message}`),
  });

  return (
    <Stack>
      <StackTight>
        <h2 className="page-heading">批量导入</h2>
        <p className="page-kicker">
          从旧表格或 JSON 备份迁移资产，合法行会独立写入。
        </p>
      </StackTight>

      <Alert icon={<IconInfoCircle size={18} />}>
        <div>
          支持 <Code>.csv</Code> / <Code>.json</Code> 文件。CSV 列名规范：
          <Code>
            name, type, category, description, location, purchase_price,
            purchase_currency, purchase_date, serial_number
          </Code>
          。
          <br />
          <strong>name</strong> 必填；<strong>type</strong> 留空默认{' '}
          <Code>durable</Code>。
          <br />
          <strong>location</strong> 支持路径分隔符 <Code>→</Code>{' '}
          <Code>/</Code> <Code>{'->'}</Code>，缺失节点自动创建。
          <br />
          <strong>purchase_date</strong> 接受 <Code>YYYY-MM-DD</Code>、
          <Code>YYYY/MM/DD</Code> 或 epoch 秒。
        </div>
      </Alert>

      <Card className="surface-card">
        <Stack>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) upload.mutate(file);
              event.currentTarget.value = '';
            }}
          />
          <Button
            leftSection={<IconFileImport size={16} />}
            disabled={!isOnline || upload.isPending}
            title={!isOnline ? '离线模式下无法导入' : undefined}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? '导入中...' : '选择文件'}
          </Button>
          <p className={uiStyles.help}>
            整批以单个事务提交。所有合法行成功创建，错误行不影响其它行写入。
          </p>
        </Stack>
      </Card>

      {result && (
        <Card className="surface-card">
          <Stack>
            <Row>
              <h3 className={uiStyles.heading}>结果</h3>
              <Badge>共 {result.total}</Badge>
              <Badge>已创建 {result.created}</Badge>
              <Badge>失败 {result.failed}</Badge>
            </Row>
            {result.errors && result.errors.length > 0 && (
              <div>
                <p className={uiStyles.muted}>失败行：</p>
                <ul>
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      第 {e.line} 行 {e.name && <Code>{e.name}</Code>}：
                      {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
