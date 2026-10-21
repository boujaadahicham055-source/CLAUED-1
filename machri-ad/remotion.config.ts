import {Config} from '@remotion/cli/config';
import fs from 'node:fs';

// Use the pre-installed headless shell when present (no network download needed).
const LOCAL_HEADLESS = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (fs.existsSync(LOCAL_HEADLESS)) {
	Config.setBrowserExecutable(LOCAL_HEADLESS);
}

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setX264Preset('slow');
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setConcurrency(3);
Config.setOverwriteOutput(true);
