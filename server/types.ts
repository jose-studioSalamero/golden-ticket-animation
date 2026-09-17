export type Prize = "golden" | "discount";

export type PlayerRecord = {
  email: string;
  givenName: string;
  surname: string;
  consent: boolean;
  registeredAt: string;
  prize: Prize | null;
  unwrappedAt: string | null;
};

export type RegisterInput = {
  givenName: string;
  surname: string;
  email: string;
  consent: boolean;
};

export type SessionPayload = {
  e: string;
  f: string;
  l: string;
  n: string;
  iat: number;
  exp: number;
};

export const ALREADY_PLAYED_MESSAGE = "you have played before";
export const GOLDEN_RATE_DEFAULT = 0.0001;
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
