// Bundles once and renders a list of frames as PNG stills (for QA).
// usage: node scripts/render-stills.mjs out/dir 0 30 94 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {existsSync, mkdirSync} from 'node:fs';
import path from 'node:path';

const [outDir, ...frames] = process.argv.slice(2);
mkdirSync(outDir, {recursive: true});
const shell = process.env.REMOTION_BROWSER_EXECUTABLE ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const browserExecutable = existsSync(shell) ? shell : null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'MachriAd', browserExecutable});
for (const f of frames.map(Number)) {
  const output = path.join(outDir, `f${String(f).padStart(3, '0')}.png`);
  await renderStill({serveUrl, composition, frame: f, output, browserExecutable, overwrite: true});
  console.log('rendered', output);
}
