import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const overlay = style({
  position: 'fixed',
  inset: 0,
  isolation: 'isolate',
  zIndex: 50,
  background: 'rgba(0, 0, 0, 0.10)',
  transition: 'opacity 100ms ease',
  backdropFilter: 'blur(2px)',
});

export const content = style({
  position: 'fixed',
  top: '50%',
  left: '50%',
  zIndex: 50,
  display: 'grid',
  width: '100%',
  maxWidth: 'calc(100% - 2rem)',
  transform: 'translate(-50%, -50%)',
  gap: themeVars.space4,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  color: themeVars.text,
  padding: themeVars.space4,
  fontSize: '0.875rem',
  boxShadow: `${themeVars.shadow}, 0 0 0 1px ${themeVars.line}`,
  outline: 'none',
  transition: 'opacity 100ms ease, transform 100ms ease',
  '@media': {
    '(min-width: 40em)': {
      maxWidth: '24rem',
    },
  },
});

export const close = style({
  position: 'absolute',
  top: themeVars.space2,
  right: themeVars.space2,
});

export const srOnly = style({
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
});

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const footer = style({
  display: 'flex',
  flexDirection: 'column-reverse',
  gap: themeVars.space2,
  margin: `0 -${themeVars.space4} -${themeVars.space4}`,
  borderTop: `1px solid ${themeVars.line}`,
  borderBottomLeftRadius: themeVars.radius3,
  borderBottomRightRadius: themeVars.radius3,
  background: themeVars.bgSoft,
  padding: themeVars.space4,
  '@media': {
    '(min-width: 40em)': {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
  },
});

export const title = style({
  color: themeVars.ink,
  fontSize: '1rem',
  fontWeight: 600,
  lineHeight: 1,
});

export const description = style({
  color: themeVars.muted,
  fontSize: '0.875rem',
  lineHeight: 1.5,
});
