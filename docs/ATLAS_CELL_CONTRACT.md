# ATLAS — Cell Runtime Contract

Every ATLAS page is assembled from governed cells. A cell is not a decorative block; it is an autonomous interaction module with explicit inputs, outputs, safety rules, accessibility behavior, and telemetry.

## Required metadata

```ts
export interface AtlasCellDefinition {
  id: string;
  version: string;
  title: string;
  audiences: Array<'adolescent' | 'adult' | 'senior' | 'caregiver' | 'professional'>;
  needs: string[];
  supportedModes: Array<'voice' | 'text' | 'visual'>;
  durationMinutes?: number[];
  safetyLevel: 'standard' | 'sensitive' | 'restricted';
  memoryPolicy: 'none' | 'session' | 'explicit-consent';
  accessibility: {
    keyboard: boolean;
    screenReader: boolean;
    reducedMotion: boolean;
    captions: boolean;
    largeText: boolean;
  };
}
```

## Runtime inputs
- Current audience and life-stage context
- User-declared goal
- Interaction preference
- Cognitive-load estimate and confidence
- Emotional intensity and confidence
- Safety state
- Accessibility settings
- Memory permissions
- Device capability tier

## Runtime outputs
- User-visible result
- Optional next step
- Optional handoff suggestion
- State changes with provenance
- Memory candidate requiring the appropriate permission
- Telemetry containing no sensitive conversation content

## Mandatory behavior
- The cell explains its purpose.
- The cell can be stopped immediately.
- The cell supports a reduced-motion path.
- The user can correct inferred context.
- Sensitive cells never trigger commercial conversion.
- A cell never diagnoses or claims certainty about emotion.
- Every result is editable and reversible.

## Lifecycle

```text
eligible -> proposed -> accepted -> active -> paused -> completed
                                  \-> stopped
                                  \-> escalated
```

## Senior adaptations
- Larger controls and explicit labels
- Voice-first option
- Slower pacing and repeat without penalty
- One primary action per view
- No infantilizing language
- Stable navigation and high contrast

## Adolescent adaptations
- Concise, direct language
- No simulated youth slang
- Discreet mode and rapid exit
- Stronger minor-safety rules
- Trusted-adult and professional handoff paths

## Adult adaptations
- Configurable depth
- Decision, relationship, work and load-management tools
- Structured summaries and action planning

## Quality gates for every cell
1. Unit and state-transition tests
2. Keyboard and screen-reader test
3. Reduced-motion verification
4. Safety scenario evaluation
5. Mobile and low-power verification
6. Telemetry and privacy review
7. Copy review for every supported audience
