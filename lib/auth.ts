import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
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
