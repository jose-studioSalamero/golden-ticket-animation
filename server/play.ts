import { issueSession, readSession } from "./session";
import { getStore, PlayedBeforeError } from "./store";
import type { Prize, RegisterInput } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseRegisterInput(body: Record<string, unknown>): RegisterInput {
  const givenName = stringField(body, ["FNAME", "fname", "givenName", "given_name"]);
  const surname = stringField(body, ["LNAME", "lname", "surname", "lastName", "last_name"]);
  const email = stringField(body, ["EMAIL", "email"]).toLowerCase();
  const consent = hasConsent(body);

  if (!givenName) throw new ValidationError("Enter your given name.");
  if (!surname) throw new ValidationError("Enter your surname.");
  if (!email) throw new ValidationError("Enter your email.");
  if (!EMAIL_RE.test(email)) throw new ValidationError("Enter a valid email address.");
  if (!consent) {
    throw new ValidationError(
      "Please agree to receive marketing and promotional materials to continue.",
    );
  }

  return { givenName, surname, email, consent };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export async function registerPlayer(body: Record<string, unknown>): Promise<{
  token: string;
  givenName: string;
  surname: string;
  email: string;
}> {
  const input = parseRegisterInput(body);
  const store = await getStore();
  try {
    const player = await store.register(input);
    const token = await issueSession({
      email: player.email,
      givenName: player.givenName,
      surname: player.surname,
    });
    return {
      token,
      givenName: player.givenName,
      surname: player.surname,
      email: player.email,
    };
  } catch (err) {
    if (err instanceof PlayedBeforeError) throw err;
    throw err;
  }
}

export async function unwrapPrize(token: string): Promise<{
  prize: Prize;
  alreadyUnwrapped: boolean;
  email: string;
}> {
  const session = await readSession(token);
  if (!session) {
    throw new ValidationError("This play session expired. Submit the form again.");
  }
  const result = await (await getStore()).unwrap(session.e);
  return { ...result, email: session.e };
}

function stringField(body: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
      return value[0].trim();
    }
  }
  return "";
}

function hasConsent(body: Record<string, unknown>): boolean {
  const value = body.name ?? body.consent ?? body.CONSENT ?? body.marketing;
  if (value === true || value === "true" || value === "on" || value === "1" || value === "yes") {
    return true;
  }
  if (typeof value === "string" && value.trim() !== "" && value !== "false" && value !== "off") {
    return true;
  }
  return false;
}
