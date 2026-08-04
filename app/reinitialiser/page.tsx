import Link from "next/link";
import { resetPasswordAction } from "./actions";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token = "", error } = await searchParams;
  return (
    <main className="portal-shell">
      <header className="portal-header"><Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>NOUVEAU MOT DE PASSE</small></span></Link></header>
      <section className="portal-hero compact"><p className="kicker">SESSION RÉVOCABLE</p><h1>Créer un nouvel accès.</h1><p className="lead">Le changement révoque toutes les sessions actives du compte.</p></section>
      <section className="portal-panel">
        {error && <p className="notice">{error === "mismatch" ? "Les deux mots de passe ne correspondent pas." : "Le lien est invalide ou expiré."}</p>}
        <form action={resetPasswordAction} className="auth-form">
          <input type="hidden" name="token" value={token} />
          <label>Nouveau mot de passe<input type="password" name="password" minLength={16} required autoComplete="new-password" /></label>
          <label>Confirmation<input type="password" name="confirmation" minLength={16} required autoComplete="new-password" /></label>
          <button className="primary" type="submit" disabled={!token}>Réinitialiser et fermer les sessions</button>
        </form>
      </section>
    </main>
  );
}
