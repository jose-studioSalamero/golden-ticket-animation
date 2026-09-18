import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { errorMessage } from "../lib/errorMessage";
import { clearPlaySession, writePlaySession } from "../session";

export function Landing() {
  const navigate = useNavigate();
  const [givenName, setGivenName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(readQueryError);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAlreadyPlayed(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          givenName,
          surname,
          email,
          consent,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: unknown;
        token?: string;
        givenName?: string;
        surname?: string;
        email?: string;
        code?: string;
      };

      if (!data.ok || !data.token) {
        const message = errorMessage(data.error ?? data);
        if (data.code === "already_played" || message === "you have played before") {
          setAlreadyPlayed(true);
          return;
        }
        if (/server error has occurred/i.test(message) || /protected deployment/i.test(message)) {
          setError("The chocolate bar is still warming up. Wait a moment and try again.");
          return;
        }
        setError(message);
        return;
      }

      clearPlaySession();
      writePlaySession({
        token: data.token,
        givenName: data.givenName ?? givenName,
        surname: data.surname ?? surname,
        email: data.email ?? email,
      });
      navigate("/play");
    } catch {
      setError("Could not reach the chocolate bar. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-y-auto bg-[#2a1148] px-4 py-10">
      <div className="entry-card">
        <header className="flex w-full flex-col items-center gap-4 text-center">
          <h1 className="font-brygada text-[clamp(1.65rem,4vw,2.25rem)] leading-[1.2] font-semibold text-[#480401]">
            READY TO UNWRAP YOUR CHANCE?
          </h1>
          <p className="font-brygada max-w-[32rem] text-[1.125rem] leading-[150%] font-normal text-black">
            You found the special chocolate bar. Tell us who you are, then tap to unwrap your Golden Ticket
          </p>
        </header>

        <form
          name="Contact Form"
          aria-label="Contact Form"
          method="post"
          action="/api/register"
          onSubmit={onSubmit}
          className="flex w-full flex-col gap-8"
        >
          <div className="grid w-full gap-8 sm:grid-cols-2">
            <Field
              label="Given Name *"
              name="FNAME"
              autoComplete="given-name"
              value={givenName}
              onChange={setGivenName}
            />
            <Field
              label="Surname *"
              name="LNAME"
              autoComplete="family-name"
              value={surname}
              onChange={setSurname}
            />
          </div>
          <Field
            label="Email *"
            name="EMAIL"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
          />

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="consent"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-black"
            />
            <span className="font-brygada text-[1.125rem] leading-[150%] font-normal text-black">
              I agree to receive marketing and promotional materials from Broadway International Group and Great
              Entertainment Group *
            </span>
          </label>

          {alreadyPlayed ? null : (
            <button
              type="submit"
              disabled={submitting}
              className="mx-auto border border-[#480401] px-8 py-3 font-brygada text-[1.125rem] tracking-[0.12em] text-[#480401] uppercase transition hover:bg-[#480401] hover:text-[#fcf395] disabled:cursor-wait disabled:opacity-70"
            >
              {submitting ? "Checking…" : "Unwrap"}
            </button>
          )}
        </form>

        {alreadyPlayed ? (
          <div className="already-played-alert" role="alert">
            <p className="flex items-center justify-center gap-2 text-center text-[1.125rem] leading-[150%] font-semibold tracking-[0.08em] text-black uppercase">
              <WarningMark />
              You have already played
            </p>
            <p className="max-w-[28rem] text-center">
              It looks like this email address has already entered the factory. Each email address may play only
              once, to keep the giveaway fair for everyone.
            </p>
            <button
              type="button"
              onClick={() => setAlreadyPlayed(false)}
              className="border border-black px-8 py-2.5 font-brygada text-[1.125rem] tracking-[0.16em] text-black uppercase"
            >
              Back
            </button>
          </div>
        ) : null}

        {error && !alreadyPlayed ? (
          <div className="already-played-alert" role="alert">
            <p className="text-center">{error}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function readQueryError(): string | null {
  const error = new URLSearchParams(window.location.search).get("error");
  return error?.trim() || null;
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex w-full flex-col gap-3">
      <span className="font-brygada text-[1.125rem] leading-[150%] font-normal text-black">{label}</span>
      <input
        type={type}
        name={name}
        required
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="entry-field"
      />
    </label>
  );
}

function WarningMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
      <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M12 3.6 21.2 20.2H2.8L12 3.6Z" />
      <path fill="currentColor" d="M11.15 9.2h1.7l-.22 6.1h-1.26L11.15 9.2Zm.08 7.55h1.54v1.62h-1.54V16.75Z" />
    </svg>
  );
}
