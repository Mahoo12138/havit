import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

const cellSize = '1.75rem';
const cellRadius = themeVars.radius2;

export const calendar = style({
  background: themeVars.panel,
  padding: themeVars.space2,
});

export const root = style({
  width: 'fit-content',
});

export const months = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  '@media': {
    '(min-width: 48em)': {
      flexDirection: 'row',
    },
  },
});

export const month = style({
  display: 'flex',
  width: '100%',
  flexDirection: 'column',
  gap: themeVars.space4,
});

export const nav = style({
  position: 'absolute',
  insetInline: 0,
  top: 0,
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space1,
});

export const navButton = style({
  width: cellSize,
  height: cellSize,
  padding: 0,
  userSelect: 'none',
  selectors: {
    '&[aria-disabled="true"]': {
      opacity: 0.5,
    },
  },
});

export const monthCaption = style({
  display: 'flex',
  width: '100%',
  height: cellSize,
  alignItems: 'center',
  justifyContent: 'center',
  paddingInline: cellSize,
});

export const dropdowns = style({
  display: 'flex',
  width: '100%',
  height: cellSize,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: 600,
});

export const dropdownRoot = style({
  position: 'relative',
  borderRadius: cellRadius,
});

export const dropdown = style({
  position: 'absolute',
  inset: 0,
  background: themeVars.panel,
  opacity: 0,
});

export const captionLabel = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  userSelect: 'none',
});

export const captionLabelDropdown = style([
  captionLabel,
  {
    display: 'flex',
    alignItems: 'center',
    gap: themeVars.space1,
    borderRadius: cellRadius,
    selectors: {
      '& svg': {
        width: '0.875rem',
        height: '0.875rem',
        color: themeVars.muted,
      },
    },
  },
]);

export const monthGrid = style({
  width: '100%',
  borderCollapse: 'collapse',
});

export const weekdays = style({
  display: 'flex',
});

export const weekday = style({
  flex: 1,
  borderRadius: cellRadius,
  color: themeVars.muted,
  fontSize: '0.8rem',
  fontWeight: 400,
  userSelect: 'none',
});

export const week = style({
  display: 'flex',
  width: '100%',
  marginTop: themeVars.space2,
});

export const weekNumberHeader = style({
  width: cellSize,
  userSelect: 'none',
});

export const weekNumber = style({
  color: themeVars.muted,
  fontSize: '0.8rem',
  userSelect: 'none',
});

export const weekNumberContent = style({
  display: 'flex',
  width: cellSize,
  height: cellSize,
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
});

export const day = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  aspectRatio: '1 / 1',
  borderRadius: cellRadius,
  padding: 0,
  textAlign: 'center',
  userSelect: 'none',
  selectors: {
    '&:first-child[data-selected="true"] button': {
      borderTopLeftRadius: cellRadius,
      borderBottomLeftRadius: cellRadius,
    },
    '&:last-child[data-selected="true"] button': {
      borderTopRightRadius: cellRadius,
      borderBottomRightRadius: cellRadius,
    },
  },
});

export const dayWithWeekNumber = style({
  selectors: {
    '&:nth-child(2)[data-selected="true"] button': {
      borderTopLeftRadius: cellRadius,
      borderBottomLeftRadius: cellRadius,
    },
  },
});

export const rangeStart = style({
  position: 'relative',
  isolation: 'isolate',
  zIndex: 0,
  borderTopLeftRadius: cellRadius,
  borderBottomLeftRadius: cellRadius,
  background: themeVars.secondaryBg,
  selectors: {
    '&::after': {
      position: 'absolute',
      insetBlock: 0,
      right: 0,
      zIndex: -1,
      width: themeVars.space4,
      background: themeVars.secondaryBg,
      content: '""',
    },
  },
});

export const rangeMiddle = style({
  borderRadius: 0,
});

export const rangeEnd = style({
  position: 'relative',
  isolation: 'isolate',
  zIndex: 0,
  borderTopRightRadius: cellRadius,
  borderBottomRightRadius: cellRadius,
  background: themeVars.secondaryBg,
  selectors: {
    '&::after': {
      position: 'absolute',
      insetBlock: 0,
      left: 0,
      zIndex: -1,
      width: themeVars.space4,
      background: themeVars.secondaryBg,
      content: '""',
    },
  },
});

export const today = style({
  borderRadius: cellRadius,
  background: themeVars.secondaryBg,
  color: themeVars.ink,
  selectors: {
    '&[data-selected="true"]': {
      borderRadius: 0,
    },
  },
});

export const outside = style({
  color: themeVars.muted,
  selectors: {
    '&[aria-selected="true"]': {
      color: themeVars.muted,
    },
  },
});

export const disabled = style({
  color: themeVars.muted,
  opacity: 0.5,
});

export const hidden = style({
  visibility: 'hidden',
});

export const chevron = style({
  width: '1rem',
  height: '1rem',
});

export const dayButton = style({
  position: 'relative',
  isolation: 'isolate',
  zIndex: 10,
  display: 'flex',
  width: '100%',
  minWidth: cellSize,
  height: 'auto',
  aspectRatio: '1 / 1',
  flexDirection: 'column',
  gap: themeVars.space1,
  border: 0,
  borderRadius: cellRadius,
  padding: 0,
  fontWeight: 400,
  lineHeight: 1,
  selectors: {
    '[data-focused="true"] &': {
      position: 'relative',
      zIndex: 10,
      border: `1px solid ${themeVars.accent}`,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&[data-selected-single="true"]': {
      background: themeVars.accent,
      color: themeVars.onAccent,
    },
    '&[data-range-start="true"]': {
      borderTopLeftRadius: cellRadius,
      borderBottomLeftRadius: cellRadius,
      background: themeVars.accent,
      color: themeVars.onAccent,
    },
    '&[data-range-middle="true"]': {
      borderRadius: 0,
      background: themeVars.secondaryBg,
      color: themeVars.text,
    },
    '&[data-range-end="true"]': {
      borderTopRightRadius: cellRadius,
      borderBottomRightRadius: cellRadius,
      background: themeVars.accent,
      color: themeVars.onAccent,
    },
    '& > span': {
      fontSize: '0.75rem',
      opacity: 0.7,
    },
  },
});
