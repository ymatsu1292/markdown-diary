import NextAuth from 'next-auth'
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    error?: string,
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    expires_at?: number | null,
    error?: string | null,
  }
}
