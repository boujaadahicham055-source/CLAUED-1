import {existsSync} from 'node:fs';
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setConcurrency(4);

// Use a locally installed Chromium headless shell when present (cloud container);
// otherwise Remotion downloads its own.
const localShell = process.env.REMOTION_BROWSER_EXECUTABLE ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (existsSync(localShell)) {
  Config.setBrowserExecutable(localShell);
}
