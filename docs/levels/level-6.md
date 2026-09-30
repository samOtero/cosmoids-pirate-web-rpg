# Level 6 — Ironbell Officer Confrontation

> Approved direction recorded September 6, 2026. The heading is descriptive; the final level-select name is undecided. `STORY_AND_THEMES.md` remains the narrative source of truth. This is a design record, not an implemented encounter or finished dialogue script.

## Level Summary

- **Location:** A dry stone undercroft in Ironbell's Navy fortress, continuing directly from the commander's arrival at the end of Level 5. The first playable layout has an upper Poguin lane, a central Tigrevel extraction track, and a lower Poguin lane.
- **Primary objective:** Defeat the officer's boss Cosmoid and prevent Tigrevel from being dragged back into captivity.
- **Boss:** [Voltusk](../cosmoids/voltusk.md), a Steel/Electric walrus with approved name, visual design, and core lore.
- **Supporting enemies:** [Poguin](../cosmoids/poguin.md), the selected Electric/Water penguin minion concept. Its rockhopper movement now includes one authored, telegraphed switch between the upper and lower Poguin lanes before hauling.
- **Midbattle escalation:** At 30% boss health, combat pauses for a short five-panel intermission in which the officer forces his partner into a Cursed Aura phase. How he triggers the transformation is neither named nor shown.
- **Story resolution:** Tigrevel is freed; Mari and Tigrevel join the crew. Mari becomes the navigator, and the enlarged crew agrees that it needs a bigger boat.
- **Status:** Direction approved; Voltusk's concept, approved normal-form transparent assets, species registration, and directional visuals are complete. Poguin's concept, transparent production assets, species registration, and directional visuals are also complete. A first playable three-corridor battlefield slice, its illustrated opening dialogue, victory dialogue, and cursed intermission were added in September 2026. Voltusk remains on the north platform and launches dodgeable electric orbs at occupied combat placements. A hit paralyzes a tower for five seconds, slowing its attacks without damaging it. At 30% health, the battle pauses for the cursed intermission, the existing Cursed Aura treatment activates, and each later orb attack marks up to three distinct valid targets. Poguin attach steel-rope hauling chains to Tigrevel, with each connected helper increasing the group's pull speed, and perform telegraphed lane hops before reaching the objective. Mari remains present in the alcove, but the healing spots and tutorial have been removed from this level. Final encounter balance remains to be developed.

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

Tigrevel is a moving objective: reaching the recapture endpoint causes defeat. Defeating the boss breaks its control of the net, frees Tigrevel, and wins the encounter. The first playable battlefield keeps Tigrevel on an unobstructed central extraction track while Poguin haul from parallel upper and lower lanes. The first Poguin to reach Tigrevel anchors a steel rope and begins pulling at 12% of normal movement speed. Nearby Poguin can connect to Tigrevel or another attached Poguin; each helper adds 16 percentage points to the shared pull speed, capped at 92%. Progress along either Poguin lane is synchronized to Tigrevel's position on the center track, preserving one leftward recapture direction. Only Poguin with a continuous chain of nearby links to Tigrevel contribute to the pull. If a middle hauler falls or the gap between linked Poguin grows beyond the 12-unit joining distance, the downstream branch drops its ropes and stops contributing. Loose Poguin turn back toward Tigrevel and may reconnect to a nearby live link after a one-second delay. If the lead falls, only a helper close enough to anchor directly to Tigrevel takes over; otherwise Tigrevel slowly walks back toward its starting position on the center track at 1 unit per second until a Poguin reconnects. The netted Tigrevel sprite faces right throughout, including while Poguin pull it left. These values are initial tuning targets rather than final balance.

This progresses from Level 5's stationary gate objective. The player must balance damaging the boss against stopping the recapture effort, rather than simply repeat the previous level's gate destruction. The relationship between enemy pressure and Tigrevel's movement should be readable at a glance.

## Electric Minions — Mechanics Undecided

Electric typing and participation in the officer's recapture effort are confirmed. Poguin is the selected Electric/Water penguin species, with the existing concept-9 appearance preserved and rockhopper jumping added as a movement inspiration. Number of roles, wave composition, and detailed behaviors are not yet approved.

