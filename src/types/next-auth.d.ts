// Extra fields DentalOS1 keeps on the signed-in user (set in src/auth.ts callbacks).
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    clinicId?: string | null;
  }

  interface Session {
    user: {
      id?: string;
      role?: string;
      clinicId?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: string;
    clinicId?: string | null;
    userId?: string;
  }
}
