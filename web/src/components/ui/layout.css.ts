import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const stack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
});

export const stackTight = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space1,
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const rowBetween = style([
  row,
  {
    justifyContent: 'space-between',
  },
]);
