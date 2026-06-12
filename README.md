# Gestic 🛡️

Gestic est un coffre-fort administratif familial ultra-sécurisé conçu pour centraliser les documents importants d'un foyer (contrats, abonnements, assurances, identités) et automatiser la surveillance de leurs dates d'expiration.

## 🚀 Fonctionnalités Clés
- **Centralisation Familiale** : Espace partagé pour tous les membres du foyer.
- **Alertes Intelligentes** : Système de scan automatique détectant les documents arrivant à expiration.
- **Gestion des Abonnements** : Intégration Stripe pour un passage fluide du plan Gratuit au plan Premium.
- **Interface Moderne** : Dashboard responsive construit avec Next.js, Tailwind CSS et shadcn/ui.

## 🛠️ Stack Technique
- **Framework**: Next.js (App Router)
- **Authentification**: Better Auth
- **Base de données**: PostgreSQL via Prisma ORM
- **Paiements**: Stripe
- **Validation**: Zod
- **Styling**: Tailwind CSS & Lucide React/React Icons

## ⚙️ Configuration (Variables d'Environnement)

Copiez le fichier `.env.example` et configurez les variables suivantes :

| Variable | Description | Source |
| :--- | :--- | :--- |
| `DATABASE_URL` | URL de connexion PostgreSQL | Hébergeur DB |
| `BETTER_AUTH_SECRET` | Secret pour les sessions Better Auth | Généré aléatoirement |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | Dashboard Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret du Webhook Stripe | Dashboard Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | Dashboard Stripe |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'application | Déploiement |
| `CRON_SECRET` | Clé de sécurité pour l'API de scan | Généré aléatoirement |

## 🚢 Déploiement

1. Pousser le code sur GitHub.
2. Connecter le dépôt à Vercel.
3. Configurer les variables d'environnement.
4. Configurer un Cron Job sur Vercel pour appeler `/api/cron/check-alerts?key=VOTRE_SECRET` toutes les 24 heures.

## 📜 Licence
Propriété de l'utilisateur.
