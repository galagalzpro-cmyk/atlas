import Link from "next/link";
import { AtlasSiteShell, SitePageHero } from "../../components/site/AtlasSiteShell";

const CARDS = [
  ["01","Parler naturellement","Écrire ou parler sans devoir choisir un parcours rigide. ATLAS ajuste la profondeur, le rythme et la posture à partir de l’échange."],
  ["02","Comprendre ce qui se joue","Le système distingue les faits, les hypothèses, les tensions et les besoins possibles sans les présenter comme des certitudes."],
  ["03","Retrouver une direction","ATLAS peut organiser les options, éclairer les compromis et proposer un prochain pas sans décider à votre place."],
  ["04","Rester en contrôle","La mémoire, les capacités externes et les actions sensibles restent soumises au consentement, aux politiques et à des limites explicites."],
  ["05","Changer de rythme","La présence visuelle, la voix et l’intensité peuvent ralentir, s’effacer ou devenir plus structurées selon le contexte."],
  ["06","Réparer l’échange","Lorsqu’une compréhension est mauvaise, ATLAS doit pouvoir le reconnaître, corriger sa lecture et reprendre le fil sans insister."],
] as const;

export default function ExperiencePage(){return <AtlasSiteShell><SitePageHero eyebrow="L’EXPÉRIENCE ATLAS" title="Un espace qui s’adapte à votre manière d’être là." lead="ATLAS est conçu comme une présence numérique capable d’écouter, de raisonner, d’expliquer, de proposer et de ralentir. L’expérience reste simple en façade, même lorsque plusieurs moteurs travaillent derrière." actions={<><Link className="site-primary-button" href="/conversation">Entrer dans le salon</Link><Link className="site-link-button" href="/architecture">Voir l’architecture</Link></>}/><section className="site-section site-section-tight"><div className="site-grid">{CARDS.map(([n,t,p],i)=><article className={`site-card${i===0?" site-card-feature":""}`} key={n}><span>{n}</span><h3>{t}</h3><p>{p}</p></article>)}</div></section><section className="site-band"><div><p className="site-eyebrow">PRÉSENCE CONTINUE</p><h2>ATLAS ne doit pas seulement répondre. Il doit maintenir le fil.</h2><p>Contexte, rythme, mémoire consentie, réparations, sécurité et préférences doivent converger vers une seule expérience cohérente.</p></div><Link className="site-primary-button" href="/conversation">Tester ATLAS</Link></section></AtlasSiteShell>}
