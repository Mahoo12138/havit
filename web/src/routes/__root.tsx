import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { AppShell, Group, NavLink, Title } from '@mantine/core';
import { IconBox, IconMap2, IconHome } from '@tabler/icons-react';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <IconHome size={22} />
            <Title order={4}>Havit</Title>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <NavLink
          component={Link}
          to="/"
          label="仪表盘"
          leftSection={<IconHome size={18} />}
        />
        <NavLink
          component={Link}
          to="/items"
          label="物品"
          leftSection={<IconBox size={18} />}
        />
        <NavLink
          component={Link}
          to="/locations"
          label="位置"
          leftSection={<IconMap2 size={18} />}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
