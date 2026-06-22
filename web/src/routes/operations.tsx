import { createFileRoute } from '@tanstack/react-router';
import { OperationsDesktop } from '../features/operations/OperationsDesktop';

export const Route = createFileRoute('/operations')({
  component: OperationsDesktop,
});
