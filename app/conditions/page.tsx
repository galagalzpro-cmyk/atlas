import Link from "next/link";
import { getAtlasLegalProfile } from "../../lib/atlas/legal-profile";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  const legal = getAtlasLegalProfile(process.env);
  return (
    <main className="portal-shell">
      <header className="portal-header"><Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>CONDITIONS D’UTILISATION</small></span></Link><span className="environment-badge">{legal.documentsComplete ? `VERSION ${legal.termsVersion}` : "PROJET — NON CONTRACTUEL"}</span></header>
      <section className="portal-hero compact"><p className="kicker">CADRE D’USAGE</p><h1>Une aide à la clarification, jamais une promesse médicale.</h1><p className="lead">{legal.documentsComplete && legal.entity ? `Document publié par ${legal.entity}.` : "Ce document fixe les limites fonctionnelles de la préproduction. Il devra être validé juridiquement avant toute vente ou ouverture au public."}</p></section>
      <section className="portal-panel"><h2>Objet</h2><p>ATLAS propose des parcours de clarification, d’organisation et d’orientation vers un prochain pas. Le service ne réalise pas de diagnostic, de prescription, de psychothérapie ou d’intervention d’urgence.</p></section>
      <section className="portal-panel"><h2>Usage responsable</h2><p>L’utilisateur conserve la responsabilité de ses décisions. En situation de danger immédiat, il doit solliciter les services d’urgence ou une personne réelle en capacité d’intervenir. Les espaces professionnels ne donnent jamais accès aux textes émotionnels libres des utilisateurs.</p></section>
      <section className="portal-panel"><h2>Comptes et organisations</h2><p>Les responsables d’organisation gèrent les invitations et rôles de leur périmètre. Les accès sont personnels, révocables et journalisés. Toute tentative de contournement, d’accès non autorisé ou d’usage abusif peut entraîner la suspension du compte.</p></section>
      <section className="portal-panel"><h2>Paiements</h2><p>Les paiements restent limités au sandbox tant que l’entité juridique, les prix, la fiscalité, la médiation, la résiliation en ligne, les politiques de remboursement et les versions contractuelles définitives ne sont pas configurés.</p></section>
      <section className="portal-panel"><h2>Contacts</h2><p>Téléphone : {legal.legalPhone || "à compléter"} · Support : {legal.supportEmail || "à compléter"} · Confidentialité : {legal.privacyEmail || "à compléter"} · Sécurité : {legal.securityEmail || "à compléter"}</p></section>
    </main>
  );
}
