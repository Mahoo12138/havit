import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

const thumb = `color-mix(in srgb, ${themeVars.muted} 42%, transparent)`;
const thumbHover = `color-mix(in srgb, ${themeVars.accent} 34%, ${themeVars.muted})`;
const track = `color-mix(in srgb, ${themeVars.lineSoft} 42%, transparent)`;

const scrollbar = style({
  display: 'flex',
  touchAction: 'none',
  userSelect: 'none',
  padding: 2,
  background: 'transparent',
  opacity: 0.62,
  transition: 'background-color 160ms ease, opacity 160ms ease',
  selectors: {
    '&:hover, &[data-state="visible"], &[data-scrolling]': {
      opacity: 1,
    },
  },
});

export const root = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  flex: '1 1 auto',
  overflow: 'hidden',
});

export const viewport = style({
  flex: '1 1 auto',
  minHeight: 0,
  width: '100%',
  height: '100%',
  overflow: 'auto',
  outline: 'none',
  borderRadius: 'inherit',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  selectors: {
    '&::-webkit-scrollbar': { display: 'none' },
    '&:focus-visible': {
      boxShadow: `inset 0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

export const vertical = style([
  scrollbar,
  {
    width: 10,
    height: '100%',
    borderLeft: '1px solid transparent',
    borderRadius: 999,
    selectors: {
      '&:hover': { background: track },
    },
  },
]);

export const horizontal = style([
  scrollbar,
  {
    height: 10,
    width: '100%',
    borderTop: '1px solid transparent',
    borderRadius: 999,
    flexDirection: 'column',
    selectors: {
      '&:hover': { background: track },
    },
  },
]);

export const scrollbarThumb = style({
  position: 'relative',
  flex: '1 1 auto',
  minWidth: 28,
  minHeight: 28,
  borderRadius: 999,
  background: thumb,
  transition: 'background-color 160ms ease',
  selectors: {
    '&:hover': { background: thumbHover },
  },
});

export const corner = style({
  background: 'transparent',
});
