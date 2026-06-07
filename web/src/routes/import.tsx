import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  FileButton,
  Group,
  List,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFileImport, IconInfoCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { importApi, type ImportResult } from '../api/client';

export const Route = createFileRoute('/import')({
  component: ImportPage,
});

function ImportPage() {
  const qc = useQueryClient();
  const [result, setResult] = useState<ImportResult | null>(null);

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
      notifications.show({
        color: data.failed > 0 ? 'yellow' : 'green',
        message: `已创建 ${data.created} 条，失败 ${data.failed} 条`,
      });
    },
    onError: (e: Error) =>
      notifications.show({ color: 'red', message: `导入失败：${e.message}` }),
  });

  return (
    <Stack>
      <Title order={2}>批量导入</Title>

      <Alert color="blue" icon={<IconInfoCircle />}>
        支持 <Code>.csv</Code> / <Code>.json</Code> 文件。CSV 列名规范：
        <Code>name, type, category, description, location, purchase_price,
        purchase_currency, purchase_date, serial_number</Code>。
        <br />
        <Text span fw={500}>name</Text> 必填；<Text span fw={500}>type</Text>
        留空默认 <Code>durable</Code>。
        <br />
        <Text span fw={500}>location</Text> 支持路径分隔符
        <Code>→</Code> <Code>/</Code> <Code>{'->'}</Code>，缺失节点自动创建。
        <br />
        <Text span fw={500}>purchase_date</Text> 接受
        <Code>YYYY-MM-DD</Code>、<Code>YYYY/MM/DD</Code> 或 epoch 秒。
      </Alert>

      <Card withBorder>
        <Stack>
          <FileButton onChange={(f) => f && upload.mutate(f)} accept=".csv,.json,text/csv,application/json">
            {(props) => (
              <Button {...props} leftSection={<IconFileImport size={16} />} loading={upload.isPending}>
                选择文件
              </Button>
            )}
          </FileButton>
          <Text size="xs" c="dimmed">
            整批以单个事务提交。所有合法行成功创建，错误行不影响其它行写入。
          </Text>
        </Stack>
      </Card>

      {result && (
        <Card withBorder>
          <Stack>
            <Group>
              <Title order={4}>结果</Title>
              <Badge color="gray">共 {result.total}</Badge>
              <Badge color="green">已创建 {result.created}</Badge>
              <Badge color="red">失败 {result.failed}</Badge>
            </Group>
            {result.errors && result.errors.length > 0 && (
              <>
                <Text c="dimmed" size="sm">
                  失败行：
                </Text>
                <List size="sm">
                  {result.errors.map((e, i) => (
                    <List.Item key={i}>
                      第 {e.line} 行 {e.name && <Code>{e.name}</Code>} — {e.message}
                    </List.Item>
                  ))}
                </List>
              </>
            )}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
