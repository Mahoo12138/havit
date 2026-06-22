import { createFileRoute } from '@tanstack/react-router';
import { CategoriesDesktop } from '../features/categories/CategoriesDesktop';

export const Route = createFileRoute('/categories')({
  component: CategoriesDesktop,
});
