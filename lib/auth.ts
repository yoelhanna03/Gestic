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
    // ensure verification is triggered on sign-up where supported
    sendOnSignUp: true,
    // sendVerificationEmail will be called with { user, url, token }
    sendVerificationEmail: async ({ user, url, token }: any) => {
      // Immediate trace for send flow start
      try {
        console.info(
          "[Auth] -> Tentative d'envoi d'e-mail initiée pour:",
          user?.email,
          { url, token },
        );
      } catch (e) {
        console.info(
          "[Auth] -> Tentative d'envoi d'e-mail initiée (could not log user/email)",
        );
      }

      // Ensure Resend client exists and env vars are present; throw to surface errors in logs
      if (!resend) {
        console.error(
          "[Auth] RESEND_API_KEY not set or invalid; throwing to surface error in logs",
        );
        console.error(
          "[Auth] RESEND_API_KEY present:",
          !!process.env.RESEND_API_KEY,
        );
        throw new Error("RESEND_API_KEY missing in environment");
      }

      const from =
        process.env.EMAIL_FROM || `no-reply@${new URL(baseURL).hostname}`;
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

        // Log payload explicitly for debugging sender/recipient validity
        try {
          console.info("[Auth] Payload envoyé à Resend:", {
            from: process.env.EMAIL_FROM || from,
            to: user?.email,
          });
        } catch (logErr) {
          console.warn("[Auth] Failed to log Resend payload:", logErr);
        }

        // Await ensures the outbound HTTP call completes before the function returns
        try {
          // Inspect environment variables and keys before sending
          try {
            console.log("[Auth] Check variables:", {
              from: process.env.EMAIL_FROM,
              hasKey: !!process.env.RESEND_API_KEY,
            });
          } catch (lv) {
            console.warn("[Auth] Failed to log env vars:", lv);
          }

          const result = await resend.emails.send({
            from,
            to: user.email,
            subject: "Vérifiez votre adresse e-mail pour Gestic",
            html,
          });

          console.info("[Auth] Resend send result:", result);
        } catch (exception: any) {
          // Ultra-large capture: log the raw exception object and a JSON dump to avoid silent failures
          try {
            console.error(
              "[Auth] CRASH INTERNE RESEND:",
              exception,
              JSON.stringify(exception, null, 2),
            );
          } catch (jserr) {
            console.error(
              "[Auth] CRASH INTERNE RESEND (stringify failed):",
              exception,
            );
          }
          throw exception;
        }
      } catch (err: any) {
        // Capture non-enumerable properties and stack for richer logs
        try {
          const serialized = JSON.stringify(
            err,
            Object.getOwnPropertyNames(err),
          );
          console.error("[Auth] Erreur Resend (serialized):", serialized);
        } catch (serErr) {
          console.error("[Auth] Erreur Resend (toString):", String(err));
        }
        console.error("[Auth] Erreur Resend stack:", err?.stack || err);
        // rethrow so Better Auth surfaces the error in logs/response
        throw err;
      }
    },
    // Optionally, after a successful verification you can auto sign-in or run hooks
    autoSignInAfterVerification: false,
  },
});

// Log auth-related runtime config for debugging in server logs
try {
  console.info("[Auth init] baseURL:", baseURL);
  console.info("[Auth init] emailVerification.enabled:", true);
  console.info(
    "[Auth init] resendApiKeyPresent:",
    !!process.env.RESEND_API_KEY,
  );
} catch (e) {
  // ignore
}

// Dump `auth` object keys to help debug plugin registration
try {
  console.info("[Auth init] auth keys:", Object.keys(auth));
  console.info(
    "[Auth init] auth.emailVerification:",
    typeof (auth as any).emailVerification,
  );
  console.info(
    "[Auth init] auth.emailAndPassword:",
    typeof (auth as any).emailAndPassword,
  );
} catch (e) {
  console.warn("[Auth init] Could not inspect auth object:", e);
}
try {
  const opts = (auth as any).options;
  if (opts && typeof opts === "object") {
    console.info("[Auth init] auth.options keys:", Object.keys(opts));
    console.info(
      "[Auth init] auth.options.emailVerification:",
      !!opts.emailVerification,
    );
    console.info(
      "[Auth init] auth.options.emailAndPassword:",
      !!opts.emailAndPassword,
    );
  }
} catch (e) {
  console.warn("[Auth init] Could not read auth.options:", e);
}
try {
  const api = (auth as any).api;
  if (api && typeof api === "object") {
    console.info("[Auth init] auth.api keys:", Object.keys(api));
    // try to show nested keys if present
    for (const k of Object.keys(api)) {
      try {
        console.info(
          `[Auth init] auth.api.${k} keys:`,
          Object.keys(api[k] || {}),
        );
        if (k === "sendVerificationEmail") {
          try {
            console.info(
              "[Auth init] auth.api.sendVerificationEmail.path:",
              api[k]?.path,
            );
          } catch (e) {}
        }
        if (k === "signUpEmail") {
          try {
            console.info(
              "[Auth init] auth.api.signUpEmail.options:",
              api[k]?.options,
            );
          } catch (e) {}
        }
      } catch (e) {
        // ignore
      }
    }
  }
} catch (e) {
  console.warn("[Auth init] Could not inspect auth.api:", e);
}
