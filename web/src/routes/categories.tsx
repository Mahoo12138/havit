import { createFileRoute } from '@tanstack/react-router';
import { useDevice } from '../lib/device';
import { CategoriesDesktop } from '../features/categories/CategoriesDesktop';
import { CategoriesMobile } from '../features/categories/CategoriesMobile';

export const Route = createFileRoute('/categories')({
  component: CategoriesPage,
});

function CategoriesPage() {
  const device = useDevice();
  if (device === 'mobile') return <CategoriesMobile />;
  return <CategoriesDesktop />;
}
