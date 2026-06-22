import { createFileRoute } from '@tanstack/react-router';
import { ImportDesktop } from '../features/import/ImportDesktop';

export const Route = createFileRoute('/import')({
  component: ImportDesktop,
});
