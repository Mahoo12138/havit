import { globalStyle, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const control = style({
  position: 'relative',
  display: 'flex',
  width: '100%',
  minWidth: 0,
  height: '2.25rem',
  alignItems: 'stretch',
  overflow: 'hidden',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  transition: 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
  selectors: {
    '&:focus-within': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&[data-open="true"]': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&[data-invalid="true"]': {
      borderColor: themeVars.danger,
      boxShadow: `0 0 0 3px ${themeVars.dangerSoft}`,
    },
    '&[data-disabled="true"]': {
      background: themeVars.bgSoft,
      opacity: 0.5,
    },
  },
});

export const pathButton = style({
  position: 'absolute',
  left: themeVars.space3,
  top: '50%',
  zIndex: 1,
  width: '1rem',
  height: '1rem',
  transform: 'translateY(-50%)',
  display: 'inline-grid',
  placeItems: 'center',
  border: 0,
  borderRadius: themeVars.radius1,
  background: 'transparent',
  color: themeVars.muted,
  padding: 0,
  outline: 'none',
  cursor: 'pointer',
  transition: 'background-color 140ms ease, color 140ms ease',
  selectors: {
    '&:hover:not(:disabled), &[data-state="instant-open"], &[data-state="delayed-open"]': {
      color: themeVars.text,
    },
    '&:disabled': {
      cursor: 'not-allowed',
    },
  },
});

export const pathTooltip = style({
  width: 'fit-content',
  maxWidth: '20rem',
  gap: 0,
  borderRadius: '6px',
  background: themeVars.ink,
  color: themeVars.bg,
  padding: '0.375rem 0.75rem',
  fontSize: '0.75rem',
  lineHeight: 1.25,
});

export const trigger = style({
  minWidth: 0,
  height: '100%',
  width: '100%',
  flex: '1 1 auto',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: themeVars.space2,
  border: 0,
  background: 'transparent',
  color: 'inherit',
  padding: `0 ${themeVars.space3} 0 2.25rem`,
  font: 'inherit',
  fontSize: '0.875rem',
  textAlign: 'left',
  outline: 'none',
  cursor: 'pointer',
  selectors: {
    '&:disabled': {
      cursor: 'not-allowed',
    },
  },
});

export const value = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  lineHeight: 1.2,
});

export const placeholder = style([
  value,
  {
    color: themeVars.muted,
  },
]);

export const chevron = style({
  color: themeVars.muted,
  transition: 'transform 160ms ease, color 140ms ease',
  selectors: {
    [`${control}[data-open="true"] &`]: {
      transform: 'rotate(180deg)',
      color: themeVars.text,
    },
  },
});

export const panel = style({
  width: 'min(26rem, calc(100vw - 2rem))',
  gap: 0,
  overflow: 'hidden',
  padding: 0,
});

export const panelHeader = style({
  gap: '0.1rem',
  padding: `${themeVars.space2} ${themeVars.space3}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

globalStyle(`${panelHeader} [data-slot="popover-title"]`, {
  margin: 0,
  fontSize: '1rem',
  lineHeight: 1.25,
});

globalStyle(`${panelHeader} [data-slot="popover-description"]`, {
  margin: 0,
});

export const panelPath = style({
  minWidth: 0,
  fontSize: '0.76rem',
  lineHeight: 1.2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const treeBody = style({
  maxHeight: '18rem',
});

export const treeInner = style({
  padding: `${themeVars.space1} ${themeVars.space2} ${themeVars.space2}`,
});

export const empty = style({
  padding: themeVars.space4,
  color: themeVars.muted,
  fontSize: '0.875rem',
  textAlign: 'center',
});
