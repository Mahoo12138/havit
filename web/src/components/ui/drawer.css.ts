import { keyframes, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const fadeOut = keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  background: 'rgba(0, 0, 0, 0.10)',
  animation: `${fadeIn} 150ms ease-out`,
  selectors: {
    '&[data-ending-style], &[data-state="closed"]': {
      animation: `${fadeOut} 120ms ease-in`,
    },
  },
  '@supports': {
    '(backdrop-filter: blur(1px))': {
      backdropFilter: 'blur(4px)',
    },
  },
});

export const content = style({
  position: 'fixed',
  zIndex: 50,
  display: 'flex',
  height: 'auto',
  flexDirection: 'column',
  background: themeVars.panel,
  borderColor: themeVars.line,
  color: themeVars.text,
  fontSize: '0.875rem',
  selectors: {
    '&[data-vaul-drawer-direction="bottom"]': {
      insetInline: 0,
      bottom: 0,
      maxHeight: '80vh',
      marginTop: '6rem',
      borderTop: `1px solid ${themeVars.line}`,
      borderTopLeftRadius: themeVars.radius3,
      borderTopRightRadius: themeVars.radius3,
    },
    '&[data-vaul-drawer-direction="top"]': {
      insetInline: 0,
      top: 0,
      maxHeight: '80vh',
      marginBottom: '6rem',
      borderBottom: `1px solid ${themeVars.line}`,
      borderBottomLeftRadius: themeVars.radius3,
      borderBottomRightRadius: themeVars.radius3,
    },
    '&[data-vaul-drawer-direction="left"]': {
      insetBlock: 0,
      left: 0,
      width: '75%',
      borderRight: `1px solid ${themeVars.line}`,
      borderTopRightRadius: themeVars.radius3,
      borderBottomRightRadius: themeVars.radius3,
    },
    '&[data-vaul-drawer-direction="right"]': {
      insetBlock: 0,
      right: 0,
      width: '75%',
      borderLeft: `1px solid ${themeVars.line}`,
      borderTopLeftRadius: themeVars.radius3,
      borderBottomLeftRadius: themeVars.radius3,
    },
  },
  '@media': {
    '(min-width: 40em)': {
      selectors: {
        '&[data-vaul-drawer-direction="left"], &[data-vaul-drawer-direction="right"]': {
          maxWidth: '24rem',
        },
      },
    },
  },
});

export const handle = style({
  width: 100,
  height: 4,
  display: 'none',
  flexShrink: 0,
  alignSelf: 'center',
  borderRadius: '999px',
  background: themeVars.line,
  marginTop: themeVars.space4,
  selectors: {
    '[data-vaul-drawer-direction="bottom"] > &': {
      display: 'block',
    },
  },
});

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  padding: themeVars.space4,
  selectors: {
    '[data-vaul-drawer-direction="bottom"] &, [data-vaul-drawer-direction="top"] &': {
      textAlign: 'center',
    },
  },
  '@media': {
    '(min-width: 48em)': {
      textAlign: 'left',
    },
  },
});

export const footer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  marginTop: 'auto',
  padding: themeVars.space4,
});

export const title = style({
  color: themeVars.ink,
  fontSize: '1rem',
  fontWeight: 500,
});

export const description = style({
  color: themeVars.muted,
  fontSize: '0.875rem',
});
