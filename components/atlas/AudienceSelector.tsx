import type { AtlasAudience } from "../../lib/atlas/types";

const LABELS: Record<AtlasAudience, string> = { adolescent: "Adolescents", adult: "Adultes", senior: "Seniors" };
const COPY: Record<AtlasAudience, string> = {
  adolescent: "Mode discret, langage direct, adulte de confiance et protections renforcées.",
  adult: "Charge mentale, décisions, relations, travail, limites et reconstruction.",
  senior: "Voix prioritaire, texte agrandi, rythme lent, organisation et sécurité numérique.",
};

export function AudienceSelector({ active, onSelect }: { active: AtlasAudience; onSelect: (audience: AtlasAudience) => void }) {
  return <div className="cards audience-cards">{(Object.keys(LABELS) as AtlasAudience[]).map((audience, index) => (
    <article key={audience} className={active === audience ? "selected" : ""}>
      <span>0{index + 1}</span><h3>{LABELS[audience]}</h3><p>{COPY[audience]}</p>
      <button onClick={() => onSelect(audience)}>Activer cet univers</button>
    </article>
  ))}</div>;
}

export { LABELS as AUDIENCE_LABELS };
