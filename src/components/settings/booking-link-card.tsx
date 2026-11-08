"use client";

import { useState } from "react";
import { Link2, Copy, Check, ExternalLink, Globe, MapPin, ThumbsUp, Code2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { bookingLink } from "@/lib/messaging-store";

const PLACES = [
  {
    key: "facebook",
    icon: ThumbsUp,
    title: "Facebook page",
    steps: [
      "Open your clinic's Facebook page and choose Edit (or the action button under the cover photo).",
      'Add a button, choose "Book now" (or "Book with you"), then "Link to website".',
      "Paste your booking link and save. Patients who tap the button land on your booking page.",
    ],
  },
  {
    key: "google",
    icon: MapPin,
    title: "Google Business Profile",
    steps: [
      "Search for your clinic on Google while signed in to the account that manages it, or open business.google.com.",
      'Choose Edit profile → Contact → "Appointment links" (or "Bookings").',
      "Paste your booking link and save. A booking button appears on your Google Search and Maps listing.",
    ],
  },
  {
    key: "website",
    icon: Globe,
    title: "Your website",
    steps: [
      'Add a "Book an appointment" button that links to your booking page,',
      "or paste the embed code below where you want the booking form to appear.",
    ],
  },
];

/** Settings: the clinic's public booking page, and how to put it on Facebook, Google and a website. */
export function BookingLinkCard() {
  const [link] = useState(() => bookingLink());
  const [copied, setCopied] = useState<string | null>(null);
  const embed = link
    ? `<iframe src="${link}" title="Book an appointment" style="width:100%;min-height:900px;border:0;border-radius:12px" loading="lazy"></iframe>`
    : "";

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      toast.success(what === "link" ? "Booking link copied." : "Embed code copied.");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b bg-muted/20 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Link2 className="h-4 w-4 text-primary" />
          Online booking: Facebook, Google and your website
        </CardTitle>
        <CardDescription className="text-xs">
          Put your booking link wherever patients find you. Every booking made through it lands in today&apos;s queue on its own.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 text-xs">
        {link ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-lg border bg-muted/40 px-3 py-2 font-mono text-[12px]">{link}</code>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => copy(link, "link")}>
                {copied === "link" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy link
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                <a href={link} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Your booking link appears here once the clinic is set up with the database.</p>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          {PLACES.map((p) => (
            <div key={p.key} className="rounded-lg border p-3">
              <p className="flex items-center gap-1.5 font-semibold">
                <p.icon className="h-4 w-4 text-primary" />
                {p.title}
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-muted-foreground">
                {p.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {embed && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 font-semibold">
                <Code2 className="h-4 w-4 text-primary" />
                Embed the booking form on your website
              </p>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => copy(embed, "embed")}>
                {copied === "embed" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy code
              </Button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-slate-100">{embed}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
