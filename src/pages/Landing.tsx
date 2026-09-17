import { useNavigate } from "react-router-dom";
import { clearPlaySession, writePlaySession } from "../session";
import { useState, type FormEvent } from "react";

export function Landing() {
  const navigate = useNavigate();
  const [givenName, setGivenName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState(readQueryError);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          FNAME: givenName,
          LNAME: surname,
          EMAIL: email,
          name: consent ? "on" : "",
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        token?: string;
        givenName?: string;
        surname?: string;
        email?: string;
        code?: string;
      };

      if (!data.ok || !data.token) {
        if (data.code === "already_played" || data.error === "you have played before") {
          navigate("/already-played");
          return;
        }
        setError(data.error || "Something went wrong. Try again.");
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
    <div className="relative min-h-svh overflow-y-auto bg-[#2a1148]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(82,32,128,0.55)_0%,_#2a1148_58%)]" />
      <main className="relative mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center px-5 py-12 sm:px-8">
        <p className="gold-text text-center font-script text-4xl leading-none sm:text-5xl">Goldleaf</p>
        <h1 className="gold-text mt-4 text-center font-display text-[clamp(1.15rem,3.4vw,1.7rem)] font-semibold tracking-[0.18em]">
          TAKE ME TO THE CHOCOLATE BAR
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center font-body text-base leading-relaxed text-[#f4e7c5]/80 sm:text-lg">
          One play per email. Unwrap a Goldleaf bar for a vanishingly rare Golden Ticket — or 5% off tickets.
        </p>

        <form
          name="Contact Form"
          aria-label="Contact Form"
          method="post"
          action="/api/register"
          onSubmit={onSubmit}
          className="mt-8 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Given Name*"
              name="FNAME"
              autoComplete="given-name"
              value={givenName}
              onChange={setGivenName}
            />
            <Field
              label="Surname*"
              name="LNAME"
              autoComplete="family-name"
              value={surname}
              onChange={setSurname}
            />
          </div>
          <Field
            label="Email*"
            name="EMAIL"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-[#d9c89a]/25 bg-black/15 px-3 py-3">
            <input
              type="checkbox"
              name="name"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-[#d4b056]"
            />
            <span className="font-body text-sm leading-snug text-[#f4e7c5]/85">
              I agree to receive marketing and promotional materials from Broadway International Group and Great
              Entertainment Group *
            </span>
          </label>

          {error ? (
            <p role="alert" className="border border-[#ffb4a2]/40 bg-[#4a1828]/70 px-3 py-2 font-body text-sm text-[#ffd4c8]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[linear-gradient(180deg,#f4e19a_0%,#e0b84a_48%,#c4921e_100%)] px-5 py-3.5 font-display text-sm font-semibold tracking-[0.18em] text-[#4a2a12] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? "CHECKING THE LIST…" : "TAKE ME TO THE CHOCOLATE BAR"}
          </button>
        </form>
      </main>
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
    <label className="block">
      <span className="font-display text-[0.68rem] tracking-[0.22em] text-[#f2e6c4]">{label}</span>
      <input
        type={type}
        name={name}
        required
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full border border-[#d9c89a]/50 bg-[#1b0a30]/70 px-3 py-2.5 font-body text-base text-[#fff8e8] outline-none transition placeholder:text-[#f4e7c5]/30 focus:border-[#f3dd8a]"
      />
    </label>
  );
}
