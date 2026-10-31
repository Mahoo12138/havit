import { style } from '@vanilla-extract/css';

import { themeVars } from './theme.css';

/**
 * 全站文字角色。页面只从这些角色里取样式，不再各自定义字号/字重/行高。
 */
export const textStyles = {
  pageTitle: style({
    margin: 0,
    fontFamily: themeVars.fontSans,
    fontSize: themeVars.textSize2xl,
    fontWeight: themeVars.weightBold,
    lineHeight: themeVars.leadingTight,
    letterSpacing: themeVars.trackingTighter,
    color: themeVars.ink,
    textWrap: 'balance',
  }),
  pageSubtitle: style({
    margin: 0,
    maxWidth: '60ch',
    fontSize: themeVars.textSizeBase,
    fontWeight: themeVars.weightRegular,
    lineHeight: themeVars.leadingNormal,
    color: themeVars.muted,
    textWrap: 'pretty',
  }),
  sectionTitle: style({
    margin: 0,
    fontSize: themeVars.textSizeMd,
    fontWeight: themeVars.weightSemibold,
    lineHeight: themeVars.leadingSnug,
    letterSpacing: themeVars.trackingTight,
    color: themeVars.ink,
  }),
  cardTitle: style({
    margin: 0,
    fontSize: themeVars.textSizeBase,
    fontWeight: themeVars.weightSemibold,
    lineHeight: themeVars.leadingSnug,
    letterSpacing: themeVars.trackingTight,
    color: themeVars.ink,
  }),
  eyebrow: style({
    fontSize: themeVars.textSizeXs,
    fontWeight: themeVars.weightSemibold,
    lineHeight: themeVars.leadingSnug,
    letterSpacing: themeVars.trackingWider,
    color: themeVars.muted,
    textTransform: 'uppercase',
  }),
  caption: style({
    fontSize: themeVars.textSizeXs,
    fontWeight: themeVars.weightRegular,
    lineHeight: themeVars.leadingNormal,
    color: themeVars.muted,
  }),
  metricSm: style({
    fontFamily: themeVars.fontSerif,
    fontSize: themeVars.textSizeXl,
    fontWeight: themeVars.weightRegular,
    lineHeight: themeVars.leadingNone,
    letterSpacing: themeVars.trackingTight,
    fontVariantNumeric: 'tabular-nums',
    color: themeVars.ink,
  }),
  metric: style({
    fontFamily: themeVars.fontSerif,
    fontSize: themeVars.textSize2xl,
    fontWeight: themeVars.weightRegular,
    lineHeight: themeVars.leadingNone,
    letterSpacing: themeVars.trackingTight,
    fontVariantNumeric: 'tabular-nums',
    color: themeVars.ink,
  }),
  metricLg: style({
    fontFamily: themeVars.fontSerif,
    fontSize: themeVars.textSize3xl,
    fontWeight: themeVars.weightRegular,
    lineHeight: themeVars.leadingNone,
    letterSpacing: themeVars.trackingTight,
    fontVariantNumeric: 'tabular-nums',
    color: themeVars.ink,
  }),
  metricHero: style({
    fontFamily: themeVars.fontSerif,
    fontSize: themeVars.textSize4xl,
    fontWeight: themeVars.weightRegular,
    lineHeight: themeVars.leadingNone,
    letterSpacing: themeVars.trackingTight,
    fontVariantNumeric: 'tabular-nums',
    color: themeVars.ink,
  }),
};
