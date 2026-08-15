"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type ConsentState = {
  version: 1;
  analytics: boolean;
  marketing: boolean;
};

type TrackingWindow = typeof window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

const CONSENT_STORAGE_KEY = "atlas.consent.v1";
const DEFAULT_CONSENT: ConsentState = { version: 1, analytics: false, marketing: false };

function readStoredConsent(): ConsentState | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<ConsentState>;
    if (value.version !== 1 || typeof value.analytics !== "boolean" || typeof value.marketing !== "boolean") return null;
    return { version: 1, analytics: value.analytics, marketing: value.marketing };
  } catch {
    return null;
  }
}

function expireTrackingCookies() {
  for (const item of document.cookie.split(";")) {
    const name = item.split("=")[0]?.trim();
    if (!name || !/^(_ga|_gid|_gcl|_fbp|_fbc)/.test(name)) continue;
    document.cookie = name + "=; Max-Age=0; Path=/; SameSite=Lax";
  }
}

function buildGoogleBootstrap(analyticsId: string, adsId: string, consent: ConsentState) {
  const configurations = [];
  if (analyticsId && consent.analytics) {
    configurations.push("gtag('config', " + JSON.stringify(analyticsId) + ", { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });");
  }
  if (adsId && consent.marketing) configurations.push("gtag('config', " + JSON.stringify(adsId) + ");");
  return "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());" + configurations.join("");
}

function buildMetaBootstrap(pixelId: string) {
  return "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('consent','grant');fbq('init'," + JSON.stringify(pixelId) + ");fbq('track','PageView');";
}

export default function AtlasConsentManager() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);
  const [draft, setDraft] = useState<ConsentState>(DEFAULT_CONSENT);
  const firstChoiceRef = useRef<HTMLInputElement | null>(null);
  const analyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() ?? "";
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
  const googleLoaderId = consent.analytics && analyticsId ? analyticsId : consent.marketing ? adsId : "";

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      setConsent(stored);
      setDraft(stored);
    }
    else setOpen(true);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => firstChoiceRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function save(next: ConsentState) {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
    setConsent(next);
    setDraft(next);
    setOpen(false);
    const tracking = window as TrackingWindow;
    tracking.gtag?.("consent", "update", {
      analytics_storage: next.analytics ? "granted" : "denied",
      ad_storage: next.marketing ? "granted" : "denied",
      ad_user_data: next.marketing ? "granted" : "denied",
      ad_personalization: next.marketing ? "granted" : "denied",
    });
    tracking.fbq?.("consent", next.marketing ? "grant" : "revoke");
    if (!next.analytics || !next.marketing) expireTrackingCookies();
  }

  if (!ready) return null;

  return (
    <>
      {googleLoaderId ? (
        <>
          <Script src={"https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(googleLoaderId)} strategy="afterInteractive" />
          <Script id="atlas-google-consent-bootstrap" strategy="afterInteractive">
            {buildGoogleBootstrap(analyticsId, adsId, consent)}
          </Script>
        </>
      ) : null}
      {consent.marketing && metaPixelId ? (
        <Script id="atlas-meta-consent-bootstrap" strategy="afterInteractive">
          {buildMetaBootstrap(metaPixelId)}
        </Script>
      ) : null}

      {!open ? <button type="button" className="atlas-consent-manage" onClick={() => { setDraft(consent); setOpen(true); }}>Gérer les traceurs</button> : null}
      {open ? (
        <section className="atlas-consent-panel" role="dialog" aria-labelledby="atlas-consent-title" aria-describedby="atlas-consent-description">
          <div className="atlas-consent-copy">
            <p className="atlas-consent-kicker">VOTRE CHOIX</p>
            <h2 id="atlas-consent-title">Des traceurs seulement si vous les acceptez.</h2>
            <p id="atlas-consent-description">Le fonctionnement essentiel reste actif. Les mesures d’audience et outils marketing sont séparés, désactivés par défaut et révocables à tout moment.</p>
          </div>
          <div className="atlas-consent-options">
            <label><span><strong>Mesure d’audience</strong><small>Statistiques agrégées, si un identifiant est configuré.</small></span><input ref={firstChoiceRef} type="checkbox" checked={draft.analytics} onChange={(event) => setDraft((current) => ({ ...current, analytics: event.target.checked }))} /></label>
            <label><span><strong>Marketing</strong><small>Google Ads et Meta Pixel, uniquement si configurés.</small></span><input type="checkbox" checked={draft.marketing} onChange={(event) => setDraft((current) => ({ ...current, marketing: event.target.checked }))} /></label>
          </div>
          <div className="atlas-consent-actions">
            <button type="button" onClick={() => save(DEFAULT_CONSENT)}>Tout refuser</button>
            <button type="button" onClick={() => save(draft)}>Enregistrer mes choix</button>
            <button type="button" className="is-primary" onClick={() => save({ version: 1, analytics: true, marketing: true })}>Tout accepter</button>
          </div>
        </section>
      ) : null}
    </>
  );
}
