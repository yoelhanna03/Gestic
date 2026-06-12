import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();

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
                // If providerUserId is missing but providerAccountId is present, map it.
                if (
                  data &&
                  !Object.prototype.hasOwnProperty.call(
                    data,
                    "providerUserId",
                  ) &&
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
                // Log payload for debugging if providerUserId is still missing
                if (
                  data &&
                  !Object.prototype.hasOwnProperty.call(data, "providerUserId")
                ) {
                  console.warn(
                    "[Prisma Proxy] account.create called without providerUserId:",
                    JSON.stringify(data),
                  );
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
      if (!resend) {
        console.warn("RESEND_API_KEY not set; skipping verification email");
        return;
      }

      const from =
        process.env.EMAIL_FROM || `no-reply@${new URL(baseURL).hostname}`;

      const html = `
                <p>Bonjour ${user.name ?? "membre"},</p>
                <p>Merci de vous être inscrit. Cliquez sur le lien suivant pour vérifier votre adresse e-mail :</p>
                <p><a href="${url}" target="_blank" rel="noopener">Vérifier mon e-mail</a></p>
                <p>Si le lien ne fonctionne pas, copiez-collez cette URL dans votre navigateur :</p>
                <pre>${url}</pre>
                <p>Merci,<br/>L'équipe Gestic</p>
            `;

      try {
        await resend.emails.send({
          from,
          to: user.email,
          subject: "Vérifiez votre adresse e-mail pour Gestic",
          html,
        });
      } catch (err) {
        console.error("Failed to send verification email via Resend:", err);
      }
    },
    // Optionally, after a successful verification you can auto sign-in or run hooks
    autoSignInAfterVerification: false,
  },
});
