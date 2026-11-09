import type { Metadata } from "next";
import { Phone, Mail, MessageCircle, MapPin, Clock } from "lucide-react";
import { PageIntro, Section } from "@/components/site/blocks";
import { DemoForm } from "@/components/site/demo-form";
import { COMPANY } from "@/site/config";

export const metadata: Metadata = {
  title: "Contact and demo",
  description: "Book a demo of DentalOSbd, ask for a price quote, or send us a question.",
};

const digits = (s: string) => s.replace(/\D/g, "");

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ interest?: string }> }) {
  const { interest } = await searchParams;
  const initial = interest === "quote" || interest === "question" ? interest : "demo";

  const ways = [
    { icon: Phone, label: "Call us", value: COMPANY.phone, href: `tel:+${digits(COMPANY.phone)}` },
    { icon: MessageCircle, label: "WhatsApp", value: COMPANY.whatsapp, href: `https://wa.me/${digits(COMPANY.whatsapp)}` },
    { icon: Mail, label: "Email", value: COMPANY.email, href: `mailto:${COMPANY.email}` },
    { icon: MapPin, label: "Office", value: COMPANY.address },
    { icon: Clock, label: "Hours", value: COMPANY.hours },
  ];

  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Let's talk about your clinic"
        intro="Book a demo, ask for a quote, or just ask a question. A demo takes about half an hour and works best with a doctor and someone from the front desk on the call."
      />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="font-display text-3xl font-extrabold text-slate-900">What happens next</h2>
              <ol className="space-y-3 text-[15px] leading-relaxed text-slate-600">
                <li>
                  <span className="font-semibold text-slate-900">1. We call you</span> to find a time that suits the clinic, usually outside
                  your busiest hours.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">2. We show you a real visit</span> from booking to receipt, using the kind of
                  cases your clinic sees.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">3. You decide</span> whether it&apos;s worth setting up. No pressure either way.
                </li>
              </ol>
            </div>
            <ul className="space-y-4">
              {ways.map((w) => (
                <li key={w.label} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <w.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm text-slate-500">{w.label}</span>
                    {w.href ? (
                      <a href={w.href} className="font-medium text-slate-900 hover:text-teal-800">
                        {w.value}
                      </a>
                    ) : (
                      <span className="font-medium text-slate-900">{w.value}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <DemoForm defaultInterest={initial} />
        </div>
      </Section>
    </>
  );
}
