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
  fontSize: '0.78rem',
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
    '&[data-current="true"]': { color: themeVars.ink, fontWeight: 600, cursor: 'default' },
    '&[data-current="true"]:hover': { background: 'transparent' },
  },
});

export const breadcrumbSep = style({
  color: themeVars.line,
  fontSize: '0.7rem',
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
  fontSize: '1rem',
  fontWeight: 700,
  color: themeVars.ink,
});

export const locCardSub = style({
  fontSize: '0.75rem',
  color: themeVars.muted,
});

export const locCardStats = style({
  display: 'flex',
  gap: themeVars.space4,
  fontSize: '0.78rem',
  color: themeVars.muted,
});

export const locCardStat = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const locCardStatValue = style({
  fontSize: '1rem',
  fontWeight: 700,
  color: themeVars.ink,
});

export const locCardStatLabel = style({
  fontSize: '0.68rem',
  color: themeVars.muted,
});

export const locCardActions = style({
  display: 'flex',
  gap: themeVars.space2,
  flexWrap: 'wrap',
});

/* Children list */
export const sectionTitle = style({
  fontSize: '0.82rem',
  fontWeight: 600,
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
  fontSize: '0.88rem',
  fontWeight: 600,
  color: themeVars.ink,
});

export const childSub = style({
  fontSize: '0.72rem',
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
  color: themeVars.muted,
});

export const itemMeta = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const itemName = style({
  fontSize: '0.85rem',
  fontWeight: 600,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const itemSub = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
});

export const itemPrice = style({
  flex: '0 0 auto',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: themeVars.ink,
});

export const emptyState = style({
  textAlign: 'center',
  color: themeVars.muted,
  padding: `${themeVars.space5} 0`,
  fontSize: '0.85rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space2,
});

export const sectionCard = style({
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  overflow: 'hidden',
});

export const sectionHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

/* FAB */
export const fab = style({
  position: 'fixed',
  bottom: '5rem',
  right: themeVars.space4,
  width: '3rem',
  height: '3rem',
  borderRadius: '999px',
  display: 'grid',
  placeItems: 'center',
  background: `linear-gradient(135deg, ${themeVars.accent}, ${themeVars.accentHover})`,
  color: '#ffffff',
  border: 0,
  boxShadow: '0 4px 16px rgba(13, 148, 136, 0.35)',
  cursor: 'pointer',
  zIndex: 15,
  selectors: { '&:disabled': { opacity: 0.5, cursor: 'not-allowed' } },
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
  fontSize: '1.05rem',
  fontWeight: 700,
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
  fontSize: '0.78rem',
  lineHeight: 1.5,
});

export const typeLabel = style({
  display: 'block',
  marginBottom: themeVars.space2,
  color: themeVars.ink,
  fontSize: '0.82rem',
  fontWeight: 600,
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
  lineHeight: 1.3,
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
  fontSize: '0.88rem',
  fontWeight: 650,
});

export const typeChoiceDesc = style({
  color: themeVars.muted,
  fontSize: '0.72rem',
  lineHeight: 1.4,
});

export const overlayActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space3,
  paddingTop: themeVars.space4,
  borderTop: `1px solid ${themeVars.line}`,
});
