import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, useCurrentFrame} from 'remotion';
import {clamp, theme} from '../theme';
import {timeline, type GridTile} from '../timeline';
import {clipSrc, LOOK_FILTER, LookOverlay} from './Footage';

const GAP = 10;
const CELL_W = (1080 - GAP) / 2;
const CELL_H = (1920 - GAP) / 2;
const RADIUS = 26;

const cellRect = (cell: GridTile['cell']) => ({
	x: cell.endsWith('r') ? CELL_W + GAP : 0,
	y: cell.startsWith('b') ? CELL_H + GAP : 0,
	w: CELL_W,
	h: CELL_H,
});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * "4 خدمات": the four real demonstrations side by side (RTL reading order),
 * then on "فجِهاز واحد" the power tile grows to full frame. That tile plays the
 * next shot's own clip, frame-synchronised, so the hand-off is seamless.
 * Rendered inside a <Sequence> starting at grid.from.
 */
export const FourGrid: React.FC = () => {
	const g = useCurrentFrame();
	const {grid} = timeline;
	const abs = g + grid.from;
	const e = interpolate(abs, [grid.expandStart, grid.expandEnd - 1], [0, 1], {...clamp, easing: theme.easeInOut});
	const order = ['tr', 'tl', 'br', 'bl'];

	return (
		<AbsoluteFill style={{backgroundColor: theme.color.ink}}>
			{[...grid.tiles]
				// expanding tile last so it grows over the others
				.sort((a, b) => Number(a.id === grid.expandTile) - Number(b.id === grid.expandTile))
				.map((tile) => {
					const i = order.indexOf(tile.cell);
					// first tile is already landing on the cut frame, so the grid never opens on an empty frame
					const p = interpolate(g, [i * 2 - 4, i * 2 + 6], [0, 1], {...clamp, easing: theme.easeOut});
					const expanding = tile.id === grid.expandTile;
					const r = cellRect(tile.cell);
					const rect = expanding
						? {x: lerp(r.x, 0, e), y: lerp(r.y, 0, e), w: lerp(r.w, 1080, e), h: lerp(r.h, 1920, e)}
						: r;
					const fade = expanding ? 1 : 1 - interpolate(e, [0, 0.45], [0, 1], clamp);
					const shrink = expanding ? 1 : 1 - 0.06 * e;
					return (
						<div
							key={tile.id}
							style={{
								position: 'absolute',
								left: rect.x,
								top: rect.y,
								width: rect.w,
								height: rect.h,
								borderRadius: expanding ? lerp(RADIUS, 0, e) : RADIUS,
								overflow: 'hidden',
								opacity: p * fade,
								transform: `scale(${interpolate(p, [0, 1], [0.88, 1]) * shrink})`,
							}}
						>
							<OffthreadVideo
								src={clipSrc(tile.shotClip ?? `tile_${tile.id}`)}
								muted
								style={{width: '100%', height: '100%', objectFit: 'cover', filter: LOOK_FILTER.solution}}
							/>
							{expanding ? <LookOverlay look="solution" opacity={e} /> : null}
							<div
								dir="ltr"
								style={{
									position: 'absolute',
									top: 30,
									right: 32,
									fontFamily: theme.font,
									fontSize: 32,
									fontWeight: 800,
									letterSpacing: '0.18em',
									color: theme.color.accent,
									textShadow: theme.shadow,
									opacity: expanding ? 1 - e : 1,
								}}
							>
								{tile.index}
							</div>
						</div>
					);
				})}
		</AbsoluteFill>
	);
};
