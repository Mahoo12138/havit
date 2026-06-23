import { keyframes, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

const enter = keyframes({
  from: { opacity: 0, transform: 'scale(0.95)' },
  to: { opacity: 1, transform: 'scale(1)' },
});

const exit = keyframes({
  from: { opacity: 1, transform: 'scale(1)' },
  to: { opacity: 0, transform: 'scale(0.95)' },
});

export const positioner = style({
  isolation: 'isolate',
  zIndex: 50,
});

export const content = style({
  zIndex: 50,
  display: 'inline-flex',
  width: 'fit-content',
  maxWidth: '20rem',
  transformOrigin: 'var(--transform-origin)',
  alignItems: 'center',
  gap: '0.375rem',
  borderRadius: '6px',
  background: themeVars.ink,
  color: themeVars.bg,
  padding: '0.375rem 0.75rem',
  fontSize: '0.75rem',
  lineHeight: 1.25,
  animation: `${enter} 150ms ease-out`,
  selectors: {
    '&[data-ending-style]': {
      animation: `${exit} 100ms ease-in`,
    },
    '& [data-slot="kbd"]': {
      position: 'relative',
      isolation: 'isolate',
      zIndex: 50,
      borderRadius: '2px',
    },
  },
});

export const arrow = style({
  zIndex: 50,
  width: '0.625rem',
  height: '0.625rem',
  borderRadius: '2px',
  background: themeVars.ink,
  fill: themeVars.ink,
  transform: 'translateY(calc(-50% - 2px)) rotate(45deg)',
  selectors: {
    '&[data-side="top"]': {
      bottom: '-0.625rem',
    },
    '&[data-side="bottom"]': {
      top: '0.25rem',
    },
    '&[data-side="right"], &[data-side="inline-end"]': {
      left: '-0.25rem',
      top: '50%',
      transform: 'translateY(-50%) rotate(45deg)',
    },
    '&[data-side="left"], &[data-side="inline-start"]': {
      right: '-0.25rem',
      top: '50%',
      transform: 'translateY(-50%) rotate(45deg)',
    },
  },
});
