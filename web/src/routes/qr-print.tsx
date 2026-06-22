import { createFileRoute } from '@tanstack/react-router';
import { QrPrintDesktop } from '../features/qr-print/QrPrintDesktop';

export const Route = createFileRoute('/qr-print')({
  component: QrPrintDesktop,
});
