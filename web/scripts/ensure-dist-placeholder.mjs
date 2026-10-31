import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../../internal/static/dist');
await mkdir(dist, { recursive: true });
await writeFile(
  path.join(dist, '.gitkeep'),
  '# Keep the embedded frontend directory present for source builds.\n',
);
