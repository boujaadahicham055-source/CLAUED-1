import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

// Cairo variable (wght 200-1000), bundled locally so renders never depend on the network.
// Ranges match the Fontsource subsets; the Arabic file covers گ (U+06AF) and all harakat.
const ARABIC_RANGE =
	'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
const LATIN_RANGE =
	'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

let started = false;

export const loadFonts = () => {
	if (started) {
		return;
	}
	started = true;
	const handle = delayRender('Loading Cairo font');
	const faces = [
		new FontFace('Cairo', `url(${staticFile('fonts/cairo-arabic-wght-normal.woff2')}) format('woff2')`, {
			weight: '200 1000',
			unicodeRange: ARABIC_RANGE,
		}),
		new FontFace('Cairo', `url(${staticFile('fonts/cairo-latin-wght-normal.woff2')}) format('woff2')`, {
			weight: '200 1000',
			unicodeRange: LATIN_RANGE,
		}),
	];
	Promise.all(faces.map((f) => f.load()))
		.then((loaded) => {
			loaded.forEach((f) => document.fonts.add(f));
			return document.fonts.ready;
		})
		.then(() => continueRender(handle))
		.catch((err) => cancelRender(err));
};
