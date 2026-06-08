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
  bg: '#eef1ef',
  bgSoft: '#f7f8f5',
  panel: '#fbfcf8',
  line: '#cfd8d1',
  text: '#18211e',
  muted: '#65736c',
  accent: '#0f6f64',
  onAccent: '#f7fffb',
  accentSoft: '#dcefeb',
  focusRing: 'rgba(15, 111, 100, 0.2)',
  danger: '#a33a32',
  warningSoft: '#f2ead3',
  warningText: '#6b5421',
  shadow: '0 18px 44px rgba(34, 56, 49, 0.08)',
});

createGlobalTheme('[data-color-scheme="dark"]', themeVars, {
  bg: '#111816',
  bgSoft: '#17211e',
  panel: '#1c2723',
  line: '#33413b',
  text: '#edf4ef',
  muted: '#a6b4ad',
  accent: '#72c9b8',
  onAccent: '#071612',
  accentSoft: '#203b35',
  focusRing: 'rgba(114, 201, 184, 0.24)',
  danger: '#ff958a',
  warningSoft: '#3a3322',
  warningText: '#e8cc82',
  shadow: '0 18px 44px rgba(0, 0, 0, 0.28)',
});
