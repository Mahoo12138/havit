import { style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space1,
  width: 'fit-content',
  borderRadius: themeVars.radius1,
  padding: '0.15rem 0.45rem',
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightSemibold,
  lineHeight: themeVars.leadingSnug,
  whiteSpace: 'nowrap',
});

export const variant = styleVariants({
  default: [base, { background: themeVars.accentSoft, color: themeVars.accentInk }],
  neutral: [base, { background: themeVars.lineSoft, color: themeVars.text }],
  info: [base, { background: themeVars.infoSoft, color: themeVars.info }],
  warning: [base, { background: themeVars.warningSoft, color: themeVars.warningText }],
  success: [base, { background: themeVars.successSoft, color: themeVars.success }],
  danger: [base, { background: themeVars.dangerSoft, color: themeVars.danger }],
});
