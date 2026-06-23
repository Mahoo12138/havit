import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';
import { root as labelRoot } from './label.css';

export const set = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  minInlineSize: 0,
  border: 0,
  margin: 0,
  padding: 0,
});

export const legend = style({
  marginBottom: themeVars.space2,
  color: themeVars.ink,
  fontWeight: 600,
  selectors: {
    '&[data-variant="label"]': { fontSize: '0.875rem' },
    '&[data-variant="legend"]': { fontSize: '1rem' },
  },
});

export const group = style({
  display: 'flex',
  width: '100%',
  flexDirection: 'column',
  gap: themeVars.space5,
});

export const field = style({
  display: 'flex',
  width: '100%',
  gap: themeVars.space2,
  selectors: {
    '&[data-invalid="true"]': { color: themeVars.danger },
    '&[data-orientation="vertical"]': { flexDirection: 'column' },
    '&[data-orientation="horizontal"]': {
      flexDirection: 'row',
      alignItems: 'center',
    },
    '&[data-orientation="responsive"]': { flexDirection: 'column' },
  },
  '@media': {
    '(min-width: 48em)': {
      selectors: {
        '&[data-orientation="responsive"]': {
          flexDirection: 'row',
          alignItems: 'center',
        },
      },
    },
  },
});

export const content = style({
  display: 'flex',
  flex: '1 1 auto',
  minWidth: 0,
  flexDirection: 'column',
  gap: '0.125rem',
  lineHeight: 1.35,
});

export const label = style([
  labelRoot,
  {
    width: 'fit-content',
    lineHeight: 1.35,
  },
]);

export const title = style({
  display: 'flex',
  width: 'fit-content',
  alignItems: 'center',
  gap: themeVars.space2,
  color: themeVars.text,
  fontSize: '0.875rem',
  fontWeight: 600,
});

export const description = style({
  margin: 0,
  color: themeVars.muted,
  fontSize: '0.875rem',
  fontWeight: 400,
  lineHeight: 1.45,
});

export const separator = style({
  position: 'relative',
  display: 'flex',
  height: '1.25rem',
  alignItems: 'center',
  color: themeVars.muted,
  fontSize: '0.875rem',
});

export const separatorLine = style({
  position: 'absolute',
  inset: '50% 0 auto',
  height: 1,
  background: themeVars.line,
});

export const separatorContent = style({
  position: 'relative',
  display: 'block',
  width: 'fit-content',
  margin: '0 auto',
  background: themeVars.bg,
  padding: `0 ${themeVars.space2}`,
});

export const error = style({
  color: themeVars.danger,
  fontSize: '0.875rem',
  fontWeight: 400,
});

export const errorList = style({
  margin: 0,
  paddingLeft: themeVars.space4,
});
