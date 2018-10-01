import * as fs from 'fs';
import fetch, { Request, RequestInit } from 'node-fetch';
import FormData from 'form-data';
import {
  ConfigurationResponse,
  ClientConfig,
  AuthResponse,
  ClientAuth,
  ThemeResponse,
  InitResponse,
  Theme,
  RoutesResponse,
  ContentResponse,
  GhostResponse,
} from './api.interface';
import { formatAuthParams } from './api.utils';
import { Config } from './config';
import { debugLog } from './debug-log';
import getenv from 'getenv';

export class ErrorFetchClientConfig extends Error {}
export class ErrorAuthClient extends Error {}
export class ErrorUploadTheme extends Error {}
export class ErrorUploadContent extends Error {}
export class ErrorUploadRoutes extends Error {}
export class ErrorActivateTheme extends Error {}
export class GhostAdminError extends Error {}
export class RetryAdminRoute extends Error {
  constructor(message?: string) {
    super(message);

    // we need to set the prototype of this here so that we are able to
    // later use `if (error instanceOf RetryAdminRoute)` otherwise it wouldn't work
    Object.setPrototypeOf(this, RetryAdminRoute.prototype);
  }
}

export const RETRY_ERRORS = ['MaintenanceError'];

export class GhostApi {
  private token: string = '';

  constructor(private config: Config) {}

  public async init(): Promise<InitResponse> {
    const body = {
      setup: [
        {
          name: 'ghost-upload-theme-bot',
          email: this.config.credentials.email,
          password: this.config.credentials.password,
          blogTitle: 'Temporary Blog Title',
        },
      ],
    };

    const initResponse: InitResponse = await this.fetchRetryOnErrors<
      InitResponse
    >(
      this.config.urls.setupUrl,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      RETRY_ERRORS
    );

    return initResponse;
  }

  public async login(): Promise<void> {
    const clientConfig: ClientConfig = await this.getClientConfig();

    const authResponse: AuthResponse = await this.getToken({
      grant_type: 'password',
      username: this.config.credentials.email,
      password: this.config.credentials.password,
      client_id: clientConfig.clientId,
      client_secret: clientConfig.clientSecret,
    });

    if (authResponse.errors) {
      debugLog(authResponse.errors);
      throw new Error(authResponse.errors[0].message);
    }

    this.token = authResponse.access_token;
  }

