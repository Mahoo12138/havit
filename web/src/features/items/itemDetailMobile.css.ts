import { style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  width: '100%',
  minWidth: 0,
  paddingBottom: '5.5rem',
});

export const mobileTopActions = style({
  position: 'absolute',
  top: themeVars.space3,
  left: themeVars.space3,
  right: themeVars.space3,
  zIndex: 2,
  display: 'flex',
  justifyContent: 'space-between',
  gap: themeVars.space1,
  pointerEvents: 'none',
});

export const heroAction = style({
  pointerEvents: 'auto',
  background: `color-mix(in srgb, ${themeVars.panel} 84%, transparent)`,
  border: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.ink,
});

export const hero = style({
  position: 'relative',
  minWidth: 0,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  overflow: 'hidden',
  boxShadow: themeVars.shadowSoft,
});

export const photoFrame = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  height: 'min(64vw, 16.25rem)',
  minHeight: '10.5rem',
  aspectRatio: '16 / 9',
  background: `linear-gradient(180deg, ${themeVars.bgSoft}, ${themeVars.panel})`,
  overflow: 'hidden',
  selectors: {
    '&[data-empty]': {
      height: 'auto',
      minHeight: '6.25rem',
      aspectRatio: 'auto',
    },
  },
});

export const heroPhoto = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  objectPosition: 'center',
  background: themeVars.bgSoft,
});

export const photoEmpty = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space1,
  color: themeVars.muted,
  fontSize: '0.78rem',
});

export const photoCount = style({
  position: 'absolute',
  right: themeVars.space3,
  bottom: themeVars.space3,
  padding: '0.15rem 0.45rem',
  borderRadius: '999px',
  background: 'rgba(15, 23, 42, 0.72)',
  color: '#fff',
  fontSize: '0.72rem',
  fontWeight: 700,
});

export const thumbStrip = style({
  display: 'flex',
  gap: themeVars.space2,
  overflowX: 'auto',
  padding: `${themeVars.space2} ${themeVars.space3} 0`,
  scrollbarWidth: 'none',
});

export const thumbButton = style({
  flex: '0 0 auto',
  width: '2.5rem',
  height: '2.5rem',
  padding: 0,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  overflow: 'hidden',
  selectors: {
    '&[data-active]': {
      borderColor: themeVars.info,
      boxShadow: `0 0 0 2px ${themeVars.infoSoft}`,
    },
  },
});

export const thumbImg = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const thumbAdd = style({
  flex: '0 0 auto',
  width: '2.5rem',
  height: '2.5rem',
  display: 'grid',
  placeItems: 'center',
  border: `1px dashed ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  color: themeVars.accentInk,
});

export const hiddenInput = style({
  display: 'none',
});

export const summary = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: `${themeVars.space3} ${themeVars.space4} ${themeVars.space4}`,
  minWidth: 0,
});

export const title = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: '1.55rem',
  lineHeight: 1.12,
  fontWeight: 760,
  letterSpacing: 0,
  textWrap: 'balance',
});

export const badgeRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flexWrap: 'wrap',
});

export const typeBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  height: '1.45rem',
  padding: '0 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.secondaryBg,
  color: themeVars.secondaryText,
  fontSize: '0.72rem',
  fontWeight: 650,
});

export const categoryBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  height: '1.45rem',
  padding: '0 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.infoSoft,
  color: themeVars.info,
  fontSize: '0.72rem',
  fontWeight: 650,
});

export const tagRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space2,
});

export const tagChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.15rem 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
  fontSize: '0.74rem',
  fontWeight: 650,
});

export const mutedText = style({
  color: themeVars.muted,
  fontSize: '0.8rem',
});

export const specList = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  borderTop: `1px solid ${themeVars.lineSoft}`,
  marginTop: themeVars.space1,
});

export const specRow = style({
  display: 'grid',
  gridTemplateColumns: '5.75rem minmax(0, 1fr)',
  gap: themeVars.space2,
  alignItems: 'center',
  minHeight: '1.9rem',
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const specLabel = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
});

export const specValue = style({
  color: themeVars.text,
  fontSize: '0.84rem',
  fontWeight: 600,
  textAlign: 'right',
  overflowWrap: 'anywhere',
  minWidth: 0,
});

export const qrChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space1,
  padding: '0.15rem 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.infoSoft,
  color: themeVars.info,
  fontFamily: themeVars.fontMono,
  fontSize: '0.74rem',
});

export const actionList = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: themeVars.space2,
  border: 0,
  borderRadius: themeVars.radius3,
  background: 'transparent',
  padding: 0,
  '@media': {
    '(min-width: 26em)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  },
});

export const actionRow = style({
  display: 'grid',
  gridTemplateColumns: '1.6rem minmax(0, 1fr) auto auto',
  alignItems: 'center',
  gap: themeVars.space2,
  minHeight: '3rem',
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  padding: `0 ${themeVars.space3}`,
  textAlign: 'left',
  font: 'inherit',
  minWidth: 0,
  cursor: 'pointer',
  boxShadow: themeVars.shadowSoft,
  selectors: {
    '&:hover, &:active': {
      background: themeVars.lineSoft,
    },
  },
});

export const actionIcon = style({
  display: 'inline-grid',
  placeItems: 'center',
  color: themeVars.muted,
});

export const actionLabel = style({
  color: themeVars.ink,
  fontSize: '0.88rem',
  fontWeight: 650,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const actionValue = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
  maxWidth: '8rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const chevron = style({
  color: themeVars.muted,
});

export const section = style({
  minWidth: 0,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  overflow: 'hidden',
  boxShadow: themeVars.shadowSoft,
});

export const sectionHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  minHeight: '3rem',
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const sectionTitle = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space2,
  margin: 0,
  color: themeVars.ink,
  fontSize: '0.94rem',
  fontWeight: 720,
});

export const sectionBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: themeVars.space4,
});

export const sectionEmpty = style({
  color: themeVars.muted,
  fontSize: '0.82rem',
  textAlign: 'center',
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
});

export const compactCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
});

export const compactTitle = style({
  color: themeVars.ink,
  fontSize: '0.86rem',
  fontWeight: 650,
});

export const compactSub = style({
  color: themeVars.muted,
  fontSize: '0.76rem',
});

export const timelineRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
  paddingBottom: themeVars.space2,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:last-child': {
      borderBottom: 0,
      paddingBottom: 0,
    },
  },
});

export const timelineTitle = style({
  color: themeVars.ink,
  fontSize: '0.86rem',
  fontWeight: 650,
});

export const timelineMeta = style({
  color: themeVars.muted,
  fontSize: '0.76rem',
});

export const warningText = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.2rem',
  color: themeVars.danger,
  fontSize: '0.76rem',
  fontWeight: 650,
});

export const bottomBar = style({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 20,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr auto',
  gap: themeVars.space2,
  padding: `${themeVars.space2} ${themeVars.space4} calc(${themeVars.space2} + env(safe-area-inset-bottom, 0px))`,
  borderTop: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  boxShadow: '0 -6px 18px rgba(15, 23, 42, 0.06)',
});
