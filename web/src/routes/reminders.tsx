import { createFileRoute } from '@tanstack/react-router';
import { RemindersDesktop } from '../features/reminders/RemindersDesktop';

export const Route = createFileRoute('/reminders')({
  component: RemindersDesktop,
});
