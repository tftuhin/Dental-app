import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db, isDatabaseConfigured } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Local demo login: only in development AND only when no DATABASE_URL is set.
 * Mirrors the users created by src/db/seed.js so the login page's demo buttons
 * work without a database. Never active in production or once a database is configured.
 */
const DEMO_MODE = !isDatabaseConfigured && process.env.NODE_ENV !== "production";
const DEMO_PASSWORD = "DentAI2026!";
const DEMO_CLINIC_ID = "11111111-1111-1111-1111-111111111111";
const DEMO_USERS = [
  { id: "33333333-3333-3333-3333-333333333333", email: "dr.smith@dentai.com", name: "Dr. Sarah Smith, BDS, FCPS", role: "clinic_owner" },
  { id: "55555555-5555-5555-5555-555555555555", email: "dr.tanvir@dentai.com", name: "Dr. Tanvir Ahmed, BDS (DU), FCPS (Oral Surgery)", role: "clinic_owner" },
  { id: "44444444-4444-4444-4444-444444444444", email: "reception@dentai.com", name: "Rumana Akter", role: "receptionist" },
];

if (DEMO_MODE) {
  console.warn(
    "⚠️ [DentalOSbd Auth] No DATABASE_URL: local demo login enabled (dr.smith@dentai.com, dr.tanvir@dentai.com, reception@dentai.com)."
  );
}

/**
 * The key that signs login sessions. It must come from AUTH_SECRET in
 * production: a key written in the source would let anyone who has the code
 * forge a login. The fixed fallback is only for local development and for
 * `next build` (which loads this file but signs nothing); a production server
 * without AUTH_SECRET refuses logins instead of running insecurely.
 */
const isBuildStep = process.env.NEXT_PHASE === "phase-production-build";
const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV !== "production" || isBuildStep ? "dentalos1-local-development-only-secret-0000" : undefined);

if (!AUTH_SECRET) {
  console.error("[DentalOSbd Auth] AUTH_SECRET is not set. Logins are disabled until it is configured.");
}

/** Google sign-in is offered only when its credentials are configured. */
const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: AUTH_SECRET,
  adapter: DrizzleAdapter(db, {
    // The clinic's users table has extra columns (role, clinic) the adapter's types don't know about
    /* eslint-disable @typescript-eslint/no-explicit-any */
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
    verificationTokensTable: verificationTokens as any,
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }),
  session: {
    strategy: "jwt",
  },
  providers: [
    ...googleProvider,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        if (DEMO_MODE) {
          const demo = DEMO_USERS.find(
            (u) => u.email === String(credentials.email).trim().toLowerCase()
          );
          if (!demo || credentials.password !== DEMO_PASSWORD) return null;
          return { ...demo, clinicId: DEMO_CLINIC_ID };
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clinicId: user.clinicId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.clinicId = user.clinicId;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.clinicId = token.clinicId;
        if (token.userId) session.user.id = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
});
