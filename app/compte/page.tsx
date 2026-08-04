import Link from "next/link";
import { requireUser } from "../../lib/server/auth";
import { listOrganizationsForUser } from "../../lib/server/organizations";
import { logoutAction } from "../connexion/actions";

export default async function AccountPage() {
  const user = await requireUser();
  const organizations = await listOrganizationsForUser(user.id);
  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>COMPTE</small></span></Link>
        <form action={logoutAction}><button type="submit">Se déconnecter</button></form>
      </header>
      <section className="portal-hero compact"><p className="kicker">IDENTITÉ / ACCÈS / CONTRÔLE</p><h1>{user.displayName}</h1><p className="lead">{user.email} · rôle plateforme : {user.role}</p></section>
      <section className="portal-grid">
        <article><span>01</span><h2>Sécurité</h2><p>Les sessions sont stockées sous forme de jetons hachés et peuvent être révoquées après réinitialisation du mot de passe.</p><Link href="/mot-de-passe-oublie">Changer le mot de passe</Link></article>
        <article><span>02</span><h2>Organisations</h2><p>{organizations.length} organisation(s) active(s) rattachée(s) à ce compte.</p>{organizations.map((organization) => <small key={organization.id}>{organization.name} · {organization.role}<br /></small>)}</article>
        <article><span>03</span><h2>Données</h2><p>ATLAS ne stocke pas les textes émotionnels dans le profil, les analytics, les journaux d’audit ou les exécutions IA.</p><Link href="/confidentialite">Consulter la politique de données</Link></article>
      </section>
    </main>
  );
}
