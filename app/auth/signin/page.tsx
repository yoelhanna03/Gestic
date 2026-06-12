"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (authError) {
        setError(
          authError.message || "Une erreur est survenue lors de la connexion",
        );
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      setError("Une erreur inattendue est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">Se connecter</h2>
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour accéder à votre coffre-fort familial
        </p>
      </div>

      <form onSubmit={handleSignin} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 rounded-md border border-border bg-background text-sm"
            placeholder="jean@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 rounded-md border border-border bg-background text-sm"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link
          href="/auth/signup"
          className="text-primary font-medium hover:underline"
        >
          Inscrivez-vous
        </Link>
      </div>
    </div>
  );
}
