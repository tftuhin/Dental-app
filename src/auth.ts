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
    "⚠️ [DentalOS1 Auth] No DATABASE_URL: local demo login enabled (dr.smith@dentai.com, dr.tanvir@dentai.com, reception@dentai.com)."
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dentalos1-auth-jwt-production-secret-min32chars-2026",
  adapter: DrizzleAdapter(db, {
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
    verificationTokensTable: verificationTokens as any,
  }),
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "google-client-id-placeholder",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || "google-client-secret-placeholder",
    }),
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
        token.role = (user as any).role;
        token.clinicId = (user as any).clinicId;
        token.userId = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).clinicId = token.clinicId;
        (session.user as any).id = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
});
