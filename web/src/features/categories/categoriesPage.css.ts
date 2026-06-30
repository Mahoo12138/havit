import { globalStyle, style, styleVariants } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space5,
  minWidth: 0,
});

export const desktopHeader = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(18rem, 28rem) auto',
  alignItems: 'start',
  gap: themeVars.space4,
  '@media': {
    '(max-width: 72em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const headerCopy = style({
  minWidth: 0,
});

export const title = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: '1.35rem',
  lineHeight: 1.15,
  fontWeight: 760,
});

export const description = style({
  margin: `${themeVars.space2} 0 0`,
  color: themeVars.muted,
  fontSize: '0.88rem',
  lineHeight: 1.6,
});

export const searchWrap = style({
  position: 'relative',
  minWidth: 0,
});

export const searchIcon = style({
  position: 'absolute',
  left: themeVars.space3,
  top: '50%',
  transform: 'translateY(-50%)',
  color: themeVars.muted,
  pointerEvents: 'none',
});

export const searchInput = style({
  width: '100%',
  height: '2.5rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  paddingLeft: '2.4rem',
  paddingRight: themeVars.space3,
  background: themeVars.panel,
  color: themeVars.text,
  fontSize: '0.88rem',
  boxShadow: themeVars.shadowSoft,
  selectors: {
    '&:focus': {
      outline: `3px solid ${themeVars.focusRing}`,
      borderColor: themeVars.accent,
    },
  },
});

globalStyle(`${searchWrap} [data-slot="input"]`, {
  background: themeVars.panel,
  paddingLeft: '2.4rem',
});

export const tabs = style({
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  maxWidth: '100%',
  overflowX: 'auto',
  gap: themeVars.space1,
  padding: themeVars.space1,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  border: `1px solid ${themeVars.lineSoft}`,
});

export const tab = style({
  border: 0,
  borderRadius: themeVars.radius1,
  background: 'transparent',
  color: themeVars.muted,
  height: '2.15rem',
  padding: `0 ${themeVars.space4}`,
  font: 'inherit',
  fontSize: '0.85rem',
  fontWeight: 650,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'background-color 160ms ease, color 160ms ease, box-shadow 160ms ease',
  selectors: {
    '&[data-active="true"]': {
      background: themeVars.panel,
      color: themeVars.accentInk,
      boxShadow: themeVars.shadowSoft,
    },
    '&:focus-visible': {
      outline: `3px solid ${themeVars.focusRing}`,
      outlineOffset: '2px',
    },
  },
});

export const kpiGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: themeVars.space4,
  '@media': {
    '(max-width: 72em)': {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    },
    '(max-width: 44em)': {
      gridAutoFlow: 'column',
      gridAutoColumns: 'minmax(8.75rem, 42vw)',
      gridTemplateColumns: 'none',
      overflowX: 'auto',
      paddingBottom: themeVars.space1,
      scrollSnapType: 'x mandatory',
      scrollbarWidth: 'none',
    },
  },
});

globalStyle(`${kpiGrid}::-webkit-scrollbar`, {
  display: 'none',
});

export const kpiCard = style({
  minWidth: 0,
  scrollSnapAlign: 'start',
  display: 'grid',
  gridTemplateColumns: '2.4rem minmax(0, 1fr)',
  gap: themeVars.space3,
  alignItems: 'center',
  padding: themeVars.space4,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
});

export const kpiMeta = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const kpiLabel = style({
  color: themeVars.muted,
  fontSize: '0.76rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const kpiValue = style({
  color: themeVars.ink,
  fontSize: '1.35rem',
  lineHeight: 1.1,
  fontWeight: 760,
  fontVariantNumeric: 'tabular-nums',
});

export const kpiHint = style({
  color: themeVars.muted,
  fontSize: '0.72rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const iconTile = style({
  width: '2.4rem',
  height: '2.4rem',
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  flex: '0 0 auto',
});

export const iconTone = styleVariants({
  blue: {
    background: themeVars.infoSoft,
    color: themeVars.info,
  },
  green: {
    background: themeVars.successSoft,
    color: themeVars.success,
  },
  orange: {
    background: themeVars.warningSoft,
    color: themeVars.warning,
  },
  violet: {
    background: themeVars.violetSoft,
    color: themeVars.violet,
  },
  teal: {
    background: themeVars.accentSoft,
    color: themeVars.accentInk,
  },
});

export const panel = style({
  minWidth: 0,
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadow,
  overflow: 'hidden',
});

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  padding: `${themeVars.space4} ${themeVars.space5}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  '@media': {
    '(max-width: 44em)': {
      alignItems: 'stretch',
      flexDirection: 'column',
      padding: themeVars.space4,
    },
  },
});

export const resultMeta = style({
  color: themeVars.muted,
  fontSize: '0.82rem',
  fontWeight: 520,
});

export const tableWrap = style({
  overflowX: 'auto',
});

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '47rem',
});

export const tableHead = style({
  textAlign: 'left',
  color: themeVars.muted,
  fontWeight: 600,
  fontSize: '0.72rem',
  letterSpacing: '0.02em',
  padding: `${themeVars.space3} ${themeVars.space5}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.bgSoft,
});

export const tableRow = style({
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  transition: 'background-color 140ms ease',
  selectors: {
    '&:hover': { background: themeVars.bgSoft },
    '&:last-child': { borderBottom: 'none' },
  },
});

export const tableCell = style({
  padding: `${themeVars.space3} ${themeVars.space5}`,
  color: themeVars.text,
  fontSize: '0.88rem',
  verticalAlign: 'middle',
});

export const nameCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  minWidth: 0,
});

export const nameMeta = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const name = style({
  color: themeVars.ink,
  fontWeight: 680,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const sub = style({
  color: themeVars.muted,
  fontSize: '0.74rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const usage = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '3rem',
  padding: `2px ${themeVars.space2}`,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  color: themeVars.ink,
  fontSize: '0.8rem',
  fontWeight: 650,
  fontVariantNumeric: 'tabular-nums',
});

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space1,
});

export const empty = style({
  padding: themeVars.space7,
  color: themeVars.muted,
  fontSize: '0.9rem',
  textAlign: 'center',
});

export const mobilePage = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  width: '100%',
  minWidth: 0,
  paddingBottom: '5rem',
});

export const mobileTabs = style([
  tabs,
  {
    width: '100%',
    justifyContent: 'flex-start',
  },
]);

export const mobileFilterBar = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: themeVars.space2,
  alignItems: 'center',
});

export const mobileList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const mobileRow = style({
  display: 'grid',
  gridTemplateColumns: '2.4rem minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
});

export const mobileCount = style({
  color: themeVars.ink,
  fontWeight: 720,
  fontVariantNumeric: 'tabular-nums',
});

export const mobileRowActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
});

export const mobileOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  display: 'flex',
  flexDirection: 'column',
  background: themeVars.bg,
});

export const overlayHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  padding: `${themeVars.space4}`,
  paddingTop: 'max(1rem, env(safe-area-inset-top))',
  borderBottom: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
});

export const overlayTitle = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: '1.05rem',
  fontWeight: 750,
});

export const overlayBody = style({
  flex: 1,
  overflow: 'auto',
  padding: `${themeVars.space4} ${themeVars.space4} calc(${themeVars.space4} + env(safe-area-inset-bottom))`,
});

export const overlayActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  marginTop: themeVars.space4,
});

globalStyle(`${overlayActions} > *`, {
  flex: '1 1 8rem',
});
