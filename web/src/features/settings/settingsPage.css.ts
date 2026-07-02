import { globalStyle, style, styleVariants } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  minWidth: 0,
});

export const pageMobile = style([
  page,
  {
    gap: themeVars.space3,
    paddingBottom: '5rem',
  },
]);

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space4,
  padding: `${themeVars.space5} 0 ${themeVars.space3}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  '@media': {
    '(max-width: 44em)': {
      alignItems: 'flex-start',
      padding: `${themeVars.space3} 0 ${themeVars.space2}`,
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
  fontWeight: 760,
  lineHeight: 1.15,
});

export const subtitle = style({
  margin: `${themeVars.space2} 0 0`,
  color: themeVars.muted,
  fontSize: '0.88rem',
  lineHeight: 1.55,
});

export const headerIcons = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flex: '0 0 auto',
});

export const headerIcon = style({
  position: 'relative',
  width: '2.25rem',
  height: '2.25rem',
  display: 'grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  color: themeVars.ink,
  background: themeVars.panel,
  border: `1px solid ${themeVars.lineSoft}`,
});

export const notificationDot = style({
  position: 'absolute',
  right: '0.32rem',
  top: '0.32rem',
  width: '0.48rem',
  height: '0.48rem',
  borderRadius: '999px',
  background: themeVars.danger,
  border: `2px solid ${themeVars.panel}`,
});

export const tabsWrap = style({
  minWidth: 0,
});

globalStyle(`${tabsWrap} [data-slot="tabs-list"]`, {
  maxWidth: '100%',
  overflowX: 'auto',
  scrollbarWidth: 'none',
});

globalStyle(`${tabsWrap} [data-slot="tabs-list"]::-webkit-scrollbar`, {
  display: 'none',
});

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space5,
  minWidth: 0,
  '@media': {
    '(max-width: 44em)': {
      gap: themeVars.space4,
    },
  },
});

export const twoColumn = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(15rem, 17.5rem) minmax(0, 1fr)',
  gap: themeVars.space5,
  alignItems: 'start',
  minWidth: 0,
  '@media': {
    '(max-width: 64em)': {
      gridTemplateColumns: 'minmax(14rem, 15rem) minmax(0, 1fr)',
      gap: themeVars.space4,
    },
  },
});

export const panelRail = style({
  position: 'sticky',
  top: themeVars.space4,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  minWidth: 0,
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
});

export const detailColumn = style({
  minWidth: 0,
});

export const panelNavItem = style({
  appearance: 'none',
  width: '100%',
  border: 0,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  background: 'transparent',
  color: 'inherit',
  display: 'grid',
  gridTemplateColumns: '2.5rem minmax(0, 1fr) 1rem',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background 160ms ease, color 160ms ease',
  selectors: {
    '&:last-child': {
      borderBottom: 0,
    },
    '&:hover': {
      background: themeVars.bgSoft,
    },
    '&:focus-visible': {
      outline: `2px solid ${themeVars.focusRing}`,
      outlineOffset: '-2px',
    },
  },
  '@media': {
    '(max-width: 44em)': {
      padding: themeVars.space3,
    },
  },
});

export const panelNavItemActive = style({
  background: themeVars.accentSoft,
  selectors: {
    '&:hover': {
      background: themeVars.accentSoft,
    },
  },
});

export const panelNavText = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const detailPanel = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
});

export const detailHeader = style({
  display: 'grid',
  gridTemplateColumns: '2.5rem minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: themeVars.space3,
  minWidth: 0,
  padding: `${themeVars.space4} 0`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  '@media': {
    '(max-width: 44em)': {
      gridTemplateColumns: '2.5rem minmax(0, 1fr)',
      padding: `${themeVars.space2} 0 ${themeVars.space3}`,
    },
  },
});

export const detailTitle = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: '1.05rem',
  fontWeight: 760,
  lineHeight: 1.2,
});

export const detailDescription = style({
  margin: `${themeVars.space1} 0 0`,
  color: themeVars.muted,
  fontSize: '0.82rem',
  lineHeight: 1.5,
});

export const detailMeta = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  minWidth: 0,
  '@media': {
    '(max-width: 44em)': {
      gridColumn: '1 / -1',
      justifyContent: 'stretch',
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
});

export const detailBody = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
});

export const detailCard = style({
  overflow: 'hidden',
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
  padding: themeVars.space4,
  '@media': {
    '(max-width: 44em)': {
      padding: themeVars.space3,
    },
  },
});

export const formGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.space4,
  minWidth: 0,
  '@media': {
    '(max-width: 54em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const configList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
});

export const configField = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(12rem, 0.85fr) minmax(16rem, 1.15fr)',
  gap: themeVars.space4,
  alignItems: 'start',
  minWidth: 0,
  paddingBottom: themeVars.space4,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:last-child': {
      paddingBottom: 0,
      borderBottom: 0,
    },
  },
  '@media': {
    '(max-width: 54em)': {
      gridTemplateColumns: '1fr',
      gap: themeVars.space3,
    },
  },
});

export const configFieldText = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space1,
});

export const configFieldControl = style({
  minWidth: 0,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: themeVars.space2,
  alignItems: 'end',
  '@media': {
    '(max-width: 44em)': {
      gridTemplateColumns: '1fr',
      alignItems: 'stretch',
    },
  },
});

export const autoSave = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space2,
  minHeight: '2rem',
  padding: `0 ${themeVars.space3}`,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  color: themeVars.muted,
  fontSize: '0.78rem',
  fontWeight: 650,
  whiteSpace: 'nowrap',
});

export const autoSaveError = style({
  background: themeVars.dangerSoft,
  color: themeVars.danger,
});

export const mobileDetailTop = style({
  display: 'flex',
  alignItems: 'center',
  minHeight: '2.5rem',
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  minWidth: 0,
});

export const sectionTitle = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: '0.92rem',
  fontWeight: 720,
});

export const sectionCard = style({
  overflow: 'hidden',
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
});

export const row = style({
  display: 'grid',
  gridTemplateColumns: '2.5rem minmax(0, 1fr) minmax(13rem, 24rem) 1rem',
  alignItems: 'center',
  gap: themeVars.space4,
  minWidth: 0,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:last-child': {
      borderBottom: 0,
    },
  },
  '@media': {
    '(max-width: 54em)': {
      gridTemplateColumns: '2.5rem minmax(0, 1fr)',
      alignItems: 'start',
    },
    '(max-width: 44em)': {
      gap: themeVars.space3,
      padding: themeVars.space3,
    },
  },
});

export const rowIcon = style({
  width: '2.25rem',
  height: '2.25rem',
  display: 'grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
});

export const rowTone = styleVariants({
  blue: {
    background: themeVars.infoSoft,
    color: themeVars.info,
  },
  green: {
    background: themeVars.successSoft,
    color: themeVars.success,
  },
  violet: {
    background: themeVars.violetSoft,
    color: themeVars.violet,
  },
  orange: {
    background: themeVars.warningSoft,
    color: themeVars.warning,
  },
  red: {
    background: themeVars.dangerSoft,
    color: themeVars.danger,
  },
  neutral: {
    background: themeVars.bgSoft,
    color: themeVars.muted,
  },
});

export const rowText = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const rowTitle = style({
  color: themeVars.ink,
  fontSize: '0.9rem',
  fontWeight: 700,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const rowDescription = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
  lineHeight: 1.45,
});

export const rowControl = style({
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  '@media': {
    '(max-width: 54em)': {
      gridColumn: '2 / -1',
      justifyContent: 'stretch',
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
});

export const chevron = style({
  color: themeVars.muted,
  '@media': {
    '(max-width: 54em)': {
      display: 'none',
    },
  },
});

export const controlsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.space3,
  width: '100%',
  '@media': {
    '(max-width: 44em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const singleControl = style({
  width: '100%',
});

export const saveBar = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  '@media': {
    '(max-width: 44em)': {
      position: 'sticky',
      bottom: '4.25rem',
      zIndex: 5,
    },
  },
});

export const actionRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  flexWrap: 'wrap',
  '@media': {
    '(max-width: 44em)': {
      justifyContent: 'stretch',
    },
  },
});

globalStyle(`${actionRow} > *`, {
  '@media': {
    '(max-width: 44em)': {
      flex: '1 1 9rem',
    },
  },
});

export const tableWrap = style({
  overflowX: 'auto',
});

export const table = style({
  width: '100%',
  minWidth: '42rem',
  borderCollapse: 'collapse',
});

export const th = style({
  padding: `${themeVars.space3} ${themeVars.space4}`,
  color: themeVars.muted,
  background: themeVars.bgSoft,
  fontSize: '0.72rem',
  fontWeight: 650,
  textAlign: 'left',
});

export const td = style({
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.text,
  fontSize: '0.84rem',
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
});

export const empty = style({
  padding: themeVars.space5,
  color: themeVars.muted,
  fontSize: '0.88rem',
  textAlign: 'center',
});

export const tokenSecret = style({
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  border: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.ink,
  fontFamily: themeVars.fontMono,
  fontSize: '0.82rem',
  wordBreak: 'break-all',
  userSelect: 'all',
});

export const memberAvatar = style({
  width: '2.25rem',
  height: '2.25rem',
  display: 'grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  color: themeVars.muted,
  fontSize: '0.86rem',
  fontWeight: 760,
});

export const memberAvatarCurrent = style([
  memberAvatar,
  {
    background: themeVars.accent,
    color: themeVars.onAccent,
  },
]);

export const inlineMeta = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space2,
  color: themeVars.muted,
  fontSize: '0.78rem',
  whiteSpace: 'nowrap',
});

export const dialogActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  marginTop: themeVars.space4,
});

globalStyle(`${dialogActions} > *`, {
  '@media': {
    '(max-width: 44em)': {
      flex: '1 1 8rem',
    },
  },
});
