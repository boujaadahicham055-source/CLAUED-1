import {Config} from '@remotion/cli/config';

// Chrome Headless Shell shipped with the container's Playwright install.
// Remove this line on a machine where Remotion can download its own browser.
Config.setBrowserExecutable(
  process.env.REMOTION_BROWSER ??
    '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
// Limited-range BT.709, tagged — the safest input for Meta's transcoder.
Config.setColorSpace('bt709');
Config.setAudioCodec('aac');
Config.setAudioBitrate('192k');
Config.setConcurrency(4);
Config.setOverwriteOutput(true);
