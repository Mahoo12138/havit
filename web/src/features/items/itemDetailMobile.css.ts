import { style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  paddingBottom: '5rem',
});

/* Photo gallery */
export const photoScroll = style({
  display: 'flex',
  gap: themeVars.space2,
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  WebkitOverflowScrolling: 'touch',
  borderRadius: themeVars.radius3,
  selectors: { '&::-webkit-scrollbar': { display: 'none' } },
});

export const photoSlide = style({
  flex: '0 0 auto',
  scrollSnapAlign: 'start',
  width: '100%',
  maxWidth: '20rem',
  aspectRatio: '4/3',
  borderRadius: themeVars.radius3,
  overflow: 'hidden',
  background: themeVars.bgSoft,
  display: 'grid',
  placeItems: 'center',
});

export const photoImg = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const photoEmpty = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space2,
  color: themeVars.muted,
  fontSize: '0.82rem',
  textAlign: 'center',
  padding: themeVars.space4,
});

export const photoCount = style({
  position: 'absolute',
  bottom: themeVars.space2,
  right: themeVars.space2,
  background: 'rgba(0,0,0,0.6)',
  color: '#fff',
  fontSize: '0.72rem',
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: '999px',
});

export const photoWrap = style({
  position: 'relative',
  flex: '0 0 auto',
  scrollSnapAlign: 'start',
  width: '100%',
  maxWidth: '20rem',
});

/* Hero card */
export const heroCard = style({
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  padding: themeVars.space4,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const heroName = style({
  fontSize: '1.15rem',
  fontWeight: 700,
  color: themeVars.ink,
  margin: 0,
});

export const heroBadges = style({
  display: 'flex',
  gap: themeVars.space2,
  flexWrap: 'wrap',
  alignItems: 'center',
});

export const specGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: themeVars.space3,
});

export const specItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const specLabel = style({
  fontSize: '0.68rem',
  color: themeVars.muted,
  fontWeight: 500,
});

export const specValue = style({
  fontSize: '0.85rem',
  fontWeight: 600,
  color: themeVars.ink,
});

/* Section card */
export const section = style({
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

export const sectionTitle = style({
  fontSize: '0.85rem',
  fontWeight: 600,
  margin: 0,
  color: themeVars.ink,
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
});

export const sectionBody = style({
  padding: themeVars.space3,
});

export const sectionEmpty = style({
  textAlign: 'center',
  color: themeVars.muted,
  padding: themeVars.space4,
  fontSize: '0.82rem',
});

/* KV rows */
export const kvRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${themeVars.space2} 0`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const kvLabel = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
});

export const kvValue = style({
  fontSize: '0.82rem',
  fontWeight: 600,
  color: themeVars.ink,
  textAlign: 'right',
});

/* Action bar */
export const actionBar = style({
  display: 'flex',
  gap: themeVars.space2,
  flexWrap: 'wrap',
});

/* Tags */
export const tagList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space2,
});

export const tagChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 500,
  background: themeVars.lineSoft,
  color: themeVars.text,
});

/* Loan card */
export const loanCard = style({
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.lineSoft}`,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space1,
});

export const loanName = style({
  fontSize: '0.88rem',
  fontWeight: 600,
  color: themeVars.ink,
});

export const loanMeta = style({
  fontSize: '0.75rem',
  color: themeVars.muted,
});

/* Timeline */
export const timelineRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: `${themeVars.space2} 0`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  fontSize: '0.82rem',
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const timelineTitle = style({
  fontWeight: 500,
  color: themeVars.ink,
});

export const timelineMeta = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
  textAlign: 'right',
});

/* Status select */
export const statusWrap = style({
  padding: themeVars.space3,
});

/* Item link row */
export const itemRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: `${themeVars.space2} 0`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  textDecoration: 'none',
  color: 'inherit',
  selectors: {
    '&:last-child': { borderBottom: 'none' },
    '&:hover': { textDecoration: 'none' },
  },
});

export const itemName = style({
  flex: 1,
  fontSize: '0.85rem',
  fontWeight: 500,
  color: themeVars.ink,
});

/* Description */
export const description = style({
  fontSize: '0.85rem',
  color: themeVars.text,
  lineHeight: 1.6,
  padding: `${themeVars.space2} 0`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  margin: 0,
});
