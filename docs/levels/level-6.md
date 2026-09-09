# Level 6 — Ironbell Officer Confrontation

> Approved direction recorded September 6, 2026. The heading is descriptive; the final level-select name is undecided. `STORY_AND_THEMES.md` remains the narrative source of truth. This is a design record, not an implemented encounter or finished dialogue script.

## Level Summary

- **Location:** A dry stone undercroft in Ironbell's Navy fortress, continuing directly from the commander's arrival at the end of Level 5. The first playable layout has an upper Poguin lane, a central Tigrevel extraction track, and a lower Poguin lane.
- **Primary objective:** Defeat the officer's boss Cosmoid and prevent Tigrevel from being dragged back into captivity.
- **Boss:** [Voltusk](../cosmoids/voltusk.md), a Steel/Electric walrus with approved name, visual design, and core lore.
- **Supporting enemies:** [Poguin](../cosmoids/poguin.md), the selected Electric/Water penguin minion concept. Its rockhopper jumping is part of the intended direction; specific mechanics remain under discussion.
- **Midbattle escalation:** At approximately half boss health, combat pauses while the officer forces a Cursed Relic onto his partner, triggering a stronger Cursed Aura phase.
- **Story resolution:** Tigrevel is freed; Mari and Tigrevel join the crew. Mari becomes the navigator, and the enlarged crew agrees that it needs a bigger boat.
- **Status:** Direction approved; Voltusk's concept, approved normal-form transparent assets, species registration, and directional visuals are complete. Poguin's concept, transparent production assets, species registration, and directional visuals are also complete. A first playable three-corridor battlefield slice, its illustrated opening dialogue, and its victory dialogue were added September 8, 2026. Voltusk now remains on the north platform and bombards occupied combat placements with dodgeable electric orbs. Poguin now attach steel-rope hauling chains to Tigrevel, with each connected helper increasing the group's pull speed. Poguin lane hopping, Mari's healing role, the cursed phase, story intermissions, final encounter mechanics, and balance remain to be developed.

## Continuity and Officer Direction

Level 5 ends with Tigrevel voluntarily standing between the children and the approaching Navy commander. Level 6 resolves that confrontation. The officer refuses to accept the creature's freedom or the children's defiance.

The officer combines Morgan's obsession with obedience and status with Lt. Surge's intimidating military confidence as broad creative touchstones. His identity, appearance, dialogue, and encounter must remain original to Cosmoids. He regards compassion as weakness and expects force to restore his authority. Steel expresses his rigid control; electricity gives that control a forceful, active presence in battle.

Keep the story straightforward: attempted recapture, resistance, the officer's cruel escalation, then liberation and departure. The officer represents an abusive individual within the Navy; this encounter should not imply that all Navy members behave this way.

## Selected Walrus Boss Direction

