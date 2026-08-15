import Link from "next/link";
import { AtlasSiteShell, SitePageHero } from "../../components/site/AtlasSiteShell";
import { getAtlasLegalProfile } from "../../lib/atlas/legal-profile";

export const dynamic = "force-dynamic";

function shown(value: string, fallback = "À compléter avant lancement public"): string {
  return value || fallback;
}

export default function LegalPage() {
  const legal = getAtlasLegalProfile(process.env);
  const status = legal.complete ? "INFORMATIONS CONFIGURÉES" : "PRÉPRODUCTION PRIVÉE";

  return (
    <AtlasSiteShell compact>
      <SitePageHero
        eyebrow="MENTIONS LÉGALES"
        title={legal.complete ? "Informations de l’éditeur et de l’hébergeur." : "Informations de préproduction."}
        lead={legal.complete
          ? `Mentions publiées par ${legal.entity}. Toute évolution contractuelle doit conserver une version datée.`
          : "Cette version d’ATLAS est une préproduction privée. Les champs non renseignés restent volontairement visibles comme blockers dans l’administration."}
        actions={<Link className="site-link-button" href="/confidentialite">Confidentialité</Link>}
      />
      <section className="site-section site-section-tight">
        <div className="site-grid">
          <article className="site-card site-card-feature">
            <span>STATUT</span>
            <h3>{status}</h3>
            <p>{legal.complete ? `Conditions ${legal.termsVersion} · Confidentialité ${legal.privacyVersion}` : `${legal.missing.length} information(s) publique(s) encore requise(s).`}</p>
          </article>
          <article className="site-card">
            <span>ÉDITEUR</span>
            <h3>{shown(legal.entity)}</h3>
            <p>{shown(legal.legalForm)} · {shown(legal.address)}</p>
            <p>Immatriculation : {shown(legal.registrationId)}</p>
            {legal.shareCapital ? <p>Capital : {legal.shareCapital}</p> : null}
            {legal.vatId ? <p>TVA : {legal.vatId}</p> : null}
          </article>
          <article className="site-card">
            <span>PUBLICATION ET CONTACT</span>
            <h3>{shown(legal.publicationDirector, "Directeur de publication à compléter")}</h3>
            <p>Support : {shown(legal.supportEmail)}</p>
            <p>Sécurité : {shown(legal.securityEmail)}</p>
          </article>
          <article className="site-card">
            <span>HÉBERGEMENT</span>
            <h3>{shown(legal.hostLegalName, "Hébergeur à confirmer")}</h3>
            <p>{shown(legal.hostLegalAddress)}</p>
            {legal.hostContact ? <p>{legal.hostContact}</p> : null}
          </article>
        </div>
      </section>
    </AtlasSiteShell>
  );
}
