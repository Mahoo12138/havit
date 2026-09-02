import { style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space5,
});

export const shell = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(22rem, 0.95fr) minmax(26rem, 1.05fr)',
  alignItems: 'start',
  gap: themeVars.space5,
  '@media': {
    '(max-width: 1080px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const workbench = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  padding: themeVars.space5,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius4,
  background: themeVars.panel,
  boxShadow: themeVars.shadow,
  '@media': {
    '(max-width: 720px)': {
      padding: themeVars.space4,
    },
  },
});

export const resultRail = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
});

export const resultPanel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  padding: themeVars.space5,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius4,
  background: themeVars.panel,
  boxShadow: themeVars.shadow,
  '@media': {
    '(max-width: 720px)': {
      padding: themeVars.space4,
    },
  },
});

export const filesPanel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  padding: themeVars.space4,
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius3,
  background: themeVars.bgSoft,
  boxShadow: themeVars.shadowSoft,
});

export const barcodePanel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  padding: themeVars.space4,
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius3,
  background: themeVars.bgSoft,
  boxShadow: themeVars.shadowSoft,
});

export const barcodeControls = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: themeVars.space2,
  '@media': {
    '(max-width: 560px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
});

export const panelHeader = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: themeVars.space3,
});

export const panelTitle = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: '1.05rem',
  fontWeight: 750,
  letterSpacing: 0,
});

export const panelSub = style({
  margin: '0.25rem 0 0',
  color: themeVars.muted,
  fontSize: '0.88rem',
  lineHeight: 1.5,
});

export const sectionTitle = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: '0.9rem',
  fontWeight: 750,
  letterSpacing: 0,
});

export const iconBadge = style({
  display: 'grid',
  placeItems: 'center',
  width: '2.2rem',
  height: '2.2rem',
  borderRadius: themeVars.radius2,
  color: themeVars.accentInk,
  background: themeVars.accentSoft,
});

export const uploadZone = style({
  display: 'grid',
  placeItems: 'center',
  gap: themeVars.space3,
  minHeight: '21rem',
  padding: themeVars.space5,
  border: `1px dashed ${themeVars.accent}`,
  borderRadius: themeVars.radius4,
  background: `linear-gradient(180deg, ${themeVars.bgSoft}, ${themeVars.panel})`,
  textAlign: 'center',
});

export const hiddenInput = style({
  display: 'none',
});

export const uploadIcon = style({
  display: 'grid',
  placeItems: 'center',
  width: '4.75rem',
  height: '4.75rem',
  borderRadius: '999px',
  color: themeVars.accentInk,
  background: themeVars.accentSoft,
});

export const uploadCopy = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space1,
  color: themeVars.muted,
});

export const uploadHeading = style({
  color: themeVars.ink,
  fontSize: '1.12rem',
});

export const uploadActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: themeVars.space2,
});

export const examples = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const exampleGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: themeVars.space2,
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  },
});

export const exampleCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  minWidth: 0,
  padding: themeVars.space3,
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius2,
  color: themeVars.text,
  background: themeVars.paper,
  fontSize: '0.83rem',
  fontWeight: 650,
});

const exampleMediaBase = style({
  display: 'grid',
  placeItems: 'center',
  width: '100%',
  aspectRatio: '1.6',
  borderRadius: themeVars.radius2,
});

export const exampleMedia = styleVariants({
  teal: [exampleMediaBase, { color: themeVars.accentInk, background: themeVars.accentSoft }],
  amber: [exampleMediaBase, { color: themeVars.warningText, background: themeVars.warningSoft }],
  blue: [exampleMediaBase, { color: themeVars.info, background: themeVars.infoSoft }],
  violet: [exampleMediaBase, { color: themeVars.violet, background: themeVars.violetSoft }],
});

export const capabilities = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  paddingTop: themeVars.space2,
});

export const capabilityGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: themeVars.space2,
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  },
});

export const capabilityChip = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space2,
  minHeight: '2.7rem',
  padding: `0 ${themeVars.space2}`,
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius2,
  color: themeVars.text,
  background: themeVars.bgSoft,
  fontSize: '0.82rem',
  fontWeight: 650,
});

export const confidenceRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderRadius: themeVars.radius3,
  color: themeVars.muted,
  background: themeVars.bgSoft,
});

export const confidenceValue = style({
  color: themeVars.accentInk,
  fontSize: '1.35rem',
});

export const resultForm = style({
  display: 'grid',
  gap: themeVars.space3,
});

export const metaRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  minHeight: '2.75rem',
  padding: `${themeVars.space2} ${themeVars.space3}`,
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius2,
  color: themeVars.muted,
  background: themeVars.bgSoft,
});

export const metaValue = style({
  color: themeVars.text,
  fontSize: '0.9rem',
  textAlign: 'right',
});

export const resultActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  paddingTop: themeVars.space2,
  '@media': {
    '(max-width: 520px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
});

export const fileList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const fileRow = style({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: themeVars.space3,
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  '@media': {
    '(max-width: 560px)': {
      gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    },
  },
});

export const fileIcon = style({
  display: 'grid',
  placeItems: 'center',
  width: '2.35rem',
  height: '2.35rem',
  borderRadius: themeVars.radius2,
  color: themeVars.accentInk,
  background: themeVars.accentSoft,
});

export const fileMeta = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  gap: themeVars.space1,
});

export const fileName = style({
  overflow: 'hidden',
  color: themeVars.ink,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const fileSub = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
});

export const emptyText = style({
  margin: 0,
  padding: themeVars.space4,
  borderRadius: themeVars.radius2,
  color: themeVars.muted,
  background: themeVars.bgSoft,
  textAlign: 'center',
});

export const inlineHint = style({
  margin: 0,
  color: themeVars.muted,
  fontSize: '0.84rem',
  lineHeight: 1.5,
});

export const inlineIssue = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space2,
  padding: themeVars.space2,
  borderRadius: themeVars.radius2,
  color: themeVars.danger,
  background: themeVars.dangerSoft,
  fontSize: '0.84rem',
});
