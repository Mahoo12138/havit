import { globalStyle, style, styleVariants } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
});

export const desktopHeader = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: themeVars.space4,
  '@media': {
    '(max-width: 47.99em)': { display: 'none' },
  },
});

export const titleBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const title = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: '1.55rem',
  lineHeight: 1.1,
  fontWeight: 760,
  letterSpacing: 0,
});

export const subtitle = style({
  margin: 0,
  color: themeVars.muted,
  fontSize: '0.9rem',
});

export const headerActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
});

export const kpiGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: themeVars.space3,
  '@media': {
    '(max-width: 76em)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
    '(max-width: 47.99em)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: themeVars.space2,
    },
  },
});

export const kpiTile = style({
  minWidth: 0,
  display: 'flex',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  padding: themeVars.space4,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
  '@media': {
    '(max-width: 47.99em)': {
      padding: themeVars.space3,
    },
  },
});

export const kpiMeta = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const kpiLabel = style({
  color: themeVars.muted,
  fontSize: '0.76rem',
  fontWeight: 600,
});

export const kpiValue = style({
  color: themeVars.ink,
  fontSize: '1.55rem',
  lineHeight: 1.1,
  fontWeight: 760,
  fontVariantNumeric: 'tabular-nums',
  '@media': {
    '(max-width: 47.99em)': { fontSize: '1.25rem' },
  },
});

export const kpiNote = style({
  color: themeVars.muted,
  fontSize: '0.72rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const kpiIcon = styleVariants({
  blue: {
    width: '2.1rem',
    height: '2.1rem',
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 auto',
    borderRadius: themeVars.radius2,
    background: themeVars.infoSoft,
    color: themeVars.info,
  },
  green: {
    width: '2.1rem',
    height: '2.1rem',
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 auto',
    borderRadius: themeVars.radius2,
    background: themeVars.successSoft,
    color: themeVars.success,
  },
  teal: {
    width: '2.1rem',
    height: '2.1rem',
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 auto',
    borderRadius: themeVars.radius2,
    background: themeVars.accentSoft,
    color: themeVars.accentInk,
  },
  orange: {
    width: '2.1rem',
    height: '2.1rem',
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 auto',
    borderRadius: themeVars.radius2,
    background: themeVars.warningSoft,
    color: themeVars.warning,
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
  flexWrap: 'nowrap',
  padding: themeVars.space3,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  '@media': {
    '(max-width: 40em)': {
      alignItems: 'stretch',
      flexDirection: 'column',
      padding: `${themeVars.space2} 0`,
      borderBottom: 0,
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
      flex: 'unset',
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
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

globalStyle(`${toolbarLeft} > [data-slot="field"] [data-slot="label"]`, {
  fontSize: '0.72rem',
});

export const toolbarRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  '@media': {
    '(max-width: 40em)': { justifyContent: 'space-between' },
  },
});

export const searchWrap = style({
  position: 'relative',
  flex: '1 1 9rem',
  minWidth: '9rem',
  '@media': {
    '(max-width: 40em)': {
      gridColumn: '1 / -1',
      minWidth: 0,
    },
  },
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

export const viewToggle = style({
  '@media': {
    '(max-width: 40em)': { display: 'none' },
  },
});

export const filterSelectTrigger = style({
  width: '7.5rem',
  '@media': {
    '(max-width: 40em)': {
      width: '100%',
    },
  },
});

export const tableScroll = style({
  overflowX: 'auto',
  '@media': {
    '(max-width: 47.99em)': { display: 'none' },
  },
});

export const table = style({
  width: '100%',
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
  border: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.muted,
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

export const cardList = style({
  display: 'none',
  '@media': {
    '(max-width: 47.99em)': {
      display: 'flex',
      flexDirection: 'column',
      gap: themeVars.space2,
    },
  },
});

export const cardListDesktop = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
  gap: themeVars.space3,
  padding: themeVars.space3,
  '@media': {
    '(max-width: 47.99em)': { display: 'none' },
  },
});

export const assetCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  padding: themeVars.space3,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
  textDecoration: 'none',
  color: 'inherit',
  transition: 'background-color 160ms ease, transform 120ms ease',
  selectors: {
    '&:hover': { background: themeVars.bgSoft, textDecoration: 'none' },
    '&:active': { transform: 'translateY(1px)' },
  },
});

export const cardHeader = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: themeVars.space3,
});

export const cardBody = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  paddingTop: themeVars.space2,
  borderTop: `1px solid ${themeVars.lineSoft}`,
});

