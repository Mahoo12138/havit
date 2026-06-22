import { createFileRoute } from '@tanstack/react-router';
import { CaptureDesktop } from '../features/capture/CaptureDesktop';

export const Route = createFileRoute('/capture')({
  component: CaptureDesktop,
});
