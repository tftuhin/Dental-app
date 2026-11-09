import type { Metadata } from "next";
import { CtaBand, PageIntro, Section } from "@/components/site/blocks";

export const metadata: Metadata = {
  title: "Questions and answers",
  description: "Answers to the questions dental clinics ask about DentalOSbd: setup, computers, internet, SMS, WhatsApp, Bangla, payments and patient records.",
};

const GROUPS: Array<{ title: string; items: Array<{ q: string; a: string }> }> = [
  {
    title: "Getting started",
    items: [
      {
        q: "Do we need to install anything?",
        a: "No. DentalOSbd runs in a web browser such as Chrome, Edge or Safari, so it works on laptops, desktops, tablets and phones. Any reasonably recent device at the clinic will do.",
      },
      {
        q: "How long does it take to set up?",
        a: "Most of the work is entering your doctors, chairs, opening hours and fees. A small clinic can do it in an afternoon. We can go through it with you on a call.",
      },
      {
        q: "Can we bring our existing patient records?",
        a: "If your patients are in an Excel sheet or another program, send us a sample. We'll tell you what can be moved across before anything is changed.",
      },
      {
        q: "Is there a mobile app?",
        a: "Not a separate one. DentalOSbd works in the phone's browser, which is enough for checking the day's queue or a patient's file away from the desk.",
      },
    ],
  },
  {
    title: "Day to day",
    items: [
      {
        q: "Can reception and the doctors use it at the same time?",
        a: "Yes. Every computer in the clinic works on the same records. A patient checked in at the desk shows up in the doctor's room shortly after, without anyone refreshing.",
      },
      {
        q: "Can patients book from our Facebook page or Google listing?",
        a: "Yes. Every clinic gets an online booking page. Add its link to your Facebook page's Book now button and to the appointment link in your Google Business Profile, or embed the booking form on your website. Settings shows the link, the embed code and the steps for each.",
      },
      {
        q: "What happens if the internet goes down?",
        a: "Pages already open keep working, and anything you change is kept on that computer and sent as soon as the connection is back. You need the internet to sign in and to open the app in the first place.",
      },
      {
        q: "We don't do orthodontics or implants. Can we hide those sections?",
        a: "Yes. The odontogram, perio chart, orthodontics, prosthodontics, AI assistant and consent forms can each be switched off in settings. Turning one off hides it; nothing already recorded is deleted.",
      },
      {
        q: "What does the AI do?",
        a: "Two things, both on request. In the consultation, the AI Assistant suggests likely diagnoses, tests, procedures and allergy-checked medicines from your notes. On the prescription pad, it drafts the prescription from the visit, explaining its choices. The doctor reviews everything, and the assistant can be switched off in settings.",
      },
      {
        q: "Will the prescription look like ours?",
        a: "Prescriptions print with your clinic's name, address and phone, and the doctor's degrees and BMDC registration number. The medicine list covers the brands sold in Bangladesh, and you can add your own.",
      },
      {
        q: "How are bKash and Nagad payments recorded?",
        a: "Choose the method when taking payment and enter the transaction ID. It appears on the receipt and in the collections report, so you can match it against your merchant statement.",
      },
    ],
  },
  {
    title: "Messages and reminders",
    items: [
      {
        q: "Can we send SMS from the clinic's own number?",
        a: "Yes, two ways. Pair the clinic's phone with the computer through Windows Phone Link, and DentalOSbd opens each message there ready to send. Or keep a spare Android phone at the clinic with an SMS gateway app installed, and messages go out automatically from its SIM. Replies to that phone come into DentalOSbd.",
      },
      {
        q: "Does it work with WhatsApp?",
        a: "Yes. Messages open in the WhatsApp account you use at the clinic, personal or WhatsApp Business, with the text already written. You press send in WhatsApp.",
      },
      {
        q: "Can messages be in Bangla?",
        a: "Yes. Write templates in Bangla or English. DentalOSbd counts the characters so you know how many SMS a Bangla message will use, since Bangla SMS hold fewer characters.",
      },
      {
        q: "Will patients get messages we haven't checked?",
        a: "Not reminders. When a patient misses a planned treatment, DentalOSbd drafts the message and waits for the doctor to read and approve it. Campaigns go out only when someone at the clinic sends them.",
      },
    ],
  },
  {
    title: "Data and privacy",
    items: [
      {
        q: "Who can see our patients' records?",
        a: "Only people with a sign-in for your clinic. Each clinic's records are kept apart, and staff at other clinics using DentalOSbd can't see yours.",
      },
      {
        q: "What if a computer breaks or is stolen?",
        a: "Records are stored on our servers, not on the clinic's computers, so you sign in on another machine and carry on. Signing out also clears the clinic's data from a computer.",
      },
      {
        q: "Can we get our data out if we leave?",
        a: "Yes. Ask us and we'll give you a copy of your clinic's records.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageIntro
        eyebrow="Questions and answers"
        title="What clinics ask us"
        intro="If your question isn't here, ask it on a demo call or send it through the contact page."
      />
      <Section>
        <div className="mx-auto max-w-3xl space-y-14">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h2 className="font-display text-2xl font-extrabold text-slate-900">{g.title}</h2>
              <div className="mt-5 space-y-3">
                {g.items.map((f) => (
                  <details key={f.q} className="group rounded-2xl bg-white p-5 ring-1 ring-slate-200 open:shadow-md">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-slate-900">
                      {f.q}
                      <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-2 leading-relaxed text-slate-600">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
      <CtaBand />
    </>
  );
}
