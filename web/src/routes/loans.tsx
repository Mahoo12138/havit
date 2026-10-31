import { createFileRoute } from '@tanstack/react-router';
import { useDevice } from '../lib/device';
import { LoansDesktop } from '../features/loans/LoansDesktop';
import { LoansMobile } from '../features/loans/LoansMobile';

export const Route = createFileRoute('/loans')({
  component: LoansPage,
});

function LoansPage() {
  const device = useDevice();
  if (device === 'mobile') return <LoansMobile />;
  return <LoansDesktop />;
}
