import { createFileRoute } from '@tanstack/react-router';
import { CredentialsDesktop } from '../features/credentials/CredentialsDesktop';

export const Route = createFileRoute('/credentials')({
  component: CredentialsDesktop,
});
