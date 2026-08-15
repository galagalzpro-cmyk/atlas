export interface AtlasLegalProfile {
  entity: string;
  legalForm: string;
  address: string;
  registrationId: string;
  shareCapital: string;
  publicationDirector: string;
  vatId: string;
  supportEmail: string;
  privacyEmail: string;
  securityEmail: string;
  humanRelay: string;
  hostLegalName: string;
  hostLegalAddress: string;
  hostContact: string;
  termsVersion: string;
  privacyVersion: string;
  identityComplete: boolean;
  contactsComplete: boolean;
  hostingComplete: boolean;
  documentsComplete: boolean;
  complete: boolean;
  missing: string[];
}

const REQUIRED_FIELDS = [
  ["ATLAS_LEGAL_ENTITY", "nom légal de l’éditeur"],
  ["ATLAS_LEGAL_FORM", "forme juridique"],
  ["ATLAS_LEGAL_ADDRESS", "adresse publiable"],
  ["ATLAS_REGISTRATION_ID", "immatriculation SIREN/SIRET"],
  ["ATLAS_PUBLICATION_DIRECTOR", "directeur de publication"],
  ["ATLAS_SUPPORT_EMAIL", "adresse de support"],
  ["ATLAS_PRIVACY_EMAIL", "adresse confidentialité"],
  ["ATLAS_SECURITY_EMAIL", "adresse sécurité"],
  ["ATLAS_HUMAN_RELAY", "relais humain surveillé"],
  ["ATLAS_HOST_LEGAL_NAME", "identité de l’hébergeur"],
  ["ATLAS_HOST_LEGAL_ADDRESS", "adresse de l’hébergeur"],
  ["ATLAS_TERMS_VERSION", "version des conditions"],
  ["ATLAS_PRIVACY_VERSION", "version de confidentialité"],
] as const;

function value(env: Record<string, string | undefined>, key: string): string {
  return env[key]?.trim() || "";
}

function validEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

export function getAtlasLegalProfile(env: Record<string, string | undefined> = process.env): AtlasLegalProfile {
  const entity = value(env, "ATLAS_LEGAL_ENTITY");
  const legalForm = value(env, "ATLAS_LEGAL_FORM");
  const address = value(env, "ATLAS_LEGAL_ADDRESS");
  const registrationId = value(env, "ATLAS_REGISTRATION_ID");
  const shareCapital = value(env, "ATLAS_SHARE_CAPITAL");
  const publicationDirector = value(env, "ATLAS_PUBLICATION_DIRECTOR");
  const vatId = value(env, "ATLAS_VAT_ID");
  const supportEmail = value(env, "ATLAS_SUPPORT_EMAIL");
  const privacyEmail = value(env, "ATLAS_PRIVACY_EMAIL");
  const securityEmail = value(env, "ATLAS_SECURITY_EMAIL");
  const humanRelay = value(env, "ATLAS_HUMAN_RELAY");
  const hostLegalName = value(env, "ATLAS_HOST_LEGAL_NAME");
  const hostLegalAddress = value(env, "ATLAS_HOST_LEGAL_ADDRESS");
  const hostContact = value(env, "ATLAS_HOST_CONTACT");
  const termsVersion = value(env, "ATLAS_TERMS_VERSION");
  const privacyVersion = value(env, "ATLAS_PRIVACY_VERSION");

  const missing = REQUIRED_FIELDS
    .filter(([key]) => !value(env, key))
    .map(([, label]) => label);

  if (supportEmail && !validEmail(supportEmail)) missing.push("adresse de support valide");
  if (privacyEmail && !validEmail(privacyEmail)) missing.push("adresse confidentialité valide");
  if (securityEmail && !validEmail(securityEmail)) missing.push("adresse sécurité valide");

  const identityComplete = Boolean(entity && legalForm && address && registrationId && publicationDirector);
  const contactsComplete = Boolean(
    validEmail(supportEmail)
      && validEmail(privacyEmail)
      && validEmail(securityEmail)
      && humanRelay,
  );
  const hostingComplete = Boolean(hostLegalName && hostLegalAddress);
  const documentsComplete = Boolean(termsVersion && privacyVersion);
  const complete = identityComplete && contactsComplete && hostingComplete && documentsComplete;

  return {
    entity,
    legalForm,
    address,
    registrationId,
    shareCapital,
    publicationDirector,
    vatId,
    supportEmail,
    privacyEmail,
    securityEmail,
    humanRelay,
    hostLegalName,
    hostLegalAddress,
    hostContact,
    termsVersion,
    privacyVersion,
    identityComplete,
    contactsComplete,
    hostingComplete,
    documentsComplete,
    complete,
    missing: Array.from(new Set(missing)),
  };
}
