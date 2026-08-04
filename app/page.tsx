const SYSTEMS = [
  ["01", "Adaptive Intelligence", "Un moteur d’état interprète le contexte, la progression, les signaux d’usage et les préférences autorisées pour recomposer l’expérience en temps réel."],
  ["02", "Generative Worlds", "Les représentations, scénarios, sons, textes et environnements sont produits ou assemblés dynamiquement selon des règles gouvernées."],
  ["03", "Scenario Orchestration", "Chaque interaction peut déclencher un scénario, une transition, un objectif, une vérification ou une bifurcation contrôlée."],
  ["04", "Trust Core", "Consentement, sécurité, audit, mémoire, suppression, supervision et repli sont intégrés au cœur de chaque flux."],
  ["05", "Business Platform", "Comptes, organisations, abonnements, paiements, droits d’accès, analytics, CRM et opérations appartiennent au même système."],
  ["06", "Observability", "Chaque composant critique expose son état, ses erreurs, sa latence, son coût et ses dépendances afin d’être exploitable professionnellement."],
];

export default function Home() {
  return (
    <main>
      <header className="shell nav">
        <a href="#top" className="brand"><span>◈</span><strong>ATLAS</strong><small>ZERO FOUNDATION</small></a>
        <nav><a href="#vision">Vision</a><a href="#systems">Systèmes</a><a href="#architecture">Architecture</a><a href="#roadmap">Construction</a></nav>
        <span className="status"><i /> REBUILD ISOLÉ</span>
      </header>

      <section className="hero shell" id="top">
        <div>
          <p className="eyebrow">NOUVELLE FONDATION / ZÉRO HÉRITAGE UI</p>
          <h1>ATLAS n’est pas une page.<br /><em>C’est un système vivant.</em></h1>
          <p className="lead">Cette branche ne reprend aucune ancienne interface. Elle pose le socle d’une plateforme adaptative, générative, temps réel, commerciale et gouvernée.</p>
          <div className="hero-actions"><a href="#architecture">Voir l’architecture</a><a href="#roadmap">Voir la méthode</a></div>
        </div>
        <div className="core" aria-hidden="true"><span /><span /><span /><b>ATLAS</b></div>
      </section>

      <section className="section shell" id="vision">
        <p className="eyebrow">01 / VISION</p>
        <h2>Construire une infrastructure d’expérience, pas décorer un chatbot.</h2>
        <div className="split"><p>ATLAS devra analyser, décider, générer, orchestrer, mesurer et se reconfigurer selon le contexte réel de l’utilisateur, sans sacrifier la sécurité ni la maîtrise opérationnelle.</p><p>Le site public, les espaces utilisateurs, les interfaces professionnelles, le commerce, les moteurs IA et l’administration seront conçus comme des produits distincts reliés par un même noyau.</p></div>
      </section>

      <section className="section dark" id="systems">
        <div className="shell">
          <p className="eyebrow">02 / SYSTÈMES FONDAMENTAUX</p>
          <h2>Chaque capacité devient un domaine autonome, testable et observable.</h2>
          <div className="grid">{SYSTEMS.map(([index, title, text]) => <article key={index}><span>{index}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className="section shell" id="architecture">
        <p className="eyebrow">03 / ARCHITECTURE</p>
        <h2>Une construction par couches, avec frontières explicites.</h2>
        <div className="layers"><article><strong>Experience Layer</strong><span>Public, particulier, professionnel, entreprise, administration.</span></article><article><strong>Orchestration Layer</strong><span>Scénarios, états, événements, règles, génération et temps réel.</span></article><article><strong>Intelligence Layer</strong><span>Modèles, mémoire, classification, planification, outils et évaluations.</span></article><article><strong>Platform Layer</strong><span>Identité, organisations, paiements, données, analytics, CRM et notifications.</span></article><article><strong>Governance Layer</strong><span>Sécurité, consentement, audit, conformité, observabilité et reprise.</span></article></div>
      </section>

      <section className="section shell" id="roadmap">
        <p className="eyebrow">04 / CONSTRUCTION</p>
        <h2>On ne déclarera plus une fonction terminée parce qu’elle s’affiche.</h2>
        <ol className="roadmap"><li><span>01</span><div><strong>Contrat fonctionnel</strong><p>Objectif, acteurs, données, erreurs, risques et critères d’acceptation.</p></div></li><li><span>02</span><div><strong>Architecture de domaine</strong><p>Frontières, responsabilités, dépendances et événements.</p></div></li><li><span>03</span><div><strong>Implémentation complète</strong><p>Interface, logique métier, stockage, sécurité et intégrations.</p></div></li><li><span>04</span><div><strong>Validation professionnelle</strong><p>Tests, performance, accessibilité, observabilité, repli et documentation.</p></div></li></ol>
      </section>

      <footer className="shell footer"><strong>ATLAS ZERO</strong><span>Branche isolée — production inchangée</span><small>Fondation initiale</small></footer>
    </main>
  );
}
