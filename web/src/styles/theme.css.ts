import { createGlobalTheme, createGlobalThemeContract } from '@vanilla-extract/css';

const toKebab = (value: string) =>
  value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export const themeVars = createGlobalThemeContract(
  {
    bg: null,
    bgSoft: null,
    panel: null,
    line: null,
    text: null,
    muted: null,
    accent: null,
    onAccent: null,
    accentSoft: null,
    focusRing: null,
    danger: null,
    warningSoft: null,
    warningText: null,
    shadow: null,
  },
  (_value, path) => `havit-${toKebab(path.join('-'))}`,
);

createGlobalTheme(':root', themeVars, {
  bg: '#f0f3f0',
  bgSoft: '#f8f9f5',
  panel: '#fffef9',
  line: '#d8dfd8',
  text: '#17211d',
  muted: '#65726b',
  accent: '#126c60',
  onAccent: '#f8fffb',
  accentSoft: '#e3efeb',
  focusRing: 'rgba(18, 108, 96, 0.2)',
  danger: '#9f352f',
  warningSoft: '#efe6cc',
  warningText: '#68521e',
  shadow: '0 16px 36px rgba(30, 48, 42, 0.07)',
});

createGlobalTheme('[data-color-scheme="dark"]', themeVars, {
  bg: '#101614',
  bgSoft: '#151d1a',
  panel: '#1a2420',
  line: '#33413b',
  text: '#edf4ef',
  muted: '#a5b3ac',
  accent: '#7ed0be',
  onAccent: '#071612',
  accentSoft: '#203a35',
  focusRing: 'rgba(126, 208, 190, 0.24)',
  danger: '#ff958a',
  warningSoft: '#3a3320',
  warningText: '#e7cb80',
  shadow: '0 18px 44px rgba(0, 0, 0, 0.26)',
});
