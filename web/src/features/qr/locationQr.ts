import type { Location } from '../../api/client';

export interface FlatLocation {
  id: string;
  name: string;
  qr_code?: string;
  path?: string;
  type: string;
}

const LOC_CODE_RE = /^LOC-[A-Z0-9]+$/i;

export function buildLocationQrPayload(code: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/location-scan?code=${encodeURIComponent(code)}`;
}

export function parseScannedLocationCode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (LOC_CODE_RE.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  try {
    const url = new URL(trimmed, typeof window !== 'undefined' ? window.location.origin : undefined);
    const code = url.searchParams.get('code');
    if (code && LOC_CODE_RE.test(code)) {
      return code.toUpperCase();
    }
    const pathMatch = url.pathname.match(/\/location-scan\/?$/);
    if (pathMatch && code) {
      return code.toUpperCase();
    }
  } catch {
    /* not a URL */
  }

  const inlineMatch = trimmed.match(/(LOC-[A-Z0-9]+)/i);
  return inlineMatch ? inlineMatch[1].toUpperCase() : null;
}

export function flattenLocationTree(
  tree: Location[],
  parentPath?: string,
): FlatLocation[] {
  const result: FlatLocation[] = [];
  for (const node of tree) {
    const path = parentPath ? `${parentPath} → ${node.name}` : node.name;
    result.push({
      id: node.id,
      name: node.name,
      qr_code: node.qr_code,
      path: parentPath,
      type: node.type,
    });
    if (node.children?.length) {
      result.push(...flattenLocationTree(node.children, path));
    }
  }
  return result;
}
