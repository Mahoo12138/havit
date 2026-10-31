import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  minWidth: 0,
});

export const heading = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  flex: '1 1 auto',
  minWidth: 0,
});

export const titleRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  minWidth: 0,
});

export const title = style({
  margin: 0,
  minWidth: 0,
  overflow: 'hidden',
  color: themeVars.ink,
  fontSize: themeVars.textSizeMd,
  fontWeight: themeVars.weightSemibold,
  letterSpacing: themeVars.trackingTight,
  lineHeight: themeVars.leadingSnug,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const count = style({
  display: 'inline-flex',
  alignItems: 'center',
  flex: '0 0 auto',
  padding: '2px 8px',
  borderRadius: 999,
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightSemibold,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: themeVars.leadingSnug,
});

export const description = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: themeVars.space2,
  minWidth: 0,
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
  lineHeight: themeVars.leadingSnug,
});

export const filters = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: themeVars.space2,
  flex: '1 1 auto',
  minWidth: 0,
});

export const controls = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  gap: themeVars.space2,
  flex: '0 0 auto',
  '@media': {
    '(max-width: 48em)': {
      justifyContent: 'space-between',
      width: '100%',
    },
  },
});

export const actions = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: themeVars.space2,
});

export const meta = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
  whiteSpace: 'nowrap',
});

export const body = style({
  minWidth: 0,
});

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
  '@media': {
    '(max-width: 48em)': {
      flexWrap: 'wrap',
    },
  },
});
