import Link from "next/link";
import { acceptInvitationAction } from "./actions";

export default async function InvitationPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token = "", error } = await searchParams;
  return (
    <main className="portal-shell">
      <header className="portal-header"><Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>INVITATION PROFESSIONNELLE</small></span></Link></header>
      <section className="portal-hero compact"><p className="kicker">ORGANISATION / ACCÈS LIMITÉ</p><h1>Rejoindre un espace ATLAS.</h1><p className="lead">L’invitation est temporaire, à usage unique et rattache le compte uniquement à l’organisation concernée.</p></section>
      <section className="portal-panel">
        {error && <p className="notice">{error === "mismatch" ? "Les mots de passe ne correspondent pas." : "L’invitation est invalide, expirée ou déjà utilisée."}</p>}
        <form action={acceptInvitationAction} className="auth-form">
          <input type="hidden" name="token" value={token} />
          <label>Nom affiché<input name="displayName" required minLength={2} autoComplete="name" /></label>
          <label>Mot de passe<input name="password" type="password" required minLength={16} autoComplete="new-password" /></label>
          <label>Confirmation<input name="confirmation" type="password" required minLength={16} autoComplete="new-password" /></label>
          <button className="primary" type="submit" disabled={!token}>Créer le compte professionnel</button>
        </form>
      </section>
    </main>
  );
}
