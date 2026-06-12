import { createAuthClient } from "better-auth/react";

function normalizeClientBaseUrl(input?: string) {
  if (!input) return undefined;
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url =
      (process.env.NODE_ENV === "production" ? "https://" : "http://") + url;
  }
  if (process.env.NODE_ENV === "production" && url.startsWith("http://")) {
    url = url.replace(/^http:\/\//i, "https://");
  }
  return url.replace(/\/$/, "");
}

export const authClient = createAuthClient({
  baseURL:
    normalizeClientBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    "http://localhost:3000",
});
