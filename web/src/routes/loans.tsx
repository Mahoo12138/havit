import { createFileRoute } from '@tanstack/react-router';
import { LoansDesktop } from '../features/loans/LoansDesktop';

export const Route = createFileRoute('/loans')({
  component: LoansDesktop,
});
