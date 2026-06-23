import { keyframes, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

const spin = keyframes({
  to: { transform: 'rotate(360deg)' },
});

export const root = style({
  display: 'inline-block',
  width: '1rem',
  height: '1rem',
  border: `2px solid ${themeVars.line}`,
  borderTopColor: themeVars.accent,
  borderRadius: '999px',
  animation: `${spin} 0.65s linear infinite`,
});
