import { style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  paddingBottom: '5rem',
});

/* Breadcrumb trail */
export const breadcrumb = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space1,
  fontSize: themeVars.textSizeSm,
  color: themeVars.muted,
  overflow: 'auto',
  whiteSpace: 'nowrap',
  WebkitOverflowScrolling: 'touch',
  selectors: { '&::-webkit-scrollbar': { display: 'none' } },
});

export const breadcrumbItem = style({
  cursor: 'pointer',
  padding: `${themeVars.space1} ${themeVars.space2}`,
  borderRadius: themeVars.radius2,
  transition: 'background 120ms ease',
  selectors: {
    '&:hover': { background: themeVars.lineSoft },
    '&[data-current="true"]': { color: themeVars.ink, fontWeight: themeVars.weightSemibold, cursor: 'default' },
    '&[data-current="true"]:hover': { background: 'transparent' },
  },
});

export const breadcrumbSep = style({
  color: themeVars.line,
  fontSize: themeVars.textSize2xs,
});

/* Location card (current node info) */
export const locCard = style({
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  padding: themeVars.space3,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const locCardHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const locCardIcon = style({
  width: '2.5rem',
  height: '2.5rem',
  display: 'grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  flex: '0 0 auto',
});

export const locCardMeta = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const locCardName = style({
  fontSize: themeVars.textSizeMd,
  fontWeight: themeVars.weightBold,
  color: themeVars.ink,
});

export const locCardSub = style({
  fontSize: themeVars.textSizeXs,
  color: themeVars.muted,
});

export const locCardStats = style({
  display: 'flex',
  gap: themeVars.space4,
  fontSize: themeVars.textSizeSm,
  color: themeVars.muted,
});

export const locCardStat = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const locCardStatValue = style({
  fontSize: themeVars.textSizeMd,
  fontWeight: themeVars.weightBold,
  color: themeVars.ink,
});

export const locCardStatLabel = style({
  fontSize: themeVars.textSize2xs,
  color: themeVars.muted,
});

export const locCardActions = style({
  display: 'flex',
  gap: themeVars.space2,
  flexWrap: 'wrap',
});

/* Children list */
export const sectionTitle = style({
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
  color: themeVars.ink,
  margin: 0,
});

export const childList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const childRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: themeVars.space3,
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  cursor: 'pointer',
  transition: 'background 120ms ease',
  selectors: { '&:hover': { background: themeVars.bgSoft } },
});

export const childIcon = style({
  width: '2rem',
  height: '2rem',
  display: 'grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  flex: '0 0 auto',
});

export const childMeta = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const childName = style({
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightSemibold,
  color: themeVars.ink,
});

export const childSub = style({
  fontSize: themeVars.textSizeXs,
  color: themeVars.muted,
});

export const childChevron = style({
  color: themeVars.muted,
  flex: '0 0 auto',
});

/* Item list (same pattern as dashboard) */
export const itemRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  textDecoration: 'none',
  color: 'inherit',
  selectors: {
    '&:last-child': { borderBottom: 'none' },
    '&:hover': { background: themeVars.bgSoft, textDecoration: 'none' },
  },
});

export const itemThumb = style({
  width: '2rem',
  height: '2rem',
  flex: '0 0 auto',
  display: 'grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  border: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.text,
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
});

export const itemMeta = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const itemName = style({
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightSemibold,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const itemSub = style({
  fontSize: themeVars.textSizeXs,
  color: themeVars.muted,
});

export const itemPrice = style({
  flex: '0 0 auto',
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
  color: themeVars.ink,
});

export const emptyState = style({
  textAlign: 'center',
  color: themeVars.muted,
  padding: `${themeVars.space5} 0`,
  fontSize: themeVars.textSizeBase,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space2,
});

// Applied as a className on the Card component; head carries the padding.
export const sectionCard = style({
  selectors: {
    '&[data-slot="card"]': {
      padding: 0,
      gap: 0,
    },
  },
});

export const sectionHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

/* Overlay (for create/edit) */
export const overlay = style({
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
  padding: themeVars.space4,
  borderBottom: `1px solid ${themeVars.line}`,
});

export const overlayTitle = style({
  fontSize: themeVars.textSizeLg,
  fontWeight: themeVars.weightBold,
  margin: 0,
  color: themeVars.ink,
});

export const overlayClose = style({
  width: '2rem',
  height: '2rem',
  display: 'grid',
  placeItems: 'center',
  background: 'transparent',
  border: 0,
  borderRadius: themeVars.radius2,
  color: themeVars.muted,
  cursor: 'pointer',
  selectors: { '&:hover': { background: themeVars.lineSoft } },
});

export const overlayBody = style({
  flex: 1,
  overflow: 'auto',
  padding: themeVars.space4,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
});

export const parentNote = style({
  padding: themeVars.space3,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
  lineHeight: themeVars.leadingNormal,
});

export const typeLabel = style({
  display: 'block',
  marginBottom: themeVars.space2,
  color: themeVars.ink,
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
});

export const typeChoiceGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: themeVars.space2,
});

export const typeChoiceCard = style({
  display: 'grid',
  gridTemplateColumns: '2rem minmax(0, 1fr)',
  alignItems: 'center',
  gap: themeVars.space2,
  width: '100%',
  minHeight: '3.75rem',
  height: 'auto',
  padding: themeVars.space3,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  textAlign: 'left',
  whiteSpace: 'normal',
  lineHeight: themeVars.leadingSnug,
  selectors: {
    '&[data-active="true"]': {
      borderColor: themeVars.accent,
      background: themeVars.accentSoft,
      boxShadow: `inset 0 0 0 1px ${themeVars.accent}`,
    },
  },
});

export const typeChoiceIcon = style({
  width: '2rem',
  height: '2rem',
  display: 'grid',
  placeItems: 'center',
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  color: themeVars.text,
  selectors: {
    [`${typeChoiceCard}[data-active="true"] &`]: {
      background: themeVars.panel,
      color: themeVars.accentInk,
    },
  },
});

export const typeChoiceBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const typeChoiceName = style({
  color: themeVars.ink,
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightSemibold,
});

export const typeChoiceDesc = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeXs,
  lineHeight: themeVars.leadingSnug,
});

export const overlayActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space3,
  paddingTop: themeVars.space4,
  borderTop: `1px solid ${themeVars.line}`,
});

export const privateRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: themeVars.space3,
  padding: themeVars.space3,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  cursor: 'pointer',
});

export const privateCopy = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const privateTitle = style({
  color: themeVars.ink,
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightSemibold,
});

export const privateHint = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeXs,
  lineHeight: themeVars.leadingSnug,
});
