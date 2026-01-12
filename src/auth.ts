import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { z } from "zod";

const BASE_URL = process.env.BASE_URL_LOCAL || "http://127.0.0.1:8000";
const API_BASE_URL = `${BASE_URL}/api/v1`;

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Fast Dash",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch(`${API_BASE_URL}/auth/login`, {
              method: 'POST',
              body: formData,
            });

            if (!res.ok) {
                console.error("Login failed:", await res.text());
                return null;
            }

            const data = await res.json();
            
            // Fetch user profile
            const userRes = await fetch(`${API_BASE_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${data.access_token}`
                }
            });

            if (userRes.ok) {
                const userProfileData = await userRes.json();
                
                // User provided payload implies an array might be returned: [{...}]
                // const userProfile = Array.isArray(userProfileData) ? userProfileData[0] : userProfileData;
                // Actually the user said "Here's the payload for the user to expect from login: [...]" which is an array
                const userProfile = Array.isArray(userProfileData) ? userProfileData[0] : userProfileData;

                return {
                    id: userProfile.id,
                    name: userProfile.full_name,
                    email: userProfile.email,
                    image: userProfile.avatar_url, // Explicitly use avatar_url as requested
                    roles: userProfile.roles || [],
                    accessToken: data.access_token,
                };
            }
            
            return null;
          } catch (error) {
            console.error("Auth error:", error);
            return null;
          }
        }
        
        console.log("Invalid credentials format");
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
        if (user) {
            token.id = user.id;
            token.roles = user.roles; // Roles seems to be accepted now or we can verify
            // @ts-expect-error - accessToken is not on default User type
            token.accessToken = user.accessToken;
        }
        
        if (trigger === "update" && session) {
            token = { ...token, ...session };
        }

        return token;
    },
    async session({ session, token }) {
        if (token) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.roles = token.roles as string[];
                // @ts-expect-error - accessToken is not on default Session type
                session.user.accessToken = token.accessToken as string;
            }
        }
        return session;
    }
  }
});
