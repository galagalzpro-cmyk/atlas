import Link from "next/link";

const accounts = [
  { role: "Membre", email: "membre@atlas.test", destination: "/compte" },
  { role: "Professionnel", email: "professionnel@atlas.test", destination: "/professionnels" },
  { role: "Responsable d’organisation", email: "organisation@atlas.test", destination: "/professionnels" },
  { role: "Administration", email: "admin@atlas.test", destination: "/administration" },
];

const tests = [
  { title: "Accueil et navigation", href: "/", detail: "Navigation, ancres, responsive, accès à l’expérience et aux espaces." },
  { title: "Conversation ATLAS", href: "/#experience", detail: "Réponse locale, sécurité, publics, voix selon compatibilité du navigateur." },
  { title: "Connexion multi-rôles", href: "/connexion", detail: "Connexion membre, professionnel, responsable et administrateur." },
  { title: "Compte membre", href: "/compte", detail: "Identité, accès, rôle, organisations et contrôle des données." },
  { title: "Espace professionnel", href: "/professionnels", detail: "Organisation de démonstration, rôles, invitations et offre sandbox." },
  { title: "Administration", href: "/administration", detail: "État de la plateforme, capacités, gouvernance et métriques de test." },
  { title: "Mot de passe oublié", href: "/mot-de-passe-oublie", detail: "Parcours de demande de récupération. Aucun e-mail réel sans fournisseur configuré." },
  { title: "Invitation", href: "/invitation", detail: "Écran d’acceptation d’invitation. Un jeton de test est nécessaire pour finaliser le parcours." },
  { title: "Confidentialité", href: "/confidentialite", detail: "Règles de consentement, conservation et limites de traitement." },
  { title: "Conditions", href: "/conditions", detail: "Cadre d’usage, limites fonctionnelles et statut précommercial." },
  { title: "État technique", href: "/api/readiness", detail: "Capacités actives, mode test fonctionnel et dépendances encore absentes." },
];

export default function TestCenterPage() {
  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>CENTRE DE TEST</small></span></Link>
        <span className="environment-badge">ENVIRONNEMENT DE VALIDATION</span>
      </header>

      <section className="portal-hero compact">
        <p className="kicker">TEST COMPLET / PARCOURS / RÔLES / CONTRÔLES</p>
        <h1>Tester ATLAS fonction par fonction.</h1>
        <p className="lead">Ce centre regroupe les fonctions disponibles dans la branche de validation. Les simulations sont explicitement indiquées et ne représentent jamais un paiement, un e-mail ou une persistance réelle.</p>
      </section>

      <section className="portal-panel">
        <p className="kicker">IDENTIFIANTS</p>
        <h2>Mot de passe commun : atlas-test-2026</h2>
        <div className="governance-table">
          {accounts.map((account) => (
            <article key={account.email}>
              <h2>{account.role}</h2>
              <p>{account.email}</p>
              <Link href="/connexion">Ouvrir la connexion</Link>
              <small>Destination après connexion : {account.destination}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-panel">
        <p className="kicker">CHECKLIST FONCTIONNELLE</p>
        <div className="governance-table">
          {tests.map((test, index) => (
            <article key={test.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{test.title}</h2>
              <p>{test.detail}</p>
              <Link href={test.href}>Tester cette fonction</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-panel">
        <p className="kicker">LIMITES ACTUELLES</p>
        <h2>Les services externes ne sont pas encore réels.</h2>
        <p>La base persistante, les paiements Stripe et PayPal, l’envoi d’e-mails, les webhooks et le moteur externe restent désactivés tant que leurs comptes, clés et paramètres ne sont pas configurés. Le reste peut être testé dans ce mode de validation.</p>
      </section>
    </main>
  );
}
