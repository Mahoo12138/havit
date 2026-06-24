import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const body = style({
  marginTop: themeVars.space4,
});
