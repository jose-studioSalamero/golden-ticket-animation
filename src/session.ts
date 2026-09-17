const KEY = "goldleaf.play";

export type PlaySession = {
  token: string;
  givenName: string;
  surname: string;
  email: string;
};

export function readPlaySession(): PlaySession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlaySession;
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePlaySession(session: PlaySession): void {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function clearPlaySession(): void {
  sessionStorage.removeItem(KEY);
}
