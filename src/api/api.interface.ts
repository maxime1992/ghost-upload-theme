export interface ClientConfig {
  clientId: string;
  clientSecret: string;
}

export interface ClientAuth {
  grant_type: 'password';
  username: string;
  password: string;
  client_id: string;
  client_secret: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export type Errors = { message: string; errorType: string }[];

export interface GhostResponse {
  errors: Errors;
}

// HTTP-RESPONSE
export interface ConfigurationResponse extends GhostResponse {
  configuration: [
    {
      clientId: string;
      clientSecret: string;
    }
  ];
}

export interface AuthResponse extends GhostResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface InitUser {
  id: string;
  name: string;
  slug: string;
  ghost_auth_id: null;
  email: string;
  profile_image: null;
  cover_image: null;
  bio: null;
  website: null;
  location: null;
  facebook: null;
  twitter: null;
  accessibility: null;
  status: 'active';
  locale: null;
  visibility: 'public';
  meta_title: null;
  meta_description: null;
  tour: null;
  last_seen: null;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: number;
}

export interface InitResponse extends GhostResponse {
  users: [InitUser];
}

export interface Theme {
  name: string;
  package: {
    name: string;
    description: string;
    version: string;
  };
  active: false;
}

export interface ThemeResponse extends GhostResponse {
  themes: Theme[];
}

export interface RoutesResponse extends GhostResponse {}

export interface Problem {
  message: string;
  help: string;
  context: string;
  err: any;
}

export interface ContentResponse extends GhostResponse {
  db: any[];
  problems: Problem[];
}
