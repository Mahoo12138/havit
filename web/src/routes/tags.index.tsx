import { createFileRoute } from '@tanstack/react-router';
import { TagsDesktop } from '../features/tags/TagsDesktop';

export const Route = createFileRoute('/tags/')({
  component: TagsDesktop,
});