The boss is Voltusk, a proud Steel/Electric walrus with a tall, commanding posture. Its selected appearance has golden-yellow skin, two black chest chevrons, black bands around the front flippers, a cream muzzle, enormous silver steel tusks, metallic whiskers, and swept silver plates along its back. See [Voltusk's concept record](../cosmoids/voltusk.md) for the approved image, description, inspiration, and visual identity checklist.

Its steel tusks store electricity: larger tusks hold more charge and can unleash more powerful discharges, making tusk size a source of status and confidence when confronting rivals. Sensitive metallic whiskers detect approaching storms and guide it to the precise place where lightning is about to strike. It plants its flippers and raises its head to receive the strike through its steel growths, channeling the energy into its tusks. These are fictional Cosmoid abilities inspired by walrus tusk displays and sensitive whiskers.

**Approved description direction:**

> Its metallic whiskers tremble when a storm approaches, guiding it to the place where lightning will strike. The larger its steel tusks, the more electricity it can store—and the more confidently it challenges rivals.

Bell- or gong-like calls remain an optional source of Level 6 mechanics, rather than a central part of the species description. Their exact use is undecided; do not assume they summon, command, or strengthen minions. The description should stay focused on storm sensing and electrical storage in the tusks.

## Steel Net and Battle Objective

The officer throws a steel net over Tigrevel as Navy equipment; the net is not produced by the boss or part of its anatomy. The officer sends his boss and supporting Cosmoids to drag Tigrevel back toward the prison. Tigrevel struggles against the restraint and remains visibly present as the creature the player is protecting. The playable placeholder uses a dedicated transparent netted-Tigrevel capture-unit graphic in every objective state, including while an enemy carries it.

Tigrevel is a moving objective: reaching the recapture endpoint causes defeat. Defeating the boss breaks its control of the net, frees Tigrevel, and wins the encounter. The first playable battlefield keeps Tigrevel on an unobstructed central extraction track while Poguin haul from parallel upper and lower lanes. The first Poguin to reach Tigrevel anchors a steel rope and begins pulling at 12% of normal movement speed. Nearby Poguin can connect to Tigrevel or another attached Poguin; each helper adds 16 percentage points to the shared pull speed, capped at 92%. Progress along either Poguin lane is synchronized to Tigrevel's position on the center track, preserving one leftward recapture direction. If the lead hauler is defeated, a connected helper takes over the lead instead of dropping Tigrevel immediately. These values are initial tuning targets rather than final balance.

This progresses from Level 5's stationary gate objective. The player must balance damaging the boss against stopping the recapture effort, rather than simply repeat the previous level's gate destruction. The relationship between enemy pressure and Tigrevel's movement should be readable at a glance.

## Electric Minions — Mechanics Undecided

Electric typing and participation in the officer's recapture effort are confirmed. Poguin is the selected Electric/Water penguin species, with the existing concept-9 appearance preserved and rockhopper jumping added as a movement inspiration. Number of roles, wave composition, and detailed behaviors are not yet approved.

The battlefield direction now uses three dry, parallel corridors: Poguin travel along the upper and lower lanes, and Tigrevel moves along the wider middle track. The battlefield renders at an enlarged 3 scale with a 0.3 opening zoom so the Cosmoids remain proportionate to the fortress architecture. Poguin will eventually be able to hop between marked points on their two lanes, but the first playable slice deliberately keeps them on their authored lane. Once a Poguin reaches Tigrevel's progress point, it throws a steel rope and starts a hauling chain. Poguin close to Tigrevel or an already connected hauler join the chain and increase its shared speed, including helpers arriving from the opposite lane. Voltusk remains stationary on a raised platform above the upper lane with three dedicated combat placements. He periodically turns toward an occupied combat spot, marks it, and launches an electric orb at that fixed location before returning to his neutral downward facing for the rest of the cooldown. The tower avoids damage if the player moves it before impact, while any tower occupying the marked location when the orb lands takes damage. Mari occupies a sheltered recovery position below the lower lane with three safe healing placements that Voltusk will not select. Future work will add Mari's actual healing behavior and Poguin lane switching.

The [Poguin concept record](../cosmoids/poguin.md) preserves the September 7, 2026 direction. A proposed hop-hop-stomp rhythm could provide a visible windup, electrical splash, and coordinated hauling beat; Voltusk's cursed-phase surges could accelerate that rhythm. These remain mechanics candidates, not approved timing, attack, or balance specifications.

The previous brainstorm explored the following possibilities, which remain candidates rather than requirements:

- Minions reach the net, attach hauling lines, and pull; additional attached minions increase the hauling speed.
- Defeating haulers lets Tigrevel recover some ground, bounded by its starting position.
- Shield-bearing escorts protect approaching haulers.
- In the cursed phase, the boss sends telegraphed electrical pulses through hauling lines to accelerate attached minions, making it valuable to clear them before a pulse.

Do not treat any of those interactions as settled mechanics. Further design should establish how the Electric minions contribute, how the player counters them, and how the cursed phase develops that same interaction. The boss's electrical escalation should have a clear gameplay role, with the exact ability dependent on those decisions.

## Cursed Intermission and Second Phase

Trigger a one-time intermission when the main enemy Cosmoid reaches approximately 50% of its maximum health. Pause the battle completely while the story plays, including objective movement and ongoing combat effects, so the player cannot lose ground during dialogue.

The officer blames his partner for failing to overpower the children and fastens a Cursed Relic onto it to force greater strength. Show its pain and the emergence of a dark purple Cursed Aura. This is exploitation inflicted on a living creature, not a willing or celebratory power-up.

The transformation is a **Cursed Aura state**, distinct from a permanent Cursed evolution. The boss becomes more dangerous after the intermission, but retains its remaining health instead of receiving a fresh health bar. The player keeps the progress made in the first phase.

The second phase should intensify the established capture-and-control threat through the boss's electrical abilities. The officer forces the walrus to release more power than it can safely control, turning its normally measured discharges into painful, uncontrolled surges. Exact attacks, numerical boosts, minion interactions, telegraphs, and counters remain open for encounter design.

## Aftermath and Curse Story Seed

After the boss is defeated and Tigrevel freed, Caleb removes the forced relic from the officer's Cosmoid. Its aura begins to subside, but it remains exhausted and needs care. Relic removal here is relief from this forced exposure, not proof of a universal or complete cure for the Stone Curse.

Caleb's emerging realization is that a cursed Cosmoid can need rescuing too. This plants a compassionate motive for later curse-related objectives while preserving his early dream of becoming the greatest Cosmoid Captain. Do not turn the ending into a full cure-quest declaration or reveal Patient Zero, the Isle of Whispers, or the complete curse mechanism.

## Crew Recruitment and Next Objective

Mari and Tigrevel both join the sailing crew after the confrontation. This supersedes the earlier plan for Mari to stay at Ironbell.

- **Mari becomes the navigator.** Demonstrate her knowledge through a practical observation, such as correcting a dangerous proposed route, before explaining her role. The exact demonstration and dialogue remain to be written.
- **Kip remains the artist and Cosmoid chronicler.** Navigation is Mari's responsibility.
- **Tigrevel joins voluntarily and continues to refuse capture.** Preserve its agency and leave its missing trainer's history unresolved.
- **The crew needs a bigger boat.** Their cramped departure provides a lighthearted closing beat: Tigrevel settling aboard makes the lack of space unmistakable, and everyone agrees they need a larger vessel. Finding one is the immediate next objective; the destination and acquisition story remain open.

## Dialogue Scope

The introduction, cursed intermission, and victory/departure are separate story parts. Each ordinary sequence must contain five to ten player-advanced panels, with five as the concise target. Count narration and action panels as well as spoken lines.

The current playable placeholder includes a ten-panel introduction in which the commander nets Tigrevel before it can attack, Voltusk answers his order with a low bell-like call, and Caleb, Kip, Mopup, and Mari step forward to defend Tigrevel. The net throw and ensuing standoff have dedicated illustrated backgrounds, and Voltusk has a normal-form warning portrait.

The nine-panel victory dialogue shows the stunned commander's defeat, the children's escape to Ironbell harbor, and Caleb offering Tigrevel a capture doubloon. Tigrevel ignores the doubloon and boards voluntarily. Caleb then invites Mari, who accepts after recognizing that Tigrevel is no longer her only friend. Her first practical observation as navigator is that the heavily loaded boat is riding dangerously low, establishing the need for a larger vessel.

Two dedicated victory backgrounds support the departure. `bg_level_6_tigrevel_claims_boat.png` shows Tigrevel occupying the tiny boat while Caleb still holds the unused doubloon and Mari remains on the dock; it serves panels three through seven. `bg_level_6_cramped_crew_departure.png` shows Caleb, Kip, Mari, Mopup, and Tigrevel squeezed aboard together as Ironbell recedes; it serves Mari's acceptance and final navigator observation in panels eight and nine.

## Remaining Design Work

- Choose the final level title and officer name.
- Develop Voltusk's cursed-phase visual treatment while preserving its approved normal-form identity.
- Integrate Poguin's approved production assets when its gameplay role is finalized; decide whether additional Electric minion species or roles are needed.
- Decide minion mechanics and the cursed phase's electrical interaction.
- Explore whether bell- or gong-like calls contribute to the encounter; their use remains optional and outside the core species description.
- Tune the implemented cooperative hauling values and presentation; develop lane-switch decisions, marked hop points, and Tigrevel recovery rules on the three-corridor battlefield.
- Tune Voltusk's initial movement, Body Rush and Spark attacks, and stats for the boss encounter; specify wave composition and balance.
- Define precise threshold handling and pause/resume behavior for the one-time intermission.
- Decide how Tigrevel's voluntary, uncaptured companionship appears in the roster and later battles.
- Write the cursed intermission; revise the implemented introduction and victory dialogue as the final staging and art become available.
- Develop the larger-boat objective beyond this level's closing agreement.

## Related Records

- [Level 5 — Jail Break](level-5.md)
- [Story, themes, and dialogue guide](../../STORY_AND_THEMES.md)
