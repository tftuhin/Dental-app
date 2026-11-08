import type { Metadata } from "next";
import Link from "next/link";
import { Lock, KeyRound, Building2, LogOut, WifiOff, UserCog, FileSignature, Database } from "lucide-react";
import { CtaBand, PageIntro, Section } from "@/components/site/blocks";
import { COMPANY } from "@/site/config";

export const metadata: Metadata = {
  title: "Security and data",
  description: "How DentalOS1 keeps each clinic's patient records separate, private and available.",
};

const POINTS = [
  {
    icon: Building2,
    title: "Each clinic's records are separate",
    text: "Every record belongs to one clinic. Staff can only open the records of the clinic their account belongs to; nobody at another practice can see your patients.",
  },
  {
    icon: KeyRound,
    title: "Personal sign-ins",
    text: "Each member of staff signs in with their own email and password. Passwords are stored as one-way hashes, so not even we can read them.",
  },
  {
    icon: Lock,
    title: "Encrypted connections",
    text: "Everything between the clinic's computers and our servers travels over HTTPS, the same encryption your bank's website uses.",
  },
  {
    icon: Database,
    title: "Stored on managed cloud servers",
    text: "Records are kept in a managed PostgreSQL database rather than on a computer at the clinic, so a broken hard disk or a stolen laptop doesn't take your patient files with it.",
  },
  {
    icon: LogOut,
    title: "Nothing left behind on shared computers",
    text: "When someone signs out, the clinic's data is cleared from that browser. Anything not yet saved is sent first.",
  },
  {
    icon: WifiOff,
    title: "Safe through a dropped connection",
    text: "If the internet goes down mid-visit, changes are held on the computer and sent the moment the connection returns. A badge in the corner shows whether everything is saved.",
  },
  {
    icon: UserCog,
    title: "The right people approve the right things",
    text: "Reminders to patients are drafted by the system but only go out after a doctor has read and approved them. Only the clinic owner can connect an SMS phone.",
  },
  {
    icon: FileSignature,
    title: "A record of consent",
    text: "Each printed consent form is saved with the visit exactly as it was printed, along with who signed and when, or a note that the patient declined.",
  },
];

export default function SecurityPage() {
  return (
    <>
      <PageIntro
        eyebrow="Security and data"
        title="Your patients trust you with their records. We take that seriously."
        intro="Here is, in plain words, how DentalOS1 looks after the information your clinic keeps."
      />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2">
          {POINTS.map((p) => (
            <div key={p.title} className="h-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/25"><p.icon className="h-6 w-6" /></span>
              <h2 className="font-display mt-4 text-xl font-bold text-slate-900">{p.title}</h2>
              <p className="mt-1.5 leading-relaxed text-slate-600">{p.text}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section className="bg-slate-50">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="font-display text-3xl font-extrabold text-slate-900">Who owns the data?</h2>
          <p className="leading-relaxed text-slate-600">
            Your clinic does. We store and process patient records on your behalf, only to run DentalOS1 for you. We don&apos;t sell them, we
            don&apos;t use them for advertising, and we don&apos;t share them except where the law requires it. If you stop using DentalOS1, you
            can ask us for a copy of your records.
          </p>
          <p className="leading-relaxed text-slate-600">
            The details are in our <Link href="/privacy" className="font-medium text-teal-800 underline">privacy policy</Link> and{" "}
            <Link href="/terms" className="font-medium text-teal-800 underline">terms of service</Link>. For anything else, write to{" "}
            <a href={`mailto:${COMPANY.privacyEmail}`} className="font-medium text-teal-800 underline">
              {COMPANY.privacyEmail}
            </a>
            .
          </p>
        </div>
      </Section>
      <CtaBand title="Questions about data or security?" text="Book a call and bring your questions. We'll walk through how records are stored and who can see what." />
    </>
  );
}
