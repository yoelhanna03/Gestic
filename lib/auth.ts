import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { Resend } from "resend";

const prisma = new PrismaClient();

// Detect whether the Prisma schema includes a `password` field on Account.
const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
let accountHasPassword = false;
try {
  if (fs.existsSync(schemaPath)) {
    const schemaText = fs.readFileSync(schemaPath, "utf8");
    // crude check for a `password` field inside the Account model
    accountHasPassword = /model\s+Account[\s\S]*\bpassword\b/.test(schemaText);
  }
} catch (e) {
  console.warn(
    "[Prisma Proxy] Could not read prisma schema to detect password field:",
    e,
  );
}

// Proxy the Prisma client to intercept `account.create` calls.
// This helps debug and auto-map common field names (e.g. providerAccountId -> providerUserId)
const prismaProxy = new Proxy(prisma, {
  get(target, prop, receiver) {
    const orig = Reflect.get(target, prop, receiver);
    if (prop === "account" && orig) {
      return new Proxy(orig, {
        get(acTarget, method, acReceiver) {
          const origMethod = Reflect.get(acTarget, method, acReceiver);
          if (method === "create" && typeof origMethod === "function") {
            return async function (args: any) {
              try {
                const data = args?.data || {};
                // If providerUserId is missing, try common fallbacks: userId, accountId, providerAccountId
                if (
                  data &&
                  !Object.prototype.hasOwnProperty.call(data, "providerUserId")
                ) {
                  if (Object.prototype.hasOwnProperty.call(data, "userId")) {
                    data.providerUserId = data.userId;
                    args.data = data;
                    console.warn(
                      "[Prisma Proxy] Mapped userId -> providerUserId for account.create",
                    );
                  } else if (
                    Object.prototype.hasOwnProperty.call(data, "accountId")
                  ) {
                    data.providerUserId = data.accountId;
                    args.data = data;
                    console.warn(
                      "[Prisma Proxy] Mapped accountId -> providerUserId for account.create",
                    );
                  } else if (
                    Object.prototype.hasOwnProperty.call(
                      data,
                      "providerAccountId",
                    )
                  ) {
                    data.providerUserId = data.providerAccountId;
                    args.data = data;
                    console.warn(
                      "[Prisma Proxy] Mapped providerAccountId -> providerUserId for account.create",
                    );
                  }
                }

                // Log payload for debugging if providerUserId is still missing
                if (
                  data &&
                  !Object.prototype.hasOwnProperty.call(data, "providerUserId")
                ) {
                  console.warn(
                    "[Prisma Proxy] account.create called without providerUserId. payload:",
                    JSON.stringify(data),
                  );
                }

                // Filter out any unknown fields (like `accountId`) that Prisma model doesn't accept.
                const allowedKeys = new Set([
                  "id",
                  "userId",
                  "providerId",
                  "providerUserId",
                  "accessToken",
                  "refreshToken",
                  "idToken",
                  "accessTokenExpiresAt",
                  "refreshTokenExpiresAt",
                  "scope",
                  "role",
                  "createdAt",
                  "updatedAt",
                ]);

                // Preserve `password` if the Prisma schema actually defines it.
                if (accountHasPassword) {
                  allowedKeys.add("password");
                }

                if (args && args.data && typeof args.data === "object") {
                  const original = args.data;
                  const filtered: any = {};
                  for (const k of Object.keys(original)) {
                    if (allowedKeys.has(k)) {
                      filtered[k] = original[k];
                    } else {
                      // remove unknown fields and log when we drop them
                      console.warn(
                        `[Prisma Proxy] Dropping unknown Account field before create: ${k}`,
                      );
                    }
                  }
                  args.data = filtered;
                }

                return await origMethod.call(acTarget, args);
              } catch (err) {
                console.error("[Prisma Proxy] Error in account.create:", err);
                throw err;
              }
            };
          }
          return origMethod;
        },
      });
    }
    return orig;
  },
});

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function normalizeBaseUrl(input?: string) {
  if (!input) return undefined;
  let url = input.trim();
  // Add protocol if missing. In production prefer https.
  if (!/^https?:\/\//i.test(url)) {
    url =
      (process.env.NODE_ENV === "production" ? "https://" : "http://") + url;
  }
  // Force https in production
  if (process.env.NODE_ENV === "production" && url.startsWith("http://")) {
    url = url.replace(/^http:\/\//i, "https://");
  }
  // Remove trailing slash
  url = url.replace(/\/$/, "");
  return url;
}

const baseURL =
  normalizeBaseUrl(
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  ) || "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prismaProxy as any, {
    provider: "postgresql",
  }),
  baseURL,
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    // enable email verification flows inside Better Auth
    enabled: true,
    // sendVerificationEmail will be called with { user, url, token }
    sendVerificationEmail: async ({ user, url, token }: any) => {
      // Ensure Resend client exists and env vars are present
      if (!resend) {
        console.error("[Auth] RESEND_API_KEY not set or invalid; skipping verification email");
        console.error("[Auth] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
        return;
      }

      const from = process.env.EMAIL_FROM || `no-reply@${new URL(baseURL).hostname}`;
      if (!process.env.EMAIL_FROM) {
        console.warn("[Auth] EMAIL_FROM not set; using fallback:", from);
      }

      const html = `
                <p>Bonjour ${user.name ?? "membre"},</p>
                <p>Merci de vous être inscrit. Cliquez sur le lien suivant pour vérifier votre adresse e-mail :</p>
                <p><a href="${url}" target="_blank" rel="noopener">Vérifier mon e-mail</a></p>
                <p>Si le lien ne fonctionne pas, copiez-collez cette URL dans votre navigateur :</p>
                <pre>${url}</pre>
                <p>Merci,<br/>L'équipe Gestic</p>
            `;

      // Log intent before sending to help debug in Vercel logs
      try {
        console.info("[Auth] Sending verification email via Resend", {
          to: user?.email,
          from,
          baseURL,
          resendApiKeyPresent: !!process.env.RESEND_API_KEY,
        });

        const result = await resend.emails.send({
          from,
          to: user.email,
          subject: "Vérifiez votre adresse e-mail pour Gestic",
          html,
        });

        console.info("[Auth] Resend send result:", result);
      } catch (err: any) {
        // Capture non-enumerable properties and stack for richer logs
        try {
          const serialized = JSON.stringify(err, Object.getOwnPropertyNames(err));
          console.error("[Auth] Erreur Resend (serialized):", serialized);
        } catch (serErr) {
          console.error("[Auth] Erreur Resend (toString):", String(err));
        }
        console.error("[Auth] Erreur Resend stack:", err?.stack || err);
      }
    },
    // Optionally, after a successful verification you can auto sign-in or run hooks
    autoSignInAfterVerification: false,
  },
});
