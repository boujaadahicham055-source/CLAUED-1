// QA: renders TimingProbe frames for given props. Usage: node tools/probe.mjs <out> <propsJSON> <frame>...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const [out, props, ...frames] = process.argv.slice(2);
const browserExecutable =
  process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const inputProps = JSON.parse(props);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'TimingProbe', inputProps, browserExecutable});
for (const f of frames.map(Number)) {
  const output = path.join(out, `probe-${f}.png`);
  await renderStill({serveUrl, composition, frame: f, output, inputProps, browserExecutable, imageFormat: 'png'});
  console.log('rendered', output);
}
