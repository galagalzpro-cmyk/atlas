"use client";

import { useEffect, useMemo, useState } from "react";
import { getJourneyForAudience } from "../../lib/atlas/journeys";
import { speakAtlasText } from "../../lib/atlas/voice";
import { trackAtlasEvent } from "../../lib/atlas/analytics";
import type { AtlasAudience } from "../../lib/atlas/types";

interface GuidedJourneyProps {
  audience: AtlasAudience;
  analyticsConsent: boolean;
}

export function GuidedJourney({ audience, analyticsConsent }: GuidedJourneyProps) {
  const journey = useMemo(() => getJourneyForAudience(audience), [audience]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setStepIndex(0);
    setAnswers({});
    setStarted(false);
  }, [audience]);

  const step = journey.steps[stepIndex];
  const completed = started && stepIndex >= journey.steps.length;

  function start() {
    setStarted(true);
    trackAtlasEvent({ name: "journey_started", audience, timestamp: Date.now(), metadata: { journeyId: journey.id } }, analyticsConsent);
  }

  function answer(option: string) {
    if (!step) return;
    const nextAnswers = { ...answers, [step.id]: option };
    setAnswers(nextAnswers);
    trackAtlasEvent({ name: "journey_step_completed", audience, timestamp: Date.now(), metadata: { journeyId: journey.id, stepId: step.id } }, analyticsConsent);
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    if (nextIndex >= journey.steps.length) {
      trackAtlasEvent({ name: "journey_completed", audience, timestamp: Date.now(), metadata: { journeyId: journey.id } }, analyticsConsent);
    }
  }

  function reset() {
    setStepIndex(0);
    setAnswers({});
    setStarted(false);
  }

  return (
    <section className="guided-journey" aria-labelledby="journey-title">
      <div className="journey-copy">
        <p className="kicker">PARCOURS GUIDÉ</p>
        <h2 id="journey-title">{journey.title}</h2>
        <p className="lead">{journey.purpose}</p>
      </div>

      {!started ? (
        <button className="journey-start" onClick={start}>Commencer le parcours</button>
      ) : completed ? (
        <div className="journey-complete" aria-live="polite">
          <strong>{journey.completion}</strong>
          <ul>{Object.entries(answers).map(([id, value]) => <li key={id}>{value}</li>)}</ul>
          <div className="composer-actions">
            <button onClick={() => speakAtlasText(`${journey.completion}. ${Object.values(answers).join(". ")}`, audience)}>Écouter la synthèse</button>
            <button onClick={reset}>Recommencer</button>
          </div>
        </div>
      ) : step ? (
        <div className="journey-step">
          <span>ÉTAPE {stepIndex + 1} / {journey.steps.length}</span>
          <h3>{step.prompt}</h3>
          <div className="journey-options">
            {step.options.map((option) => <button key={option} onClick={() => answer(option)}>{option}</button>)}
          </div>
        </div>
      ) : null}
    </section>
  );
}