  public uploadTheme(
    getReadStream: () => fs.ReadStream
  ): Promise<ThemeResponse> {
    if (!this.token) {
      throw new Error(
        'Before uploading a theme you must call the login method'
      );
    }

    const body = new FormData();
    body.append('theme', getReadStream());

    return this.fetchRetryOnErrors<ThemeResponse>(
      this.config.urls.uploadThemeUrl,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body,
      },
      RETRY_ERRORS,
      true
    ).catch(err => {
      debugLog(`Something went wrong while trying to upload the theme`, err);
      throw new ErrorUploadTheme(err.message);
    });
  }

  public activateTheme(theme: Theme): Promise<ThemeResponse> {
    if (!this.token) {
      throw new Error(
        'Before activating the theme you must call the login method'
      );
    }

    return this.fetchRetryOnErrors<ThemeResponse>(
      this.config.urls.activateThemeUrl(theme.name),
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
      RETRY_ERRORS
    ).catch(err => {
      debugLog(`Something went wrong while trying to activate the theme`, err);
      throw new ErrorActivateTheme();
    });
  }

  public uploadRoutes(
    getReadStream: () => fs.ReadStream
  ): Promise<RoutesResponse> {
    if (!this.token) {
      throw new Error('Before uploading routes you must call the login method');
    }

    const body = new FormData();
    body.append('routes', getReadStream());

    return this.fetchRetryOnErrors<RoutesResponse>(
      this.config.urls.uploadRoutesUrl,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body,
      },
      RETRY_ERRORS
    ).catch(err => {
      debugLog(`Something went wrong while trying to upload the routes`, err);
      throw new ErrorUploadRoutes(err.message);
    });
  }

  public async uploadContent(
    getReadStream: () => fs.ReadStream
  ): Promise<ContentResponse> {
    if (!this.token) {
      throw new Error(
        'Before uploading content you must call the login method'
      );
    }

    const body = new FormData();
    body.append('importfile', getReadStream());

    return this.fetchRetryOnErrors<ContentResponse>(
      this.config.urls.uploadContentUrl,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body,
      },
      RETRY_ERRORS,
      true
    )
      .then((res: ContentResponse) => {
        if (res.problems && res.problems.length) {
          res.problems.forEach(p =>
            debugLog(`Content Warning: ${p.message}`, p.context)
          );
        }

        return res;
      })
      .catch(err => {
        debugLog(
          `Something went wrong while trying to upload the content`,
          err.message
        );
        throw new ErrorUploadContent(err.message);
      });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchRetryOnErrors<R extends GhostResponse>(
    url: string | Request,
    init: RequestInit = { method: 'GET' },
    retryErrorTypes: string[],
    verifyStatusWithConfigFetch: boolean = false
  ): Promise<R> {
    const makeAttempt = (retries: number): Promise<R> => {
      debugLog(`Calling ${init.method} ${url}`);
      return fetch(url, {
        ...init,
        timeout: getenv.int('GHOST_API_FETCH_TIMEOUT_MS', 30000),
      })
        .then(res => res.json() as Promise<R>)
        .then((res: R) => {
          if (res.errors) {
            if (res.errors.some(e => retryErrorTypes.includes(e.errorType))) {
              const message = this.ghostErrorResponseToString(res);

              throw new RetryAdminRoute(message);
            } else {
              debugLog(res.errors);
              throw new GhostAdminError(
                `${
                  init.method
                } ${url} failed due to ${this.ghostErrorResponseToString(res)}`
              );
            }
          }

          return res;
        })
        .catch(async err => {
          if (
            err instanceof RetryAdminRoute ||
            err.message.includes('network timeout')
          ) {
            debugLog(err.message);

            if (retries > getenv.int('GHOST_MAX_API_RETRIES', 5)) {
              throw new Error('Retry count exceeded');
            }

            debugLog(`Retrying ${init.method} ${url} after ${retries}s`);

            await this.sleep(retries * 1000);

            return makeAttempt(++retries);
          }

          throw err;
        });
    };

    /**
     * @hack note for some reason if we don't first test that Ghost is ready, if
     * we attempt to make the call, and it fails, subsequent retries will always
     * timeout. It appears to be some kind of error choke/throttle mechanism
     * that is misbehaving.
     */
    if (verifyStatusWithConfigFetch) {
      let attempts = 0;
      let apiResponse;

      do {
        if (attempts > getenv.int('GHOST_MAX_API_RETRIES', 5)) {
          throw new Error('Ghost verify readiness attempts exceeded');
        }

        await this.sleep(attempts * 1000);
        debugLog('Verifying ghost API readiness...');
        apiResponse = await fetch(this.config.urls.configUrl);

        if (apiResponse.status !== 200) {
          const body: GhostResponse = await apiResponse.json();
          debugLog(
            `Ghost is not ready, got ${
              apiResponse.status
            }. Retrying in ${attempts}s.`,
            this.ghostErrorResponseToString(body)
          );
        }
        debugLog('Ghost API is ready.');
        attempts++;
      } while (apiResponse.status !== 200);
    }

    return makeAttempt(0);
  }

  private ghostErrorResponseToString(res: GhostResponse): string {
    return res.errors.map(e => `${e.errorType}: "${e.message}"`).join();
  }

  private getClientConfig(): Promise<ClientConfig> {
    return this.fetchRetryOnErrors<ConfigurationResponse>(
      this.config.urls.configUrl,
      undefined,
      RETRY_ERRORS
    )
      .then((res: ConfigurationResponse) => {
        const [configuration] = res.configuration;
        return configuration;
      })
      .catch(err => {
        debugLog(`Something went wrong while fetching the config`, err);
        throw new ErrorFetchClientConfig();
      });
  }

  private getToken(clientAuth: ClientAuth): Promise<AuthResponse> {
    return fetch(this.config.urls.authUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formatAuthParams(clientAuth),
    })
      .then(res => res.json() as Promise<AuthResponse>)
      .catch(err => {
        debugLog(`Something went wrong while trying to log in`, err);
        throw new ErrorAuthClient();
      });
  }
}
