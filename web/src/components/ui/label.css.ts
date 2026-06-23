import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  color: themeVars.text,
  fontSize: '0.875rem',
  fontWeight: 600,
  lineHeight: 1,
  userSelect: 'none',
  selectors: {
    '&[data-disabled="true"]': {
      pointerEvents: 'none',
      opacity: 0.5,
    },
  },
});
