import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(webRoot, 'src/lib/asset-icons/asset-icons.manifest.json');
const outputPath = path.join(webRoot, 'src/lib/asset-icons/asset-icons.sprite.svg');
const tablerIconsDir = path.join(
  webRoot,
  'node_modules/@tabler/icons-react/dist/esm/icons',
);

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

function pascalizeIconId(id) {
  return id
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function attrName(name) {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function renderNode([tag, attrs]) {
  const parts = Object.entries(attrs ?? {})
    .filter(([name, value]) => name !== 'key' && value !== undefined && value !== null)
    .map(([name, value]) => `${attrName(name)}="${escapeXml(value)}"`);

  return `    <${tag}${parts.length ? ` ${parts.join(' ')}` : ''} />`;
}

async function loadIconNode(iconId) {
  const modulePath = path.join(tablerIconsDir, `Icon${pascalizeIconId(iconId)}.mjs`);

  try {
    const mod = await import(pathToFileURL(modulePath).href);
    if (!Array.isArray(mod.__iconNode)) {
      throw new Error(`Icon module has no __iconNode export: ${iconId}`);
    }
    return mod.__iconNode;
  } catch (error) {
    throw new Error(`Unable to load Tabler icon "${iconId}" from ${modulePath}: ${error.message}`);
  }
}

const seen = new Set();
const symbols = [];

for (const icon of manifest.icons) {
  if (seen.has(icon.id)) {
    throw new Error(`Duplicate asset icon id: ${icon.id}`);
  }
  seen.add(icon.id);

  const iconNode = await loadIconNode(icon.id);
  const symbolId = `${manifest.symbolPrefix}-${icon.id}`;
  symbols.push([
    `  <symbol id="${escapeXml(symbolId)}" viewBox="0 0 24 24">`,
    ...iconNode.map(renderNode),
    '  </symbol>',
  ].join('\n'));
}

const sprite = [
  '<svg xmlns="http://www.w3.org/2000/svg">',
  ...symbols,
  '</svg>',
  '',
].join('\n');

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, sprite);

console.log(`Generated ${manifest.icons.length} asset icons: ${path.relative(webRoot, outputPath)}`);
