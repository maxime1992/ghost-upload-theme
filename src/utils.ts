import * as fs from 'fs';
import resolveCwd from 'resolve-cwd';
import dotenv from 'dotenv';
import getenv from 'getenv';
import { debugLog } from './api/debug-log';

export interface ArgumentsToParse {
  'theme-path': string;
  'routes-path': string;
  'content-path': string;
  'activate-theme': string;
  'environment-path': string;
  init: string;
}

export interface Arguments {
  themePath: string;
  routesPath: string;
  contentPath: string;
  activateTheme: boolean;
  initGhost: boolean;
  environmentPath: string;
}

export interface Environment {
  baseUrl: string;
  email: string;
  password: string;
}

export const extractArgumentsOrFail = (argv: ArgumentsToParse): Arguments => {
  if (!argv['theme-path']) {
    throw new Error(
      'You must provide the argument "theme-path" indicating where to find the theme file (zip)'
    );
  }

  return {
    initGhost: !!argv['init'],
    themePath: argv['theme-path'],
    contentPath: argv['content-path'],
    routesPath: argv['routes-path'],
    activateTheme: !!argv['activate-theme'],
    environmentPath: argv['environment-path'],
  };
};

const fileExists = (pathStr: string): boolean => {
  const fullPath: string = resolveCwd(pathStr);
  return fs.existsSync(fullPath);
};

export const getStreamForPath = (pathStr: string): fs.ReadStream => {
  const fullPath: string = resolveCwd(pathStr);

  return fs.createReadStream(fullPath);
};

export const assertFilesExist = (args: Arguments): void => {
  if (!fileExists(args.themePath)) {
    throw new Error('Theme path is invalid: File does not exist');
  }
};

export const extractEnvironmentVariablesOrFail = (
  path: string | undefined
): Environment => {
  const result = dotenv.config(path ? { path } : undefined);

  if (result.error) {
    if (!path && result.error.code === 'ENOENT') {
      debugLog('No .env file detected, using environment variables only');
    } else {
      throw result.error;
    }
  }

  return {
    baseUrl: getenv('GHOST_URL'),
    email: getenv('GHOST_ADMIN_EMAIL'),
    password: getenv('GHOST_ADMIN_PASSWORD'),
  };
};
