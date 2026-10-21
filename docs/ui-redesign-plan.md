# Game UI redesign plan

Status: in progress. Menu navigation and preferences are implemented; the title layout and first encounter-layout pass are implemented. Scenic art and the full redesign remain pending.

## Progress — 2026-10-19

- Title: bounded scales logo, readable title, visible entry action, desktop and phone layout.
- Menus: title → menu → mode/name → random scenario → play; learning hub and settings are connected. References to missing scene images were removed until original art is ready.
- Encounter: situation, portrait, and responses now share one reading surface. Both responses have equal weight, directional SVG arrows, explicit drag direction, and keyboard focus. The calendar and commitment ledger use a quieter treatment without individual parchment boxes. Consequences use the same composition.
- Verified with Chrome DevTools: 1440×900 desktop and 390×844 phone, no horizontal overflow, equal option dimensions, four resources, resume, and choosing/advancing using Enter and Tab. Build and 17 engine tests pass. The Impeccable CLI detector could not run because its launcher lacks execution permission; visual and browser checks were performed manually.
- Still pending: original scenic art, restyling study/results/practice, dialog focus containment, and broader accessibility and edge-case checks from the completion list below. This pass does not complete the entire first milestone.

## Confirmed scope

- Plan the whole UI and implement the menus first.
- Keep the focused card decisions inspired by Reigns; explore a heavier atmosphere inspired by Darkest Dungeon, with an identity specific to this game.
- Preserve the title **El costo del equilibrio**, the motto **Cada decisión tiene un precio.**, Spanish interface, contemporary economic content, and educational purpose.
- Preserve the two modes, random scenario assignment, four indicators, twenty decisions, delayed commitments, study tools, and local saves. Balance changes are a separate project.

## Review basis

Reviewed the scope document, actual screen components, navigation, storage, portraits, resource indicators, and the complete stylesheet. The README describes some UI behavior that is no longer present in the components, so implementation decisions should use the source and current rules rather than assume every README claim is implemented.

The local preview started successfully. Native browser automation navigated to it, but its screenshots remained stale and the accessibility tree did not expose page content. This is a source-based evaluation, not a completed visual or mobile usability audit. Validate rendered composition before implementing the proposed design.

