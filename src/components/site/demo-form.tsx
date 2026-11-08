"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

type Interest = "demo" | "quote" | "question";

const INTERESTS: Array<{ value: Interest; label: string }> = [
  { value: "demo", label: "Book a demo" },
  { value: "quote", label: "Get a price quote" },
  { value: "question", label: "Ask a question" },
];

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";
const label = "mb-1.5 block text-sm font-medium text-slate-700";

/** The website's contact form: demo, quote or question. */
export function DemoForm({ defaultInterest = "demo" }: { defaultInterest?: Interest }) {
  const [interest, setInterest] = useState<Interest>(defaultInterest);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setState("sending");
    try {
      const res = await fetch("/api/public/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, interest }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("We couldn't send that. Check your connection and try again.");
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-teal-700" />
        <h3 className="mt-3 text-lg font-semibold text-slate-900">Thank you. We have your details.</h3>
        <p className="mt-1 text-sm text-slate-600">Someone from our team will get back to you soon, by the way you asked.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
      <fieldset>
        <legend className={label}>What would you like?</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {INTERESTS.map((i) => (
            <label
              key={i.value}
              className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-colors ${
                interest === i.value ? "border-teal-700 bg-teal-50 text-teal-900" : "border-slate-300 text-slate-700 hover:border-slate-400"
              }`}
            >
              <input type="radio" name="interest-choice" value={i.value} checked={interest === i.value} onChange={() => setInterest(i.value)} className="sr-only" />
              {i.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="df-name" className={label}>Your name *</label>
          <input id="df-name" name="name" required minLength={2} autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor="df-clinic" className={label}>Clinic name</label>
          <input id="df-clinic" name="clinicName" autoComplete="organization" className={field} />
        </div>
        <div>
          <label htmlFor="df-phone" className={label}>Mobile number *</label>
          <input id="df-phone" name="phone" required type="tel" autoComplete="tel" placeholder="01XXX-XXXXXX" className={field} />
        </div>
        <div>
          <label htmlFor="df-email" className={label}>Email</label>
          <input id="df-email" name="email" type="email" autoComplete="email" className={field} />
        </div>
        <div>
          <label htmlFor="df-city" className={label}>City or area</label>
          <input id="df-city" name="city" autoComplete="address-level2" placeholder="e.g. Dhanmondi, Dhaka" className={field} />
        </div>
        <div>
          <label htmlFor="df-chairs" className={label}>Number of dental chairs</label>
          <select id="df-chairs" name="chairs" className={field} defaultValue="">
            <option value="">Choose…</option>
            <option>1</option>
            <option>2–3</option>
            <option>4–6</option>
            <option>7 or more</option>
            <option>More than one branch</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="df-message" className={label}>
          {interest === "question" ? "Your question *" : "Anything we should know? (optional)"}
        </label>
        <textarea
          id="df-message"
          name="message"
          rows={4}
          required={interest === "question"}
          maxLength={2000}
          placeholder={interest === "quote" ? "How many doctors work at the clinic? Do you need SMS reminders?" : "What do you use today: paper, Excel or other software?"}
          className={field}
        />
      </div>

      <fieldset>
        <legend className={label}>Best way to reach you</legend>
        <div className="flex flex-wrap gap-4 text-sm text-slate-700">
          {[
            ["phone", "Phone call"],
            ["whatsapp", "WhatsApp"],
            ["email", "Email"],
          ].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2">
              <input type="radio" name="preferredContact" value={v} defaultChecked={v === "phone"} className="h-4 w-4 accent-teal-700" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Hidden from people; bots fill it */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-teal-800 disabled:opacity-70 sm:w-auto"
      >
        {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
        {interest === "quote" ? "Request a quote" : interest === "question" ? "Send question" : "Request a demo"}
      </button>
      <p className="text-xs text-slate-500">We only use these details to reply to you. See our <a href="/privacy" className="underline">privacy policy</a>.</p>
    </form>
  );
}