export const badges = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space1,
});

export const badge = styleVariants({
  neutral: {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'fit-content',
    padding: '0.125rem 0.45rem',
    borderRadius: themeVars.radius1,
    background: themeVars.lineSoft,
    color: themeVars.text,
    fontSize: '0.72rem',
    fontWeight: 650,
  },
  blue: {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'fit-content',
    padding: '0.125rem 0.45rem',
    borderRadius: themeVars.radius1,
    background: themeVars.infoSoft,
    color: themeVars.info,
    fontSize: '0.72rem',
    fontWeight: 650,
  },
  amber: {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'fit-content',
    padding: '0.125rem 0.45rem',
    borderRadius: themeVars.radius1,
    background: themeVars.warningSoft,
    color: themeVars.warningText,
    fontSize: '0.72rem',
    fontWeight: 650,
  },
  green: {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'fit-content',
    padding: '0.125rem 0.45rem',
    borderRadius: themeVars.radius1,
    background: themeVars.successSoft,
    color: themeVars.success,
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
  '@media': {
    '(max-width: 47.99em)': {
      display: 'none',
    },
  },
});

export const pagination = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space1,
});

export const insightsGrid = style({
  display: 'grid',
  gridTemplateColumns: '1.15fr 1fr',
  gap: themeVars.space4,
  '@media': {
    '(max-width: 76em)': { gridTemplateColumns: '1fr' },
    '(max-width: 47.99em)': { display: 'none' },
  },
});

export const insightCard = style({
  padding: themeVars.space4,
});

export const insightTitle = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: '0.92rem',
  fontWeight: 720,
});

export const insightSub = style({
  marginTop: '0.2rem',
  color: themeVars.muted,
  fontSize: '0.76rem',
});

export const miniList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  marginTop: themeVars.space3,
});

export const miniRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: `${themeVars.space2} 0`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:last-child': { borderBottom: 0 },
  },
});

export const distribution = style({
  display: 'grid',
  gridTemplateColumns: '7rem minmax(0, 1fr)',
  gap: themeVars.space4,
  alignItems: 'center',
  marginTop: themeVars.space3,
});

export const donut = style({
  width: '7rem',
  height: '7rem',
  borderRadius: '50%',
  background: `conic-gradient(${themeVars.info} 0% 42%, ${themeVars.accent} 42% 64%, ${themeVars.warning} 64% 82%, ${themeVars.violet} 82% 100%)`,
  display: 'grid',
  placeItems: 'center',
});

export const donutInner = style({
  width: '4.4rem',
  height: '4.4rem',
  borderRadius: '50%',
  background: themeVars.panel,
  display: 'grid',
  placeItems: 'center',
  color: themeVars.muted,
});

export const legend = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  color: themeVars.text,
  fontSize: '0.78rem',
});

export const legendItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
});

export const legendDot = styleVariants({
  blue: { width: '0.5rem', height: '0.5rem', borderRadius: 999, background: themeVars.info },
  teal: { width: '0.5rem', height: '0.5rem', borderRadius: 999, background: themeVars.accent },
  amber: { width: '0.5rem', height: '0.5rem', borderRadius: 999, background: themeVars.warning },
  violet: { width: '0.5rem', height: '0.5rem', borderRadius: 999, background: themeVars.violet },
});

export const empty = style({
  padding: themeVars.space6,
  textAlign: 'center',
  color: themeVars.muted,
  fontSize: '0.88rem',
});

export const formActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  paddingTop: themeVars.space3,
  borderTop: `1px solid ${themeVars.lineSoft}`,
});
