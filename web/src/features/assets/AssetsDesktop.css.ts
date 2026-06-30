import { globalStyle, style, styleVariants } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
});

export const header = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: themeVars.space4,
  padding: `${themeVars.space1} 0`,
});

export const titleBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const title = style({
  margin: 0,
  fontSize: '1.55rem',
  lineHeight: 1.1,
  fontWeight: 760,
  color: themeVars.ink,
  letterSpacing: 0,
});

export const subtitle = style({
  margin: 0,
  color: themeVars.muted,
  fontSize: '0.9rem',
});

export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
});

export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: themeVars.space3,
  '@media': {
    '(max-width: 78em)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  },
});

export const statCard = style({
  minWidth: 0,
  display: 'flex',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  padding: themeVars.space4,
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
});

export const statMeta = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const statLabel = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
  fontWeight: 600,
});

export const statValue = style({
  color: themeVars.ink,
  fontSize: '1.55rem',
  lineHeight: 1.1,
  fontWeight: 760,
  fontVariantNumeric: 'tabular-nums',
});

export const statNote = style({
  color: themeVars.muted,
  fontSize: '0.75rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const statIcon = styleVariants({
  blue: {
    width: '2.1rem',
    height: '2.1rem',
    display: 'inline-grid',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.infoSoft,
    color: themeVars.info,
    flex: '0 0 auto',
  },
  green: {
    width: '2.1rem',
    height: '2.1rem',
    display: 'inline-grid',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.successSoft,
    color: themeVars.success,
    flex: '0 0 auto',
  },
  orange: {
    width: '2.1rem',
    height: '2.1rem',
    display: 'inline-grid',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.warningSoft,
    color: themeVars.warning,
    flex: '0 0 auto',
  },
  red: {
    width: '2.1rem',
    height: '2.1rem',
    display: 'inline-grid',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.dangerSoft,
    color: themeVars.danger,
    flex: '0 0 auto',
  },
});

export const bodyGrid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 19rem',
  gap: themeVars.space4,
  alignItems: 'start',
  '@media': {
    '(max-width: 76em)': { gridTemplateColumns: '1fr' },
  },
});

export const ledgerCard = style({
  overflow: 'hidden',
});

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  padding: themeVars.space3,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  flexWrap: 'nowrap',
  '@media': {
    '(max-width: 40em)': {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
});

export const toolbarLeft = style({
  flex: '1 1 auto',
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flexWrap: 'nowrap',
  '@media': {
    '(max-width: 40em)': {
      flexWrap: 'wrap',
    },
  },
});

globalStyle(`${toolbarLeft} > [data-slot="field"]`, {
  flex: '0 0 10.5rem',
  width: '10.5rem',
  '@media': {
    '(max-width: 47.99em)': {
      flex: 'unset',
      width: 'auto',
    },
  },
});

export const toolbarRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flex: '0 0 auto',
  '@media': {
    '(max-width: 40em)': {
      justifyContent: 'flex-end',
    },
  },
});

export const searchWrap = style({
  position: 'relative',
  flex: '1 1 9rem',
  minWidth: '9rem',
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
  height: '2rem',
  paddingLeft: '2.25rem',
});

export const filterSelectTrigger = style({
  width: '7.5rem',
});

export const tableScroll = style({
  overflowX: 'auto',
});

export const table = style({
  width: '100%',
  minWidth: '56rem',
  borderCollapse: 'separate',
  borderSpacing: 0,
});

export const tableHead = style({
  padding: `${themeVars.space2} ${themeVars.space4}`,
  textAlign: 'left',
  borderBottom: `1px solid ${themeVars.line}`,
  background: themeVars.bgSoft,
  color: themeVars.muted,
  fontSize: '0.72rem',
  fontWeight: 650,
  letterSpacing: 0,
  whiteSpace: 'nowrap',
});

export const tableCell = style({
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.text,
  fontSize: '0.85rem',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
});

export const tableRow = style({
  transition: 'background-color 160ms ease',
  selectors: {
    '&:hover': { background: themeVars.bgSoft },
  },
});

export const itemInfo = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  minWidth: '14rem',
});

export const itemThumb = style({
  width: '2.45rem',
  height: '2.45rem',
  display: 'grid',
  placeItems: 'center',
  flex: '0 0 auto',
  borderRadius: themeVars.radius2,
  background: `linear-gradient(145deg, ${themeVars.bgSoft}, ${themeVars.lineSoft})`,
  color: themeVars.muted,
  border: `1px solid ${themeVars.lineSoft}`,
});

export const itemMeta = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
});

export const itemName = style({
  color: themeVars.ink,
  fontSize: '0.9rem',
  fontWeight: 650,
  textDecoration: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover': { color: themeVars.accentInk },
  },
});

export const itemSub = style({
  color: themeVars.muted,
  fontSize: '0.74rem',
});

export const muted = style({
  color: themeVars.muted,
});

export const mono = style({
  fontVariantNumeric: 'tabular-nums',
});

export const price = style({
  color: themeVars.ink,
  fontWeight: 650,
  fontVariantNumeric: 'tabular-nums',
});

export const actionGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space1,
});

export const iconMenuButton = style({
  width: '2rem',
  height: '2rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 0,
  borderRadius: themeVars.radius1,
  background: 'transparent',
  color: themeVars.muted,
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
      color: themeVars.ink,
    },
    '&:focus-visible': {
      outline: `2px solid ${themeVars.accent}`,
      outlineOffset: 2,
    },
  },
});

