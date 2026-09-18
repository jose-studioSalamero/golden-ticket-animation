import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Game } from "../game/Game";
import type { Prize } from "../game/prizes";
import { errorMessage } from "../lib/errorMessage";
import { readPlaySession, writePlaySession } from "../session";

export function Play() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryToken = searchParams.get("token");
  const token = queryToken ?? readPlaySession()?.token ?? null;

  useEffect(() => {
    if (queryToken) {
      const existing = readPlaySession();
      writePlaySession({
        token: queryToken,
        givenName: existing?.givenName ?? "",
        surname: existing?.surname ?? "",
        email: existing?.email ?? "",
      });
      setSearchParams({}, { replace: true });
      return;
    }
    if (!token) {
      navigate("/", { replace: true });
    }
  }, [navigate, queryToken, setSearchParams, token]);

  if (!token) {
    return (
      <div className="flex h-svh items-center justify-center bg-[#2a1148] font-display tracking-[0.2em] text-[#f2e6c4]">
        OPENING THE BAR…
      </div>
    );
  }

  return <Game onReveal={() => unwrapPrize(token)} onBack={() => navigate("/")} />;
}

async function unwrapPrize(token: string): Promise<Prize> {
  const res = await fetch("/api/unwrap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ token }),
  });
  const data = (await res.json()) as { ok?: boolean; prize?: Prize; error?: unknown };
  if (!data.ok || (data.prize !== "golden" && data.prize !== "discount")) {
    throw new Error(errorMessage(data.error, "The ticket would not come free. Try again."));
  }
  return data.prize;
}
