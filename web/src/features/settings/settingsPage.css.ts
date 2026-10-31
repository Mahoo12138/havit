import { globalStyle, style, styleVariants } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';
import { textStyles } from '../../styles/typography.css';

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
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  minWidth: 0,
});

export const title = textStyles.pageTitle;

export const subtitle = textStyles.pageSubtitle;

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

export const detailMetaBar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  minWidth: 0,
  '@media': {
    '(max-width: 44em)': {
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
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
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
  fontSize: themeVars.textSizeMd,
  fontWeight: themeVars.weightSemibold,
});

// Applied as a className on the Card component; content carries the padding.
export const sectionCard = style({
  selectors: {
    '&[data-slot="card"]': {
      padding: 0,
      gap: 0,
    },
  },
});

export const row = style({
  display: 'grid',
  gridTemplateColumns: '2.5rem minmax(0, 1fr) minmax(11rem, max-content) 1rem',
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
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightBold,
  overflowWrap: 'anywhere',
});

export const rowDescription = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
  lineHeight: themeVars.leadingSnug,
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

export const list = style({
  display: 'flex',
  flexDirection: 'column',
});

export const empty = style({
  padding: themeVars.space5,
  color: themeVars.muted,
  fontSize: themeVars.textSizeBase,
  textAlign: 'center',
});

export const tokenSecret = style({
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  border: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.ink,
  fontFamily: themeVars.fontMono,
  fontSize: themeVars.textSizeSm,
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
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightBold,
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
  fontSize: themeVars.textSizeSm,
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

export const formStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  minWidth: 0,
});

export const formHint = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
  lineHeight: themeVars.leadingNormal,
});

export const formNotice = style({
  padding: `${themeVars.space2} ${themeVars.space3}`,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  border: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
});

export const formError = style({
  color: themeVars.danger,
  fontSize: themeVars.textSizeSm,
  lineHeight: themeVars.leadingNormal,
});

export const accountCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space4,
  flexWrap: 'wrap',
});

export const accountIdentity = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  flex: '1 1 14rem',
  minWidth: 0,
});

export const accountAvatar = style({
  flex: '0 0 auto',
  width: '3.25rem',
  height: '3.25rem',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  borderRadius: '999px',
  background: themeVars.accent,
  color: themeVars.onAccent,
  fontSize: themeVars.textSizeLg,
  fontWeight: themeVars.weightBold,
});

export const accountAvatarImage = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const accountInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space1,
  minWidth: 0,
});

export const accountNameRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flexWrap: 'wrap',
});

export const accountName = style({
  color: themeVars.ink,
  fontSize: themeVars.textSizeMd,
  fontWeight: themeVars.weightBold,
  lineHeight: themeVars.leadingTight,
});

export const accountHandle = style({
  color: themeVars.muted,
  fontFamily: themeVars.fontMono,
  fontSize: themeVars.textSizeSm,
});

export const accountBio = style({
  color: themeVars.text,
  fontSize: themeVars.textSizeSm,
  lineHeight: themeVars.leadingNormal,
  overflowWrap: 'anywhere',
});

export const accountActions = style({
  display: 'flex',
  gap: themeVars.space2,
  flexWrap: 'wrap',
  '@media': {
    '(max-width: 44em)': {
      width: '100%',
    },
  },
});

globalStyle(`${accountActions} > *`, {
  '@media': {
    '(max-width: 44em)': {
      flex: '1 1 8rem',
    },
  },
});

export const avatarEditor = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const avatarPreview = style({
  flex: '0 0 auto',
  width: '3.5rem',
  height: '3.5rem',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  borderRadius: '999px',
  background: themeVars.accent,
  color: themeVars.onAccent,
  fontSize: themeVars.textSizeXl,
  fontWeight: themeVars.weightBold,
});

export const avatarActions = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: themeVars.space1,
  minWidth: 0,
});

export const avatarButtons = style({
  display: 'flex',
  gap: themeVars.space1,
  flexWrap: 'wrap',
});

export const avatarHint = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeXs,
  lineHeight: themeVars.leadingNormal,
});

export const hiddenInput = style({
  display: 'none',
});
