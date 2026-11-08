import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { and, eq, gt, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { demoRequests } from "@/db/schema";

// The website's "Book a demo / get a quote" form. No login. Saved to
// demo_requests and listed for the team at /enquiries in the app.

const schema = z.object({
  name: z.string().trim().min(2).max(150),
  clinicName: z.string().trim().max(200).optional().default(""),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v.replace(/\D/g, "").length >= 10, "phone"),
  email: z.union([z.literal(""), z.string().trim().email().max(150)]).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  chairs: z.string().trim().max(20).optional().default(""),
  interest: z.enum(["demo", "quote", "question"]).default("demo"),
  preferredContact: z.enum(["phone", "whatsapp", "email"]).default("phone"),
  message: z.string().trim().max(2000).optional().default(""),
  // Honeypot: hidden from people, filled by bots
  website: z.string().optional(),
});

const MESSAGES: Record<string, string> = {
  name: "Please enter your name.",
  phone: "Please enter a phone number we can reach you on.",
  email: "That email address doesn't look right.",
  message: "Your message is a little long. Please keep it under 2,000 characters.",
};

const PER_HOUR = 5;

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return NextResponse.json({ error: MESSAGES[field] || "Please check the form and try again." }, { status: 400 });
  }
  const input = parsed.data;
  if (input.website) return NextResponse.json({ ok: true });

  if (!isDatabaseConfigured) {
    return NextResponse.json({ error: "The form isn't connected yet. Please call or email us instead." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
  const ipHash = ip ? createHash("sha256").update(`${process.env.AUTH_SECRET || "dentalos1"}:${ip}`).digest("hex") : null;

  try {
    if (ipHash) {
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(demoRequests)
        .where(and(eq(demoRequests.ipHash, ipHash), gt(demoRequests.createdAt, new Date(Date.now() - 3600_000))));
      if (n >= PER_HOUR) {
        return NextResponse.json({ error: "We've already received your messages. We'll be in touch soon." }, { status: 429 });
      }
    }
    await db.insert(demoRequests).values({
      name: input.name,
      clinicName: input.clinicName || null,
      phone: input.phone,
      email: input.email || null,
      city: input.city || null,
      chairs: input.chairs || null,
      interest: input.interest,
      preferredContact: input.preferredContact,
      message: input.message || null,
      ipHash,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to save demo request:", err);
    return NextResponse.json({ error: "Something went wrong on our side. Please call or email us instead." }, { status: 500 });
  }
}
