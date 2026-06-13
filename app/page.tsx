import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FaShieldAlt, FaFileContract, FaBell, FaUsers } from "react-icons/fa";
import { PricingCard } from "@/components/landing/PricingCard";

export default async function LandingPage() {
  const hdrs = await headers();
  const headersObj = Object.fromEntries(hdrs.entries());
  try {
    const session = await auth.api.getSession({ headers: headersObj });
    if (session) redirect("/dashboard");
  } catch (e) {
    // ignore session check failures and render landing page
    console.warn("[Landing] session check failed", e);
  }
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-xl">
          <FaShieldAlt className="text-primary" />
          <span className="tracking-tight">Gestic</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#features" className="hover:text-primary transition-colors">
            Fonctionnalités
          </a>
          <a href="#pricing" className="hover:text-primary transition-colors">
            Tarifs
          </a>
          <Link
            href="/auth/signin"
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Se connecter
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative px-6 py-20 md:py-32 max-w-7xl mx-auto w-full text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            La sérénité pour vos{" "}
            <span className="text-primary">documents familiaux</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
            Gestic centralise vos contrats, abonnements et papiers importants
            dans un coffre-fort numérique ultra-sécurisé. Ne ratez plus jamais
            une date de résiliation ou un renouvellement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              Créer mon coffre-fort
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 rounded-lg border border-border font-semibold text-lg hover:bg-accent transition-colors"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tout ce dont votre foyer a besoin
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une plateforme conçue pour simplifier la gestion administrative du
              foyer et protéger vos données les plus précieuses.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FaFileContract className="text-2xl" />}
              title="Centralisation Totale"
              description="Contrats, assurances, baux, et abonnements. Tout est au même endroit, accessible en un clic."
            />
            <FeatureCard
              icon={<FaBell className="text-2xl" />}
              title="Alertes Intelligentes"
              description="Recevez des notifications avant l'expiration de vos contrats pour éviter les reconductions tacites."
            />
            <FeatureCard
              icon={<FaUsers className="text-2xl" />}
              title="Accès Familial"
              description="Partagez les documents importants avec vos proches en toute sécurité et transparence."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Des tarifs adaptés à tous
          </h2>
          <p className="text-muted-foreground">
            Commencez gratuitement et passez au premium pour plus de stockage et
            de fonctionnalités.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PricingCard
            plan="Gratuit"
            price="0€"
            features={[
              "Jusqu'à 10 documents",
              "1 membre famille",
              "Alertes basiques (email)",
              "Support communautaire",
            ]}
            cta="Commencer gratuitement"
            highlight={false}
          />
          <PricingCard
            plan="Premium"
            price="4.99€/mois"
            features={[
              "Documents illimités",
              "Membres famille illimités",
              "Alertes avancées (SMS/Email)",
              "Support prioritaire",
              "Chiffrement renforcé",
            ]}
            cta="Passer au Premium"
            highlight={true}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg">
            <FaShieldAlt className="text-primary" />
            <span className="tracking-tight">Gestic</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Gestic. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground">
              Confidentialité
            </a>
            <a href="/terms" className="hover:text-foreground">
              CGU
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 rounded-2xl border border-border bg-background hover:shadow-lg transition-shadow">
      <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
