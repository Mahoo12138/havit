import { style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const root = style({
  margin: '0 auto',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
});

export const content = style({
  display: 'flex',
  flexFlow: 'row wrap',
  alignItems: 'center',
  gap: themeVars.space1,
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

export const item = style({
  display: 'flex',
  alignItems: 'center',
});

export const linkDisabled = style({
  opacity: 0.4,
  pointerEvents: 'none',
});

export const srOnly = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
});

export const prevNextText = style({
  '@media': {
    '(max-width: 39.99em)': {
      display: 'none',
    },
  },
});

export const ellipsis = style({
  width: '1.75rem',
  height: '1.75rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: themeVars.muted,
  userSelect: 'none',
});
