import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
import {FONT_FAMILY} from './theme';

// Cairo (SIL OFL 1.1, Google Fonts via @fontsource/cairo), bundled locally in
// public/fonts so renders never depend on a network font request.
const ARABIC =
  'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

const WEIGHTS = ['600', '700', '800', '900'] as const;

export const fontsReady = Promise.all(
  WEIGHTS.flatMap((weight) => [
    loadFont({
      family: FONT_FAMILY,
      url: staticFile(`fonts/cairo-arabic-${weight}-normal.woff2`),
      weight,
      unicodeRange: ARABIC,
      format: 'woff2',
    }),
    loadFont({
      family: FONT_FAMILY,
      url: staticFile(`fonts/cairo-latin-${weight}-normal.woff2`),
      weight,
      unicodeRange: LATIN,
      format: 'woff2',
    }),
  ]),
);
