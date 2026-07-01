import { useId, type SVGProps } from 'react';

import spriteUrl from './asset-icons.sprite.svg?url';
import { defaultAssetIconId, resolveAssetIconId } from './catalog';

type AssetIconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  id?: string | null;
  fallbackId?: string;
  rootType?: string | null;
  size?: number | string;
  title?: string;
  strokeWidth?: number | string;
};

function AssetIcon({
  id,
  fallbackId,
  rootType,
  size = 18,
  title,
  strokeWidth = 2,
  ...props
}: AssetIconProps) {
  const titleId = useId();
  const resolved =
    resolveAssetIconId(id) ??
    resolveAssetIconId(fallbackId) ??
    defaultAssetIconId(rootType);
  const href = `${spriteUrl}#asset-icon-${resolved}`;

  return (
    <svg
      aria-hidden={title ? undefined : true}
      aria-labelledby={title ? titleId : undefined}
      role={title ? 'img' : undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {title && <title id={titleId}>{title}</title>}
      <use href={href} xlinkHref={href} />
    </svg>
  );
}

export { AssetIcon, spriteUrl as assetIconSpriteUrl };