The battlefield direction now uses three dry, parallel gameplay tracks grouped tightly across one continuous stone floor: Poguin travel along the upper and lower tracks, and Tigrevel moves along the middle track. Two decorated fortress dividers frame only the outside edges of the entire lane band; nothing physically separates or singles out the middle track. A shared opening on the left spans all three tracks so every Poguin visibly enters from the same passage. The compact upper band places Mari's alcove at the far left and Voltusk's raised combat platform at the far right. The battlefield renders at an enlarged 2 scale with a one-half opening zoom so the Cosmoids remain proportionate to the fortress architecture without requiring as much vertical navigation. Poguin share two crossing points at roughly 35% and 65% of their route. At each point, a Poguin compares the live Poguin ahead on both side lanes and jumps toward the less occupied lane; equal counts alternate decisions. If it stays at the first point, it checks again at the second, and it can jump at most once. A jumping Poguin pauses in a targetable crouch, marks its destination, then arcs over Tigrevel's track to the opposite Poguin lane. While airborne it cannot be selected by a new attack, but attacks committed before takeoff continue to track and deal damage; a Poguin can therefore be defeated in midair. Once a Poguin reaches Tigrevel's progress point, it throws a steel rope and starts a hauling chain and no longer hops. Poguin close to Tigrevel or an already connected hauler join the chain and increase its shared speed, including helpers arriving from the opposite lane. Voltusk remains stationary on the upper-right platform with three dedicated combat placements. It periodically turns toward an occupied combat spot, marks it, and launches an electric orb at that fixed location before returning to its neutral downward facing for the rest of the cooldown. Moving a tower before impact dodges the attack. A tower occupying the marked location on impact is paralyzed for five seconds and attacks at 65% of its normal rate. Repeated hits refresh the duration without stacking the penalty. Jagged yellow bolts flash in irregular clusters around the affected tower, with brief yellow flashes on its sprite, until the effect ends. The former healing placements and tutorial are absent; Mari remains in the alcove as a story character.

The [Poguin concept record](../cosmoids/poguin.md) preserves the September 7, 2026 direction. A proposed hop-hop-stomp rhythm could provide a visible windup, electrical splash, and coordinated hauling beat; Voltusk's cursed-phase surges could accelerate that rhythm. These remain mechanics candidates, not approved timing, attack, or balance specifications.

The previous brainstorm explored the following possibilities, which remain candidates rather than requirements:

- Minions reach the net, attach hauling lines, and pull; additional attached minions increase the hauling speed.
- Defeating haulers lets Tigrevel recover some ground, bounded by its starting position.
- Shield-bearing escorts protect approaching haulers.
- In the cursed phase, the boss sends telegraphed electrical pulses through hauling lines to accelerate attached minions, making it valuable to clear them before a pulse.

Do not treat any of those interactions as settled mechanics. Further design should establish how the Electric minions contribute, how the player counters them, and how the cursed phase develops that same interaction. The boss's electrical escalation should have a clear gameplay role, with the exact ability dependent on those decisions.

## Cursed Intermission and Second Phase

Trigger a one-time intermission when Voltusk reaches 30% of its maximum health. Pause the battle completely while the story plays, including objective movement and ongoing combat effects, so the player cannot lose ground during dialogue.

The intermission contains five panels: two terse lines from Strake, a violet transformation flare, Voltusk's cry, and Kip recognizing that Strake is forcing the curse into Voltusk. The means by which Strake triggers it is deliberately left unidentified and unseen. Show Voltusk's pain and the emergence of the existing dark purple Cursed Aura. This is exploitation inflicted on a living creature, not a willing or celebratory power-up.

The transformation is a **Cursed Aura state**, distinct from a permanent Cursed evolution. The boss becomes more dangerous after the intermission, but retains its remaining health instead of receiving a fresh health bar. The player keeps the progress made in the first phase.

During the second phase, Voltusk's electric-orb attack marks up to three distinct occupied combat placements at once instead of one. If fewer than three valid targets are deployed, it marks each available target once. Orb cooldown, travel time, paralysis effect, and telegraph behavior otherwise remain unchanged. Voltusk retains its remaining health and the player keeps all progress made before the intermission.

## Aftermath and Escape

After the boss is defeated and Tigrevel freed, Strake reacts in stunned disbelief. Kip urges the group to leave before the commander recovers, and the children immediately run to Ironbell harbor.

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
- Tune the existing Cursed Aura treatment on Voltusk if visual inspection reveals scale or readability issues.
- Integrate Poguin's approved production assets when its gameplay role is finalized; decide whether additional Electric minion species or roles are needed.
- Tune the three-target cursed paralysis pressure alongside Poguin hauling.
- Explore whether bell- or gong-like calls contribute to the encounter; their use remains optional and outside the core species description.
- Tune the implemented cooperative hauling values, hop timing and presentation, lane-coverage decisions, and Tigrevel recovery rules on the three-corridor battlefield.
- Tune Voltusk's initial movement, Body Rush and Spark attacks, and stats for the boss encounter; specify wave composition and balance.
- Decide how Tigrevel's voluntary, uncaptured companionship appears in the roster and later battles.
- Revise the implemented introduction, intermission, and victory dialogue only if final staging or art requires it.
- Develop the larger-boat objective beyond this level's closing agreement.

## Related Records

- [Level 5 — Jail Break](level-5.md)
- [Story, themes, and dialogue guide](../../STORY_AND_THEMES.md)
