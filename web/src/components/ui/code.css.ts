import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  borderRadius: themeVars.radius1,
  background: themeVars.lineSoft,
  color: themeVars.ink,
  fontFamily: themeVars.fontMono,
  fontSize: '0.85em',
  padding: '0.08rem 0.32rem',
});
