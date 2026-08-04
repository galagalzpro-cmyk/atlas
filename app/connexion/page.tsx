"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const INITIAL_STATE: LoginState = {};
const TEST_PASSWORD = "atlas-test-2026";
const TEST_ACCOUNTS = [
  ["Membre", "membre@atlas.test"],
  ["Professionnel", "professionnel@atlas.test"],
  ["Responsable", "organisation@atlas.test"],
  ["Administration", "admin@atlas.test"],
] as const;

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, INITIAL_STATE);

  return (
    <main className="portal-shell auth-shell">
      <header className="portal-header">
        <Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>ACCÈS SÉCURISÉ</small></span></Link>
        <span className="environment-badge">PHASE DE TEST</span>
      </header>
      <section className="auth-panel">
        <p className="kicker">IDENTITÉ / AUTORISATION</p>
        <h1>Entrer dans votre espace ATLAS.</h1>
        <p>Choisissez un profil de test pour vérifier les parcours, les rôles et les espaces fonctionnels.</p>
        <div className="readiness-row">
          {TEST_ACCOUNTS.map(([label, email]) => (
            <button key={email} type="button" onClick={() => {
              const emailInput = document.getElementById("email") as HTMLInputElement | null;
              const passwordInput = document.getElementById("password") as HTMLInputElement | null;
              if (emailInput) emailInput.value = email;
              if (passwordInput) passwordInput.value = TEST_PASSWORD;
            }}>{label}</button>
          ))}
        </div>
        <form action={action}>
          <label htmlFor="email">Adresse électronique</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Mot de passe</label>
          <input id="password" name="password" type="password" autoComplete="current-password" minLength={12} required />
          <small>Mot de passe commun de test : <strong>{TEST_PASSWORD}</strong></small>
          {state.error && <p className="notice" role="alert">{state.error}</p>}
          <button className="primary" type="submit" disabled={pending}>{pending ? "Vérification…" : "Se connecter"}</button>
        </form>
      </section>
    </main>
  );
}
