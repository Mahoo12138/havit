import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  flexShrink: 0,
  background: themeVars.line,
  selectors: {
    '&[data-orientation="horizontal"]': {
      width: '100%',
      height: 1,
    },
    '&[data-orientation="vertical"]': {
      width: 1,
      alignSelf: 'stretch',
    },
  },
});
