import { Environment } from './../utils';

export interface Config {
  credentials: {
    email: string;
    password: string;
  };
  urls: {
    baseApiUrl: string;
    configUrl: string;

    authUrl: string;
    setupUrl: string;

    uploadThemeUrl: string;
    uploadRoutesUrl: string;
    uploadContentUrl: string;
    activateThemeUrl: (themeName: string) => string;
  };
}

const apiVersionPath = `/ghost/api/v0.1`;

export const createConfig = (env: Environment): Config => ({
  credentials: {
    email: env.email,
    password: env.password,
  },
  urls: {
    baseApiUrl: env.baseUrl + apiVersionPath,
    configUrl: `${env.baseUrl}${apiVersionPath}/configuration`,

    authUrl: `${env.baseUrl}${apiVersionPath}/authentication/token`,
    setupUrl: `${env.baseUrl}${apiVersionPath}/authentication/setup`,

    uploadThemeUrl: `${env.baseUrl}${apiVersionPath}/themes/upload/`,
    activateThemeUrl: themeName =>
      `${env.baseUrl}${apiVersionPath}/themes/${themeName}/activate`,
    uploadRoutesUrl: `${env.baseUrl}${apiVersionPath}/settings/routes/yaml`,
    uploadContentUrl: `${env.baseUrl}${apiVersionPath}/db`,
  },
});