export const actionMenu = style({
  width: '13rem',
  gap: themeVars.space1,
  padding: themeVars.space2,
});

export const actionItem = style({
  width: '100%',
  minHeight: '2rem',
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  border: 0,
  borderRadius: themeVars.radius1,
  background: 'transparent',
  color: themeVars.text,
  padding: `0 ${themeVars.space2}`,
  font: 'inherit',
  fontSize: '0.82rem',
  textAlign: 'left',
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': {
      background: themeVars.bgSoft,
      color: themeVars.ink,
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.48,
    },
  },
});

export const actionDanger = style({
  color: themeVars.danger,
});

export const actionDot = style({
  width: '0.45rem',
  height: '0.45rem',
  borderRadius: '999px',
  background: themeVars.accent,
  flex: '0 0 auto',
});

export const cardsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
  gap: themeVars.space3,
  padding: themeVars.space3,
});

export const assetCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  padding: themeVars.space4,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
});

export const cardHeader = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: themeVars.space3,
});

export const cardFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  paddingTop: themeVars.space2,
  borderTop: `1px solid ${themeVars.lineSoft}`,
});

export const badge = styleVariants({
  success: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    width: 'fit-content',
    padding: '0.125rem 0.45rem',
    borderRadius: themeVars.radius1,
    background: themeVars.successSoft,
    color: themeVars.success,
    fontSize: '0.72rem',
    fontWeight: 650,
  },
  warning: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    width: 'fit-content',
    padding: '0.125rem 0.45rem',
    borderRadius: themeVars.radius1,
    background: themeVars.warningSoft,
    color: themeVars.warningText,
    fontSize: '0.72rem',
    fontWeight: 650,
  },
  danger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    width: 'fit-content',
    padding: '0.125rem 0.45rem',
    borderRadius: themeVars.radius1,
    background: themeVars.dangerSoft,
    color: themeVars.danger,
    fontSize: '0.72rem',
    fontWeight: 650,
  },
  neutral: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    width: 'fit-content',
    padding: '0.125rem 0.45rem',
    borderRadius: themeVars.radius1,
    background: themeVars.lineSoft,
    color: themeVars.muted,
    fontSize: '0.72rem',
    fontWeight: 650,
  },
});

export const footerBar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.muted,
  fontSize: '0.82rem',
});

export const pagination = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space1,
});

export const sideColumn = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  '@media': {
    '(min-width: 76.01em)': {
      position: 'sticky',
      top: `calc(${themeVars.shellHeaderH} + ${themeVars.space4})`,
    },
    '(max-width: 76em)': {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      alignItems: 'stretch',
    },
    '(max-width: 58em)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    '(max-width: 44em)': {
      display: 'flex',
      flexDirection: 'column',
    },
  },
});

export const sideCard = style({
  padding: themeVars.space4,
});

export const sideCardWide = style({
  '@media': {
    '(max-width: 76em)': {
      gridColumn: 'auto',
    },
    '(max-width: 58em)': {
      gridColumn: '1 / -1',
    },
  },
});

export const sideTitle = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: '0.92rem',
  fontWeight: 720,
});

export const sideHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
});

export const sideLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.15rem',
  color: themeVars.accentInk,
  fontSize: '0.78rem',
  fontWeight: 650,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover': { color: themeVars.accent },
  },
});

export const sideList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  marginTop: themeVars.space3,
});

export const quickAction = style({
  display: 'grid',
  gridTemplateColumns: '2rem minmax(0, 1fr) auto',
  alignItems: 'center',
  justifyContent: 'stretch',
  gap: themeVars.space2,
  width: '100%',
  height: 'auto',
  padding: themeVars.space2,
  borderRadius: themeVars.radius2,
  color: 'inherit',
  textDecoration: 'none',
  selectors: {
    '&:hover': { background: themeVars.bgSoft },
  },
});

export const quickIcon = style({
  width: '2rem',
  height: '2rem',
  display: 'grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
});

export const quickMeta = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1rem',
});

export const quickTitle = style({
  color: themeVars.ink,
  fontSize: '0.82rem',
  fontWeight: 650,
});

export const quickHint = style({
  color: themeVars.muted,
  fontSize: '0.72rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const compactRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  padding: `${themeVars.space2} 0`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:last-child': { borderBottom: 0 },
  },
});

export const compactMeta = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.12rem',
});

export const compactTitle = style({
  color: themeVars.text,
  fontSize: '0.8rem',
  fontWeight: 620,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const compactSub = style({
  color: themeVars.muted,
  fontSize: '0.72rem',
});

export const empty = style({
  padding: themeVars.space6,
  textAlign: 'center',
  color: themeVars.muted,
  fontSize: '0.88rem',
});

export const formActions = style({
  gridColumn: '1 / -1',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  paddingTop: themeVars.space3,
  borderTop: `1px solid ${themeVars.lineSoft}`,
});

export const formGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.space3,
  '@media': {
    '(max-width: 40em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const formWide = style({
  gridColumn: '1 / -1',
});

export const purchaseRow = style({
  display: 'flex',
  gap: themeVars.space2,
});

globalStyle(`${purchaseRow} > *:first-child`, {
  flex: 1,
});
