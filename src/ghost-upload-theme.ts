import { GhostApi } from './api/api';
import { debugLog } from './api/debug-log';
import {
  ArgumentsToParse,
  extractArgumentsOrFail,
  Arguments,
  assertFilesExist,
  extractEnvironmentVariablesOrFail,
  Environment,
  getStreamForPath,
} from './utils';
import { createConfig, Config } from './api/config';
const argv: ArgumentsToParse = require('minimist')(process.argv.slice(2));

// checks arguments and files
const args: Arguments = extractArgumentsOrFail(argv);

assertFilesExist(args);

// environment and config
const environment: Environment = extractEnvironmentVariablesOrFail(
  args.environmentPath
);

const config: Config = createConfig(environment);

async function start() {
  const ghostApi: GhostApi = new GhostApi(config);

  if (args.initGhost) {
    debugLog(`Initializing Ghost...`);
    await ghostApi.init();
    debugLog(`Initialization success.`);
  }

  debugLog(`Logging in...`);
  await ghostApi.login();
  debugLog(`Login success.`);

  if (args.themePath) {
    debugLog(`Uploading Theme...`);
    const uploadThemeRes = await ghostApi.uploadTheme(() =>
      getStreamForPath(args.themePath)
    );

    const [theme] = uploadThemeRes.themes;

    debugLog(`Theme "${theme.name}" uploaded (v${theme.package.version}).`);

    if (args.activateTheme) {
      debugLog('Activating theme...');
      await ghostApi.activateTheme(theme);
      debugLog(`Theme "${theme.name}" activated (v${theme.package.version}).`);
    }
  }

  if (args.routesPath) {
    debugLog('Activating routes...');
    await ghostApi.uploadRoutes(() => getStreamForPath(args.routesPath));
    debugLog(`Routes "${args.routesPath}" loaded`);
  }

  if (args.contentPath) {
    debugLog('Uploading content...');
    await ghostApi.uploadContent(() => getStreamForPath(args.contentPath));
    debugLog(`Content "${args.contentPath}" uploaded.`);
  }
}

// tslint:disable-next-line:no-floating-promises
start();
