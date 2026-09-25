# Combat Type and Family Identity

> Foundational direction recorded September 24, 2026. This document is the
> source of truth for how elemental type identity, move behavior, family
> identity, and future TM-style move teaching relate in tower-defense combat.
> It does not approve the current creature stats, learnsets, attacks, abilities,
> type-effectiveness values, or encounter balance. Those systems should be
> audited separately against this direction.

## Design goals

- Most level-appropriate party combinations should be capable of completing an
  ordinary level. Type advantages should reward preparation without making one
  specific family the required answer.
- A rare, clearly communicated encounter may emphasize typing strongly enough
  that immune attacks or a severely mismatched party are poor choices.
- Types should have recognizable mechanical identities without giving every
  creature of a type the same kit.
- Every Cosmoid family should have a distinct gameplay identity in addition to
  the identities of the move types it can use.
- Teaching an off-type move should grant that move's real utility. It should not
  turn the learner into a copy of a family that specializes in that type.

## Terminology

For this document, **move** means a selectable attack or active ability used by
a tower. A move may deal damage, provide support, control enemies, alter the
battlefield, or combine several closely related effects.

A **family trait** is an inherent behavior belonging to a Cosmoid family rather
than to a selected move. Traits may be passive, conditional, or triggered, but
they are not ordinary teachable moves.

A **signature move** is part of a family's identity and is not distributed as
an ordinary TM. Other families may share its type and broad focus without
receiving its unique mechanic.

## The four identity layers

### 1. Move type owns the type focus

The move's type determines the mechanical language it should draw from. The
relevant properties belong to the move definition and apply regardless of the
creature using it.

For example, if extended reach is part of a Flying move, a Fire Cosmoid taught
that move receives the extended reach. The reach does not come from the user
being a Flying creature.

Type focuses are tendencies rather than mandatory global modifiers. An
individual move may use only one of its type's focuses, and a strongly themed
exception is allowed. Peck, for example, may remain a short-range contact move
even though extended reach is a major Flying focus.

### 2. Creature type describes affinity

A creature's own type or types govern its defensive matchups, natural access to
moves, and any same-type offensive benefit. Exact numerical bonuses are balance
decisions and are not established by this document.

Creature typing must not silently add a type's move properties to unrelated
moves. A Flying creature's Normal contact attack does not automatically gain
Flying reach merely because of its user.

### 3. Family identity describes the tower

Family identity comes from a deliberate combination of:

- a signature mechanic or move;
- an inherent family trait when one is genuinely needed;
- characteristic stats and spatial tendencies;
- a shaped natural learnset;
- internal synergy or a meaningful limitation; and
- an evolution that deepens the existing hook rather than replacing it.

A family must remain recognizable when it equips a shared or off-type move. If
equipping one TM erases everything distinctive about the family, too much of
its identity was placed in its natural moves alone.

### 4. TMs broaden tools without transferring families

A future TM-style item may teach a compatible creature a move outside its own
type. That move retains its complete type expression: its reach, targeting
pattern, control, support, damage type, and other authored behavior do not
become generic when used off-type.

TM access remains bounded by compatibility and limited move slots. Signature
moves and family traits are not ordinary TM rewards. A creature can therefore
borrow another type's tool without acquiring another family's complete
identity.

## Type focus matrix

The game uses the full set of eighteen familiar elemental types as its planning
baseline, including types that do not yet have implemented Cosmoids or moves.
Each type is limited to one or two high-level focuses. These focuses describe a
design space, not a requirement that every move contain every listed behavior.

| Type | Focuses | Interpretation for moves |
| --- | --- | --- |
| Normal | Reliability; adaptability | Consistent performance and moves that adjust targeting, cadence, or role without dominating a specialty. |
| Fire | Escalation | Build offensive pressure through continued aggression, repeated hits, spreading flames, heat, or ignition. |
| Water | Repositioning; lane shaping | Push, pull, carry, redirect, or create currents and persistent effects that influence travel through a lane. |
| Electric | Speed; chaining | Act rapidly, jump between targets, or propagate marks and effects through nearby enemies. |
| Grass | Utility; restoration | Supply varied non-damage tools and restore health, structures, resources, or other damaged battlefield state. |
| Ice | Slowing and freezing; shatter payoff | Progressively restrict movement or action, then reward breaking or striking a frozen target. |
| Fighting | Dueling; interruption | Concentrate force on an important target and interrupt charges, casts, or other dangerous actions. |
| Poison | Attrition; weakening | Accumulate damage over time or reduce an enemy's ability to withstand the rest of the party. |
| Ground | Zone control; defense breaking | Alter occupied areas of the battlefield and expose heavily defended enemies. |
| Flying | Extended reach; cross-lane coverage | Influence distant or separated parts of the map through superior range, angles, or coverage. |
| Psychic | Disabling; timing manipulation | Change enemy behavior or alter when enemies and combat effects can act. |
| Bug | Multi-hit pressure; compounding setup | Gain value through numbers, repeated applications, swarms, or effects that build on one another. |
| Rock | Area impact; siege | Deliver broad physical impact and excel at breaking structures, fortifications, or stationary objectives. |
| Ghost | Phasing; curses | Bypass ordinary targeting, collision, or protection rules and create delayed or conditional consequences. |
| Dragon | Exceptional power; high commitment | Produce unusually strong results in exchange for windup, cooldown, positioning, or another substantial commitment. |
| Dark | Opportunism; disruption | Exploit weakened or compromised targets and interfere with enemy priorities, plans, or special mechanics. |
| Steel | Durability; protection | Withstand pressure and prevent or absorb harm aimed at allied towers or objectives. |
| Fairy | Empowerment; cleansing | Improve allies and remove curses, debuffs, or other harmful states. |

