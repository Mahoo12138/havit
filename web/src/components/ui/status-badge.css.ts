import { style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  borderRadius: themeVars.radius1,
  padding: '0.125rem 0.5rem',
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightSemibold,
  lineHeight: themeVars.leadingSnug,
  whiteSpace: 'nowrap',
});

export const variant = styleVariants({
  in_stock: [
    base,
    { background: themeVars.successSoft, color: themeVars.success },
  ],
  in_use: [
    base,
    { background: themeVars.successSoft, color: themeVars.success },
  ],
  borrowed: [
    base,
    { background: themeVars.warningSoft, color: themeVars.warning },
  ],
  idle: [
    base,
    { background: themeVars.lineSoft, color: themeVars.muted },
  ],
  for_sale: [
    base,
    { background: themeVars.infoSoft, color: themeVars.info },
  ],
  sold: [
    base,
    { background: themeVars.lineSoft, color: themeVars.muted },
  ],
  given_away: [
    base,
    { background: themeVars.lineSoft, color: themeVars.muted },
  ],
  lost: [
    base,
    { background: themeVars.dangerSoft, color: themeVars.danger },
  ],
  stolen: [
    base,
    { background: themeVars.dangerSoft, color: themeVars.danger },
  ],
  unreturned: [
    base,
    { background: themeVars.warningSoft, color: themeVars.warning },
  ],
  damaged: [
    base,
    { background: themeVars.dangerSoft, color: themeVars.danger },
  ],
  archived: [
    base,
    { background: themeVars.lineSoft, color: themeVars.muted },
  ],
});
