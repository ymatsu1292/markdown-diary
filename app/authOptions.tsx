import NextAuth from 'next-auth';
import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { jwtDecode } from 'jwt-decode';
import { JWT } from 'next-auth/jwt';
import { cookies } from 'next/headers';

export const authOptions: NextAuthOptions = {
  debug: true,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "パスワード認証",
      credentials: {
        password: { label: "パスワード", type: "password" }
      },
      async authorize(credentials, req) {
        console.log("authorize:", credentials);
        if (credentials != undefined && credentials["password"] == process.env["AUTH_PASSWORD"]) {
          let userId = process.env["AUTH_USER"];
          const user: User = { id: userId || "", name: userId || "", email: userId || "", image: "" };
          return user;
        }
        return null;
      }
    }),
  ],
};

export default NextAuth(authOptions);
