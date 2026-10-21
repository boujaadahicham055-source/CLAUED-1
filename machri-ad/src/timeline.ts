import raw from '../timeline.json';

export type Look = 'problem' | 'solution';
export type SizeKey = 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';
export type Crop = {x: number; y: number; w: number; h: number};

export type Shot = {
	id: string;
	from: number;
	duration: number;
	phrase: string;
	scene: string;
	source: {shot: string; start: number; end: number; crop?: Crop};
	clipFrames: number;
	look: Look;
	push: {from: number; to: number; ox: number; oy: number};
	/** Frames to hold the starting scale before the push begins. */
	pushDelay?: number;
	enter: 'cut' | 'settle' | 'wipe';
	maskEmbeddedText?: boolean;
	visual: string;
};

export type CaptionLine = {
	/** Words wrapped in *asterisks* render in the accent colour. */
	t: string;
	size: SizeKey;
	/** Composition frame at which this line starts revealing. */
	at: number;
	dir?: 'rtl' | 'ltr';
	accent?: boolean;
};

export type Caption = {
	id: string;
	phrase: string;
	kind: 'headline' | 'feature' | 'count';
	/** Vertical centre of the lockup, in composition px. */
	y: number;
	/** Composition frame at which the exit animation starts. */
	out: number;
	lines: CaptionLine[];
};

export type GridTile = {
	id: string;
	cell: 'tl' | 'tr' | 'bl' | 'br';
	index: string;
	source?: {shot: string; start: number; end: number; crop?: Crop};
	/** Play this full-frame shot clip inside the tile instead of a tile clip. */
	shotClip?: string;
};

export type Timeline = {
	meta: {
		fps: number;
		width: number;
		height: number;
		durationInFrames: number;
		voiceover: {file: string; startFrame: number};
	};
	shots: Shot[];
	grid: {
		from: number;
		duration: number;
		expandTile: string;
		expandStart: number;
		expandEnd: number;
		tiles: GridTile[];
	};
	captions: Caption[];
	cta: {
		from: number;
		wordmark: {text: string; at: number; y: number};
		primary: {text: string; at: number; y: number};
		secondary: {text: string; at: number; y: number};
	};
	brandBug: {text: string; in: number; out: number; y: number};
};

export const timeline = raw as unknown as Timeline;
