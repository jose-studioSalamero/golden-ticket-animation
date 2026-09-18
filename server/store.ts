import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCache } from "@vercel/functions";
import { rollPrize } from "./prize";
import { ALREADY_PLAYED_MESSAGE, type PlayerRecord, type Prize, type RegisterInput } from "./types";

const PLAYER_TTL_SECONDS = 60 * 60 * 24 * 120;

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

function makePlayer(input: RegisterInput): PlayerRecord {
  return {
    email: normalizeEmail(input.email),
    givenName: input.givenName,
    surname: input.surname,
    consent: true,
    registeredAt: new Date().toISOString(),
    prize: null,
    unwrappedAt: null,
  };
}

function memoryMap(): Map<string, PlayerRecord> {
  const g = globalThis as typeof globalThis & { __goldleafPlayers?: Map<string, PlayerRecord> };
  g.__goldleafPlayers ??= new Map();
  return g.__goldleafPlayers;
}

function memoryStore(): Store {
  const players = memoryMap();
  return {
    async register(input) {
      const email = normalizeEmail(input.email);
      if (players.has(email)) throw new PlayedBeforeError();
      const record = makePlayer(input);
      players.set(email, record);
      return record;
    },
    async unwrap(email) {
      const record = players.get(normalizeEmail(email));
      if (!record) throw new Error("This play session is no longer valid.");
      if (record.prize) return { prize: record.prize, alreadyUnwrapped: true };
      record.prize = rollPrize();
      record.unwrappedAt = new Date().toISOString();
      players.set(record.email, record);
      return { prize: record.prize, alreadyUnwrapped: false };
    },
  };
}

function createRuntimeCache() {
  try {
    return getCache({ namespace: "goldleaf-players" });
  } catch (err) {
    console.error("runtime cache init failed", err);
    return null;
  }
}

function runtimeCacheStore(): Store {
  const cache = createRuntimeCache();
  const fallback = memoryStore();
  if (!cache) return fallback;

  return {
    async register(input) {
      const email = normalizeEmail(input.email);
      try {
        const existing = (await cache.get(email)) as PlayerRecord | undefined;
        if (existing) throw new PlayedBeforeError();
        const record = makePlayer(input);
        await cache.set(email, record, {
          ttl: PLAYER_TTL_SECONDS,
          tags: ["players"],
          name: "goldleaf-player",
        });
        return record;
      } catch (err) {
        if (err instanceof PlayedBeforeError) throw err;
        console.error("runtime cache register failed", err);
        return fallback.register(input);
      }
    },
    async unwrap(email) {
      const key = normalizeEmail(email);
      try {
        const record = (await cache.get(key)) as PlayerRecord | undefined;
        if (!record) throw new Error("This play session is no longer valid.");
        if (record.prize) return { prize: record.prize, alreadyUnwrapped: true };
        record.prize = rollPrize();
        record.unwrappedAt = new Date().toISOString();
        await cache.set(key, record, {
          ttl: PLAYER_TTL_SECONDS,
          tags: ["players"],
          name: "goldleaf-player",
        });
        return { prize: record.prize, alreadyUnwrapped: false };
      } catch (err) {
        if (err instanceof Error && err.message === "This play session is no longer valid.") throw err;
        console.error("runtime cache unwrap failed", err);
        return fallback.unwrap(email);
      }
    },
  };
}

const filePath = () => path.join(process.cwd(), ".data/players.json");

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
        if (players.some((p) => p.email === email)) throw new PlayedBeforeError();
        const record = makePlayer(input);
        players.push(record);
        await writePlayers(players);
        return record;
      });
    },
    async unwrap(email) {
      return withLock(async () => {
        const players = await readPlayers();
        const record = players.find((p) => p.email === normalizeEmail(email));
        if (!record) throw new Error("This play session is no longer valid.");
        if (record.prize) return { prize: record.prize, alreadyUnwrapped: true };
        record.prize = rollPrize();
        record.unwrappedAt = new Date().toISOString();
        await writePlayers(players);
        return { prize: record.prize, alreadyUnwrapped: false };
      });
    },
  };
}

export function getStore(): Store {
  return process.env.VERCEL ? runtimeCacheStore() : fileStore();
}
