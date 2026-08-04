"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const INITIAL_STATE: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, INITIAL_STATE);

  return (
    <main className="portal-shell auth-shell">
      <header className="portal-header">
        <Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>ACCÈS SÉCURISÉ</small></span></Link>
        <span className="environment-badge">SESSION SERVEUR</span>
      </header>
      <section className="auth-panel">
        <p className="kicker">IDENTITÉ / AUTORISATION</p>
        <h1>Entrer dans votre espace ATLAS.</h1>
        <p>La connexion nécessite une base PostgreSQL configurée et un compte créé par un administrateur autorisé.</p>
        <form action={action}>
          <label htmlFor="email">Adresse électronique</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Mot de passe</label>
          <input id="password" name="password" type="password" autoComplete="current-password" minLength={12} required />
          {state.error && <p className="notice" role="alert">{state.error}</p>}
          <button className="primary" type="submit" disabled={pending}>{pending ? "Vérification…" : "Se connecter"}</button>
        </form>
      </section>
    </main>
  );
}