Reference for the next visual study: [Red Hook's official Darkest Dungeon screenshots](https://www.darkestdungeon.com/darkest-dungeon/media/?cat=screenshots). Use references to study hierarchy, composition, material, and atmosphere; develop original game art and UI assets.

## What is already useful

- A distinctive subject: decisions about running a country or a small business, with consequences that can arrive several turns later.
- A coherent starting vocabulary: the scales emblem, illustrated characters, parchment, bronze, dark wood, and separate council/shop scenes.
- Working game structure: explicit decision and consequence phases, resume, pause, practice, a study archive, and evidence-based results.
- A pure TypeScript engine separated from React. We can change presentation without rebuilding the simulation.

## Why it reads as a website

| Observation in the source | Effect on the experience | Proposed change |
| --- | --- | --- |
| `Intro.tsx` opens with a centered name form and promotional sentence. | The opening resembles registration before the player encounters the game. | Establish the title and world first; retain a short, clearly labeled name step before the first run. |
| Main menu combines a header, save banner, two descriptive mode cards, a three-step explainer, and utility buttons. | Starting, learning, resuming, and browsing compete on one page. | Give the main menu a clear action list; place mode selection and instruction content on their own screens. |
| The late `body` override in `styles.css` replaces the dark wood foundation with a light parchment/map canvas. | The whole application becomes a warm document surface, reducing separation between the world and its documents. | Use a dark scenic foundation, with light parchment reserved for readable content and briefings. |
| Most content is organized inside repeated bordered, rounded, shadowed panels. | The card illustration competes with the surrounding containers. | Use one dominant scene or object per screen; reserve frames for meaningful interactive or reading surfaces. |
| Gameplay separates situation, portrait, choices, calendar, and commitments into independent blocks. | The player reads a collection of widgets rather than one encounter. | Compose these around a single audience with a character, supported by a consistent resource HUD and obligation ledger. |
| Pause uses the general parchment dialog; sound is a floating pill and reduced motion has no connected player setting. | Supporting controls feel detached from the game shell. | Build a consistent pause/settings system and connect actual preferences. |
| End screens lead into dense report tables. | Victory, failure, and the next attempt lack a strong change of pace. | Give the outcome a concise dramatic beat before opening the detailed management record. |

## Proposed direction: the weight of a decision

The player should feel seated at a place where consequential choices are made. Macro takes place in a council chamber; micro at a merchant's working desk. The scales, ledgers, contracts, maps, and resource seals make the world specific to economic management.

Proposed visual language:

- Deep charcoal and dark wood surroundings; aged brass for navigation and structure; restrained oxblood for emphasis; warm paper for reading. Resource colors retain distinct meanings.
- Strong silhouettes, deliberate light around the active area, and original illustrated scenery. Illustration carries atmosphere; controls remain straightforward.
- Display typography for titles and short menu labels; comfortable body typography for situations, explanations, and study. Reassess the existing Cinzel/Alegreya pair in mockups before adding fonts.
- Sharper, simpler framing with occasional engraved or stamped details. A menu selection should read through a marker, contrast, and focus, without relying on glow or color alone.
- Brief, purposeful transitions: a document opens, a card is dealt, a decision lands, a commitment is recorded. Never delay access to the next action for animation.

These are recommendations to visualize next, not approved design tokens. Keep the game's approachable economic voice even when the atmosphere becomes more serious.

## Navigation proposal

Main path:

**Title → Main menu → New game / mode selection → Scenario briefing → Play**

Returning player:

**Title → Main menu → Continue → Exact saved phase**

Supporting paths:

- Main menu → How to play → repeatable practice → return.
- Main menu → Study archive → concept → practice → return.
- Main menu → Last management record, when a finished run exists.
- Main menu or pause → Settings → return to the originating screen.
- Play → Pause → Continue / Study / Settings / Main menu.
- Play → Outcome → Management record / New game / Main menu, retaining the relevant study action after defeat.

### Main menu composition

Desktop: an illustrated environment fills the available space. The title and a compact vertical menu occupy a deliberately quiet part of the composition; the world's focal object occupies the other side. No explanatory sections underneath the menu.

Suggested Spanish actions, grouped by purpose:

1. **Continuar** — first when an active run exists; show scenario and turn as supporting text. Omit when no save exists.
2. **Nueva partida** — primary when there is no active run.
3. **Aprender** — opens instructions, practice, and study destinations.
4. **Registro de gestión** — available when a finished run exists.
5. **Ajustes** — audio, motion, and player name.

Put the player name in a quiet location, with editing in settings. Use normal button semantics and keyboard focus. An exit action has no useful browser-game behavior, so omit it.

Mobile: preserve the scene's focal point through a dedicated crop or composition; use a compact title and vertical action list. Prioritize reachable controls and legibility over reproducing desktop ornament. Short screens, text enlargement, and landscape may scroll rather than clip controls.

### New game and scenario briefing

- Choose **Macroeconomía** or **Microeconomía**, with a short role description and four clearly named resources. Make the choice feel like choosing a responsibility.
- Keep economic names visible alongside any atmospheric role title. Decorative naming must not hide which mode is selected.
- Require or confirm the player's name through a compact labeled step before the first run; preserve the existing forty-character limit and trimming.
- Reveal the assigned scenario as a briefing: emblem, name, context, four starting values, objective, and one clear start action.
- Keep the fictitious-scenario explanation available and readable.
- Support Back without accidentally replacing the active save. Stage a new run in UI state and explicitly confirm replacement before committing it.
- Sample the scenario once for a given setup flow; never change randomness on hover, rerender, animation, or resize. Do not introduce a scenario picker or reroll mechanic as part of this redesign.

## Whole-game screen plan

| Surface | Intended experience | Important behavior |
| --- | --- | --- |
| Title / first entry | A recognizable game opening built around the scales and a clear entry action. | Keyboard and touch entry; sound remains off until enabled; no mandatory cinematic. |
| Main menu | A stable place to resume or begin. | First run, active save, finished run, and both save types together. |
| Mode / scenario | Role choice followed by a readable briefing. | Back, preserved active save, explicit replacement, random assignment, name validation. |
| Play | One character encounter at a time; resources remain easy to inspect. | Both choice buttons retain equal visual weight; drag stays optional; meaningful conditions and obligations remain discoverable before deciding. |
| Consequence | A clear response to the choice, followed by its economic explanation. | Show exact changes, due commitments, new commitments, and next action; do not encode events only through animation. |
| Pause / settings | A deliberate break with the encounter still recognizable behind it. | Escape behavior, focus containment/restoration, resume, study, sound, reduced motion, and safe menu return. |
| Study / practice | An in-world reference book that is comfortable to read. | Search, mode filtering, related concepts, empty results, repeat practice, exact return to the run. |
| Outcome | A clear emotional conclusion tied to the scenario and actual result. | State victory or failure, causal explanation, critical resource, decisions completed, and a useful next action. |
| Management record | A readable record of what the player did and learned. | Existing charts, equivalent data tables, decision details, pending obligations, and concept links remain available. |

### Gameplay layout principles for phase two

- Group the portrait, speaker identity, situation, visible condition, and two choices into a single encounter composition.
- Keep four resources, scenario, and turn easy to find throughout the encounter and its consequence.
- Retain the twenty-turn calendar and readable commitments. On mobile, a compact ledger summary can expand to details; the indicator and due-turn information must remain visible without hover.
- The closest due commitments should have clear prominence. Avoid presenting a net positive total as safe when individual resources have losses.
- Express Inicio / Desarrollo / Cierre through the existing six/seven/seven decision structure; any chapter presentation must follow that structure.
- Atmosphere reflects the current situation without adding new mechanics, timers, random events, or a new stress resource.

## Implementation sequence

### 1. Menu slice — first implementation milestone

First make desktop and mobile visual proposals for the main menu and mode/briefing flow. Resolve composition and scenery together; replacing only button styles will leave the structural problem intact.

Once the proposal is settled, implement the shared shell, title entry, main menu, mode selection, scenario briefing, and settings. Preserve all existing destinations through the new menu even before their interiors are restyled. Adapt pause to the shared menu treatment and settings access.

Primary files: `src/ui/App.tsx`, `src/ui/screens/Intro.tsx`, `src/styles.css`, `src/ui/components/MusicToggle.tsx`, `src/ui/components/CardDetail.tsx`, and a focused settings screen/component. Add original scene assets under `public/` if the selected composition needs them.

Keep the existing lightweight React screen model. Add explicit setup/settings screens and shared menu elements rather than introducing a routing or animation framework for this slice.

### 2. Encounter slice

Recompose play, the four-resource HUD, consequence feedback, calendar/commitments, and practice encounter. Keep gameplay and disclosure rules intact.

Primary files: `GameScreen.tsx`, `SwipeCard.tsx`, `Stats.tsx`, `Instructions.tsx`, shared styles. Keep generated character portraits initially if they work with the approved scenery; broader portrait art work can follow a stable UI.

### 3. Learning and outcome slice

Carry the visual system through instructions, study archive, fiches, quiz, outcome, and management record. Let reading surfaces use more space and scrolling than menus.

Primary files: `Study.tsx`, `Results.tsx`, `Instructions.tsx`, and `Chart.tsx`.

## Completion checks for the first slice

- The opening and menu are recognizable as this game at desktop and phone sizes, with a clear action hierarchy.
- Every current destination remains reachable; the three-step teaching content lives in the learning flow.
- Continue restores the same scenario, deck, resources, turn, and decision/consequence phase.
- Canceling setup or replacement preserves the active run. Navigation and settings never advance a turn.
- Music remains opt-in and works across screens. Motion preference is actually applied and persisted, while respecting the operating-system preference by default.
- Buttons work with keyboard and touch, visible focus survives the new styling, dialogs contain focus, Escape closes the appropriate layer, and focus returns to the trigger.
- Review desktop, phone, short viewport, long player name, text enlargement, reduced motion, and long scenario copy. Menus may grow rather than hide actions.
- Run typecheck/build and existing engine tests after implementation. Add focused behavioral tests only for new navigation/save/settings logic that needs protection.

## Next design deliverable

A desktop and mobile proposal showing **main menu → mode choice → briefing**, using original council/merchant imagery and the existing scales identity. Decide the composition, contrast, and character of the scenery from that concrete proposal before expanding the rest of the game.
