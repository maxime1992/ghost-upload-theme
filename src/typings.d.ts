declare module 'resolve-cwd' {
  const resolveCwd: (path: string) => string;
  export = resolveCwd;
}

declare module 'dotenv' {
  interface Dotenv {
    config(options?: { path: string }): { error?: NodeJS.ErrnoException };
  }

  const dotenv: Dotenv;

  export = dotenv;
}

declare module 'getenv' {
  interface GetEnv {
    (key: string, fallback?: string): string;
    string: (key: string, fallback?: string) => string;
    float: (key: string, fallback?: number) => number;
    int: (key: string, fallback?: number) => number;
    bool: (key: string, fallback?: boolean) => boolean;
    boolish: (key: string, fallback?: boolean) => boolean;
    array: <T>(key: string, fallback?: T[]) => T[];
  }

  const getenv: GetEnv;

  export = getenv;
}
