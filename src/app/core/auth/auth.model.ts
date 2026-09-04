/** Account and session types mirroring the /api/auth contract. */

export interface User {
  id: number;
  email: string;
  displayName: string;
  createdAt: string;
}

/** The result of a successful register or login. */
export interface AuthResponse {
  token: string;
  tokenType: string;
  /** Lifetime of the token in seconds. */
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  displayName: string;
  password: string;
}

/**
 * Shortest password the API accepts. Mirrored here so the form can say so before
 * making a round trip; the server still enforces it.
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Longest password the API accepts.
 *
 * Not an arbitrary limit: BCrypt ignores anything past 72 bytes, so a longer password
 * would be stored and then only partly checked.
 */
export const MAX_PASSWORD_LENGTH = 72;

/** Initials for the avatar in the top bar, e.g. "Sam Rivera" becomes "SR". */
export function initialsOf(user: User | null): string {
  if (!user) {
    return '?';
  }
  const parts = user.displayName.trim().split(/\s+/).filter((part) => part.length > 0);
  if (parts.length === 0) {
    return user.email.charAt(0).toUpperCase();
  }
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}
