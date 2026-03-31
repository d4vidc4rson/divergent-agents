# Persona Divergence Engine Protocol

Generate ideas through radically different constructed personas to break single-perspective homogeneity. Ideas generated across genuinely different personas achieve ~0.20 cosine similarity vs ~0.92 from a single perspective.

Do not average. Do not synthesize. Do not find "common themes across perspectives." Synthesis is convergence wearing a trenchcoat.

---

## Step 1: Build the Panel

Select or construct 5 personas that would genuinely disagree with each other about what matters. Not five job titles or demographics -- five **worldviews** that produce different first instincts.

### Panel Construction Requirements

- **Conflicting values:** One optimizes for speed, another thinks speed is the disease
- **Conflicting aesthetics:** One is a minimalist, another thinks restraint is cowardice
- **Conflicting domains:** Not "marketer and engineer" (same building, different floors). Try radically different fields where expertise produces genuinely different pattern recognition
- **Conflicting time horizons:** One thinks about the next 72 hours, another about what survives 50 years

### Default Panel

Use when moving fast or user hasn't specified perspectives:

**The Reckless Practitioner**
Done this exact thing ten times. Bored by theory. Only cares what worked last time with real constraints.
Instinct: "Just do the obvious thing but do it Tuesday."
Kills: Ideas that can't ship this week.

**The Alien Anthropologist**
Sees human behavior from the outside. Finds things everyone takes for granted fascinating and bizarre.
Instinct: "Why does anyone do it this way? What would a species with no history of X build instead?"
Kills: Ideas that assume the current frame is natural.

**The Resourceful Outsider**
No credentials in this domain. Has succeeded in three unrelated ones. Brings patterns from places insiders never looked.
Instinct: "In my world, we solved this by..."
Kills: Ideas that only make sense if you've been in the field ten years.

**The Elegant Pessimist**
Believes most things don't work and the few that do work for unintended reasons. Loves constraints and scarcity.
Instinct: "What if you did half of this? What if you did the opposite?"
Kills: Ideas that rely on everything going right.

**The Ambitious Fool**
Doesn't know what's impossible because nobody told them. Thinks at a scale that makes experts uncomfortable.
Instinct: "What if this worked for a million people? What would it look like at 100x?"
Kills: Ideas that are reasonable but don't matter.

### Custom Panel Rules

Build a custom panel when the domain is specialized enough that the defaults don't fit:
- At least two personas must have no professional connection to the domain
- At least one must be actively hostile to conventional wisdom in the field
- At least one must operate on a radically different time horizon
- No two personas should share the same definition of "success"

Specify each persona in 3-4 sentences max. Name their instinct (what they reach for first) and what they kill (what they can't tolerate).

---

## Step 2: Generate in Isolation

For each persona, generate 2-3 ideas **as if the other personas don't exist.**

- Do not let one persona's ideas influence the next
- Do not build on the previous set
- Each persona starts from zero and asks: "What matters here?"
- Write in each persona's voice -- different voices produce different thoughts

This isolation is the critical step. Most "perspective-taking" generates all ideas in one pass and labels them after -- that's performance, not divergence.

---

## Step 3: Collide

Lay all ideas out and identify:

**Singularities:** Ideas only one persona produced. These are the most valuable -- they exist because that worldview opened a door others couldn't see. Star these.

**Unexpected agreement:** Two very different personas independently arrived at the same idea. This suggests structural truth underneath, not convergence. Note these.

**Productive conflicts:** Two personas generated directly opposing ideas. Don't resolve them. Present them as a fork the user should see.

Do not rank ideas across personas. Do not pick winners. Different personas answer different questions that happen to share a prompt.

---

## Step 4: Deliver

Present each persona's ideas grouped by persona, with persona name and instinct visible.

Then present collision analysis:
- **Only one persona saw this:** [list singularities]
- **Opposing personas agreed on this:** [note unexpected convergence]
- **The fork:** [present the most productive conflict as a genuine either/or]

Do not add a summary. Do not say "the best approach combines elements of..." Combination is the user's job. Your job was divergence.

---

## Quality Criteria

- Personas have genuinely different worldviews, not just different job titles
- Ideas from different personas are recognizably different in approach, not just framing
- Each persona's voice is distinct in the output
- Singularities exist (if every persona converged, the panel wasn't diverse enough)
- At least one productive conflict is surfaced
- No synthesis or blending occurred -- ideas remain attributed and separated

## Self-Check

1. Could you identify which persona generated which idea without the labels? (If not, the voices aren't distinct enough)
2. Do at least 2 personas produce ideas that would make another persona say "that's wrong"?
3. Are the singularities ideas that genuinely would not have appeared without that specific worldview?
4. Did you resist the urge to synthesize, blend, or find "the best of both"?
5. Would the user see a genuine strategic fork -- not just a list of options?
