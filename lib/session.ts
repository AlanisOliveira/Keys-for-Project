import type { SessionOptions } from "iron-session";

export interface SessionData {
  userId: string;
  role: string;
}

const sessionPassword = process.env.SESSION_SECRET ?? "build-only-session-secret-with-32chars";

export const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: "vault_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  },
};
