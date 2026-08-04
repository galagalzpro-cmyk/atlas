# ATLAS — Production Blueprint

## 1. Product definition
ATLAS is a multimodal emotional-orientation platform. It is not a diagnostic or emergency-care system. Its visible experience is generated from a stable identity, a governed orchestration layer, and modular cells adapted to user context.

## 2. Non-negotiable principles
- No stock imagery, stock video, generic themes, or decorative media as the central experience.
- Procedural, coded, or contextually generated visual systems only.
- One stable identity; adaptive language, voice, interface, pace, exercises, and environment.
- User control over memory, animation, voice, accessibility, and data retention.
- Safety, consent, and transparency have priority over engagement and conversion.
- Every adaptation must be reversible and explainable.

## 3. Core systems
1. ATLAS Awakening — real loading state and first-contact sequence.
2. Presence Engine — non-human face, attention, listening, thinking, speaking, uncertainty, calm, vigilance.
3. Voice Engine — realtime conversation, interruption, subtitles, rate and clarity controls.
4. Orchestrator — selects cells and interaction posture from context, preferences, confidence, and safety constraints.
5. Procedural World Engine — fog, light, particles, materials, spatial depth, transitions.
6. Spatial Memory — persistent scene graph, confirmed details, uncertainty, corrections, forbidden elements.
7. Cell Runtime — reusable interaction modules with explicit contracts.
8. Safety Engine — crisis routing, age protections, abuse/fraud signals, escalation and human-resource presentation.
9. Memory & Consent — session memory, optional long-term memory, export, correction, deletion and audit trail.
10. Observability — performance, failures, safety events, model quality, accessibility and cost telemetry.

## 4. Public information architecture
- Home / ATLAS Awakening
- Discover ATLAS
- For whom
  - Adolescents
  - Adults
  - Seniors
  - Families and caregivers
- Paths
- Interactive exercises
- Professionals
- Organizations
- Trust, privacy and safety
- Immediate help
- Account / Passport

## 5. Runtime architecture
Each user interaction creates a governed state snapshot:

```json
{
  "audience": "adult|adolescent|senior|unknown",
  "interactionPreference": "voice|text|visual|mixed",
  "cognitiveLoad": "low|medium|high|unknown",
  "emotionalIntensity": "low|medium|high|unknown",
  "safetyState": "normal|sensitive|urgent",
  "confidence": 0.0,
  "visualIntensity": 0.0,
  "responseDepth": "brief|balanced|deep",
  "memoryMode": "none|session|consented",
  "recommendedCell": "cell-id"
}
```

The state is an estimate, not a diagnosis. The user can correct it at any time.

## 6. Delivery sequence
### Foundation
- Repository and environments
- Design tokens and accessibility primitives
- Routing and page shell
- Event bus and state machine
- Observability baseline

### Experience core
- Awakening
- Presence Engine v1
- Voice prototype
- Procedural environment
- Conversation shell

### Audience universes
- Seniors
- Adults
- Adolescents
- Caregivers and professionals

### Intelligence
- Orchestrator v1
- Cell selection
- Structured memory
- Spatial-memory prototype
- Safety policies and evaluation

### Commercial and operations
- Authentication
- Payments and subscriptions
- Professional dashboard
- Consent-based analytics
- Administration, audit and support

## 7. Release gates
A public release is blocked unless all gates pass:
- Functional tests
- Accessibility audit
- Performance budgets
- Security review
- Privacy review
- Safety evaluation
- Mobile and low-power modes
- Human escalation paths
- Backup, rollback and incident response

## 8. Current repository strategy
- `main`: public production only.
- `production/atlas-foundation-v1`: isolated production foundation and preview.
- Feature branches: one subsystem or cell family per branch.
- Pull request required before public promotion.
