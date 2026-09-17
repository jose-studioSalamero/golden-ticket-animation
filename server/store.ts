import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { rollPrize } from "./prize";
import { ALREADY_PLAYED_MESSAGE, type PlayerRecord, type Prize, type RegisterInput } from "./types";

const PLAYED_TAG = "goldleaf-played";
const PRIZE_TAGS: Record<Prize, string> = {
  golden: "prize-golden",
  discount: "prize-discount",
};

export class PlayedBeforeError extends Error {
  constructor() {
    super(ALREADY_PLAYED_MESSAGE);
    this.name = "PlayedBeforeError";
  }
}

type Store = {
  register(input: RegisterInput): Promise<PlayerRecord>;
  unwrap(email: string): Promise<{ prize: Prize; alreadyUnwrapped: boolean }>;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function memberHash(email: string): string {
  return createHash("md5").update(normalizeEmail(email)).digest("hex");
}

function mailchimpConfig() {
  const apiKey = process.env.MAILCHIMP_API_KEY?.trim();
  if (!apiKey) return null;
  const prefix =
    process.env.MAILCHIMP_SERVER_PREFIX?.trim() ||
    apiKey.split("-")[1] ||
    "us19";
  const listId = process.env.MAILCHIMP_LIST_ID?.trim() || "263b1eb688";
  return { apiKey, prefix, listId };
}

async function mc(
  config: NonNullable<ReturnType<typeof mailchimpConfig>>,
  pathname: string,
  init?: RequestInit,
) {
  const auth = Buffer.from(`goldleaf:${config.apiKey}`).toString("base64");
  const res = await fetch(`https://${config.prefix}.api.mailchimp.com/3.0${pathname}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = { detail: text };
    }
  }
  return { ok: res.ok, status: res.status, json };
}

function prizeFromTags(tags: unknown): Prize | null {
  const names = new Set(
    Array.isArray(tags)
      ? tags
          .map((t) =>
            typeof t === "string" ? t : t && typeof t === "object" && "name" in t ? String((t as { name: unknown }).name) : "",
          )
          .map((n) => n.toLowerCase())
      : [],
  );
  if (names.has(PRIZE_TAGS.golden)) return "golden";
  if (names.has(PRIZE_TAGS.discount)) return "discount";
  return null;
}

function mailchimpStore(config: NonNullable<ReturnType<typeof mailchimpConfig>>): Store {
  return {
    async register(input) {
      const email = normalizeEmail(input.email);
      const hash = memberHash(email);
      const existing = await mc(config, `/lists/${config.listId}/members/${hash}?exclude_fields=interests`);
      if (existing.status === 200) {
        throw new PlayedBeforeError();
      }
      if (existing.status !== 404) {
        throw new Error("Could not reach the player list. Try again in a moment.");
      }

      const created = await mc(config, `/lists/${config.listId}/members`, {
        method: "POST",
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
          merge_fields: {
            FNAME: input.givenName,
            LNAME: input.surname,
          },
          tags: [PLAYED_TAG],
        }),
      });

      if (!created.ok) {
        const title = String(created.json.title ?? "");
        if (created.status === 400 && /exists/i.test(title)) {
          throw new PlayedBeforeError();
        }
        throw new Error("Could not save your entry. Try again in a moment.");
      }

      return {
        email,
        givenName: input.givenName,
        surname: input.surname,
        consent: true,
        registeredAt: new Date().toISOString(),
        prize: null,
        unwrappedAt: null,
      };
    },

    async unwrap(email) {
      const hash = memberHash(email);
      const member = await mc(
        config,
        `/lists/${config.listId}/members/${hash}?include_fields=email_address,tags,merge_fields,status`,
      );
      if (member.status === 404) {
        throw new Error("This play session is no longer valid.");
      }
      if (!member.ok) {
        throw new Error("Could not reach the player list. Try again in a moment.");
      }

      const tags = await mc(config, `/lists/${config.listId}/members/${hash}/tags`);
      const existingPrize = prizeFromTags(tags.json.tags);
      if (existingPrize) {
        return { prize: existingPrize, alreadyUnwrapped: true };
      }

      const prize = rollPrize();
      const tagged = await mc(config, `/lists/${config.listId}/members/${hash}/tags`, {
        method: "POST",
        body: JSON.stringify({
          tags: [{ name: PRIZE_TAGS[prize], status: "active" }],
        }),
      });
      if (!tagged.ok) {
        throw new Error("Could not save your prize. Try again in a moment.");
      }
      return { prize, alreadyUnwrapped: false };
    },
  };
}

const filePath = () =>
  process.env.VERCEL
    ? "/tmp/goldleaf-players.json"
    : path.join(process.cwd(), ".data/players.json");

let writeQueue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn, fn);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readPlayers(): Promise<PlayerRecord[]> {
  try {
    const raw = await readFile(filePath(), "utf8");
    const parsed = JSON.parse(raw) as PlayerRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePlayers(players: PlayerRecord[]): Promise<void> {
  const dest = filePath();
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, JSON.stringify(players, null, 2));
}

function fileStore(): Store {
  return {
    async register(input) {
      return withLock(async () => {
        const email = normalizeEmail(input.email);
        const players = await readPlayers();
        if (players.some((p) => p.email === email)) {
          throw new PlayedBeforeError();
        }
        const record: PlayerRecord = {
          email,
          givenName: input.givenName,
          surname: input.surname,
          consent: true,
          registeredAt: new Date().toISOString(),
          prize: null,
          unwrappedAt: null,
        };
        players.push(record);
        await writePlayers(players);
        return record;
      });
    },

    async unwrap(email) {
      return withLock(async () => {
        const players = await readPlayers();
        const record = players.find((p) => p.email === normalizeEmail(email));
        if (!record) {
          throw new Error("This play session is no longer valid.");
        }
        if (record.prize) {
          return { prize: record.prize, alreadyUnwrapped: true };
        }
        const prize = rollPrize();
        record.prize = prize;
        record.unwrappedAt = new Date().toISOString();
        await writePlayers(players);
        return { prize, alreadyUnwrapped: false };
      });
    },
  };
}

export function getStore(): Store {
  const config = mailchimpConfig();
  return config ? mailchimpStore(config) : fileStore();
}

export function storeMode(): "mailchimp" | "mock" {
  return mailchimpConfig() ? "mailchimp" : "mock";
}
