// TypeScript declarations for auth.js

export interface AuthOptions {
  token?: string;
}

export declare function getAuthHeaders(opts?: AuthOptions): {
  'Content-Type': string;
  'Authorization': string;
};

export declare function getAuthToken(opts?: AuthOptions): string;

export declare function isAuthenticated(): boolean;

export declare function signedFetch(url: string, opts?: RequestInit & AuthOptions): Promise<Response>;