## Important distinctions between neighboring types

Types may address the same broad combat problem, but they should approach it in
different ways.

### Control

- Water moves enemies.
- Ice slows or freezes enemies.
- Ground changes the areas enemies occupy.
- Psychic changes enemy behavior or timing.
- Fighting interrupts a dangerous action.

Grass moves may restrain enemies when a specific plant or family concept calls
for it, but restraint is not Grass's defining type-wide focus.

### Support

- Grass provides utility and restores what has been lost or damaged.
- Steel prevents or absorbs harm.
- Fairy strengthens allies and removes harmful states.
- Normal adapts reliably to a party's immediate needs.

### Damage over time and delayed effects

- Poison steadily degrades an enemy and makes it easier to defeat.
- Fire escalates active offensive pressure while aggression is maintained or
  its flames are allowed to spread.
- Ghost creates a delayed or conditional consequence that may bypass an
  ordinary protection rule.

## Family identity template

Use this template before designing or revising a family's stats and moves:

- **Family promise:** The short fantasy the player should feel while using it.
- **Primary job:** The situation in which the family is naturally comfortable.
- **Signature mechanic:** The rule that distinguishes it from every other
  family.
- **Supporting tendency:** Its characteristic range, cadence, durability,
  targeting, placement, or other secondary behavior.
- **Meaningful cost:** The limitation that prevents it from being an automatic
  choice.
- **Natural type expression:** How its natural moves interpret its type focuses.
- **Off-type continuity:** What still makes the family recognizable while it is
  using a shared or TM-taught move.
- **Evolution development:** How evolution strengthens or expands the same
  identity instead of replacing it with an unrelated role.

Not every family needs an inherent trait. Prefer a signature move, stats, and a
coherent learnset when those are sufficient. Add a family trait when the tower
would otherwise lose its identity as soon as it selects a shared or off-type
move.

## Move and ability checklist

Before approving a new move or active ability, answer the following:

1. Which one of the move type's focuses does it express?
2. Does its range, cadence, targeting shape, and effect support that focus?
3. If it appears to contradict its type focus, is the thematic exception clear
   and worthwhile?
4. Does the mechanic belong to the move itself rather than being inferred from
   the user's creature type?
5. Is it a shared move, a compatible TM candidate, or a protected signature
   move?
6. If teachable, does it grant useful customization without reproducing a
   family's entire signature mechanic?
7. Does it create a decision against the creature's other move choices rather
   than becoming an automatic selection?

## TM design rules

- An off-type user receives the move's full authored behavior.
- Do not remove a Flying move's range, a Water move's repositioning, or a Grass
  move's restoration merely because the user has another type.
- Use compatibility and limited move slots as the main boundaries on access.
- Keep signature moves out of ordinary TM distribution.
- Natural specialists should retain advantages through affinity, stats,
  learnset breadth, traits, or signature synergy rather than by giving off-type
  users a deliberately incomplete version of the move.
- Non-damaging same-type bonuses remain an open balance question. Do not assume
  that healing, control duration, or buff strength receives a same-type bonus
  until that rule is designed explicitly.

## Encounter implications

Ordinary levels should present problems with several valid answers. Type
advantage may be one answer, but control, reach, targeting, support, raw damage,
or placement should usually provide alternatives.

Complete immunity is a hard exclusion rather than a normal balance lever. Use
it sparingly, communicate it before or early in the encounter, and avoid making
an immune target the dominant requirement of an ordinary level unless the
level is deliberately teaching or testing that matchup.

## Planned follow-up audits

This foundation should be followed in order by:

1. A family-identity audit using the template above.
2. A move and ability audit that classifies current content as aligned,
   reusable, in need of revision, or placeholder.
3. A learnset and future TM-compatibility audit.
4. A creature stat audit after each family's intended job and limitation are
   known.
5. An encounter audit confirming that ordinary levels allow several different
   party solutions.

Do not treat current data as a constraint during the first two audits. Preserve
good implemented ideas where they support the approved direction, but evaluate
placeholder attacks and stats on their intended future role rather than on the
cost already spent implementing them.
