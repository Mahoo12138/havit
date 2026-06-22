import { createFileRoute } from '@tanstack/react-router';
import { SearchDesktop } from '../features/search/SearchDesktop';

export const Route = createFileRoute('/search')({
  component: SearchDesktop,
});
