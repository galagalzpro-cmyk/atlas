import Link from "next/link";
import { requestResetAction } from "./actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <main className="portal-shell">
      <header className="portal-header"><Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>RÉCUPÉRATION D’ACCÈS</small></span></Link></header>
      <section className="portal-hero compact">
        <p className="kicker">ACCÈS SÉCURISÉ</p><h1>Réinitialiser le mot de passe.</h1>
        <p className="lead">Saisissez l’adresse du compte. La réponse reste identique qu’un compte existe ou non.</p>
      </section>
      <section className="portal-panel">
        {sent === "1" ? <p className="notice">La demande a été traitée. Consultez votre messagerie si un compte correspond à cette adresse.</p> : (
          <form action={requestResetAction} className="auth-form">
            <label>Adresse électronique<input type="email" name="email" required autoComplete="email" /></label>
            <button className="primary" type="submit">Envoyer le lien sécurisé</button>
          </form>
        )}
      </section>
    </main>
  );
}
