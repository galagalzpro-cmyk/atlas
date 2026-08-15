import assert from "node:assert/strict";
import { getAtlasLegalProfile } from "../lib/atlas/legal-profile.ts";

{
  const profile = getAtlasLegalProfile({});
  assert.equal(profile.complete, false);
  assert.equal(profile.identityComplete, false);
  assert.ok(profile.missing.includes("nom légal de l’éditeur"));
}

{
  const profile = getAtlasLegalProfile({
    ATLAS_LEGAL_ENTITY: "ATLAS SAS",
    ATLAS_LEGAL_FORM: "Société par actions simplifiée",
    ATLAS_LEGAL_ADDRESS: "1 rue Exemple, 75000 Paris",
    ATLAS_REGISTRATION_ID: "SIREN 000 000 000",
    ATLAS_PUBLICATION_DIRECTOR: "Direction ATLAS",
    ATLAS_SUPPORT_EMAIL: "support@atlas.fr",
    ATLAS_PRIVACY_EMAIL: "privacy@atlas.fr",
    ATLAS_SECURITY_EMAIL: "security@atlas.fr",
    ATLAS_HUMAN_RELAY: "Support humain du lundi au vendredi",
    ATLAS_HOST_LEGAL_NAME: "Hébergeur Exemple",
    ATLAS_HOST_LEGAL_ADDRESS: "Adresse hébergeur",
    ATLAS_TERMS_VERSION: "2026-08-15",
    ATLAS_PRIVACY_VERSION: "2026-08-15",
  });
  assert.equal(profile.complete, true);
  assert.equal(profile.missing.length, 0);
}

{
  const profile = getAtlasLegalProfile({
    ATLAS_SUPPORT_EMAIL: "adresse-invalide",
  });
  assert.equal(profile.contactsComplete, false);
  assert.ok(profile.missing.includes("adresse de support valide"));
}

console.log("ATLAS legal profile tests passed.");
