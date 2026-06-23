import { keyframes, globalStyle, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

const spin = keyframes({
  to: { transform: 'rotate(360deg)' },
});

export const toaster = style({});

export const icon = style({
  width: '1rem',
  height: '1rem',
  flexShrink: 0,
});

export const loadingIcon = style([
  icon,
  {
    animation: `${spin} 1s linear infinite`,
  },
]);

globalStyle(`${toaster} [data-sonner-toast].cn-toast`, {
  borderRadius: themeVars.radius2,
  borderColor: themeVars.line,
  background: themeVars.panel,
  color: themeVars.text,
  boxShadow: themeVars.shadow,
});
