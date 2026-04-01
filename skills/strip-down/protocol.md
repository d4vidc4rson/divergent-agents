# Extract Desire — Methodology

Translate any problem description from professional language into a raw desire statement -- what the person behind the document actually wants, said in the bluntest possible human language. Rich prompts anchor AI output. Desire statements liberate it.

---

## Step 1: Find the Want

Read the entire document and ask: **"What does this person actually want to happen in the world?"**

Not what they say they want. Not their stated objectives. Not their success metrics. What they want.

### How to find it:

- Identify the professional language doing the hiding (deck language, grant language, spec language, proposal language, pedagogical language, etc.)
- The want hides underneath the first sentence you'd delete if explaining this to someone outside the field.
- Name the want in plain language. Use words a person would think, not words they'd put in a document.

### Test:

If the want sounds like it could appear in the original document, you haven't found it yet. Dig under it.

---

## Step 2: Find the Who

Every problem has a "who." Translate from jargon into a human being (or system) you can picture.

### When the who is a person or group:

Translate from demographic or professional jargon into a specific human description. The description should make you feel like you've met this person. If it doesn't, it's still jargon.

### When the who is a system, phenomenon, or entity:

Describe it the way someone who works with it every day talks about it in private. Not the document version (abstract nouns). The private version (personality, frustration, specificity).

---

## Step 3: Load the Specific Details

A desire statement is not a generic want. It's a want with enough specificity that ideas produced from it couldn't be for any other problem.

Pull in details that make THIS problem different from the generic version:

- The specific behaviors, contradictions, or self-perceptions of the audience
- The specific constraints, anomalies, or failure modes of the system
- The specific political, temporal, or competitive pressures
- The details a generic prompt would never include because they only matter here

These details are the difference between a desire statement that produces generic ideas and one that produces ideas only this problem could use.

---

## Step 4: Say It in One Breath

Combine the want, the who, and the specific details into 1-3 sentences.

### Tone:

Match the emotional register to the domain -- slightly crude or funny for business, bluntly curious for science, exasperated and practical for engineering, angry and specific for policy. The common thread is honesty.

### Test:

Does it sound like what the person behind this document would say to someone they trust but would never put in writing? Then you have it.

Does it sound like something that could appear in the original document? Then you're still in the same language. Push further.

---

## Step 5: Determine What to Strip

Once you have the desire statement, everything else falls into two piles:

**Keep** -- anything already IN the desire statement (it earned its place)

**Strip** -- everything else. Specifically, strip anything that anchors AI toward the document's own conclusions instead of generating new ones:

- Budgets, timelines, tactics, deliverable lists
- Literature reviews, methodology details, theoretical frameworks
- Existing architecture descriptions, tech stack decisions, vendor evaluations
- Stakeholder maps, implementation timelines, legislative history
- Any sentence starting with "We believe," "Our approach," "Previous work has shown," "Best practices indicate," "The current approach," etc.

The stripped material comes back later during reality-checking. It stays out during generation.

---

## Step 6: Confirm with the User

Present the desire statement as a blockquote, then pause for genuine confirmation.

### Confirmation structure:

1. Present the desire statement in a blockquote
2. Ask in bold (after a horizontal rule): "Does that feel true? Not just reasonable, but actually what this needs?"
3. State 1-2 specific concerns about the framing -- things the document assumes that might be wrong, or angles the desire statement might be missing
4. Ask a second question in bold blockquote: "Does the desire statement hold, or does one of those worries land?"

### Critical rules:

- Always have 1-2 concerns ready, even if the desire statement feels solid.
- Do not accept a quick "yes" at face value. If the user agrees without engaging deeply, push once more with the concerns.
- If they correct you, rebuild from scratch -- don't patch. Their correction IS the desire statement or close to it.
- If they push back on the framing entirely ("we're asking the wrong question"), route to Wrong Problem Detector.
- Once genuinely confirmed, generate immediately. Do not offer a menu of skills.

---

## Quality Criteria

1. The desire statement uses no professional jargon from the original document.
2. It sounds like a person talking, not a document.
3. It contains specific details that make it about THIS problem, not the generic version.
4. It is 1-3 sentences (sayable in one breath).
5. The confirmation step surfaces genuine concerns, not rubber-stamp questions.
6. The user was given a real opportunity to correct the framing before generation begins.

---

## Self-Check

1. Read the desire statement. Could it appear in the original document? If yes, you haven't translated far enough.
2. Read it again. Could it apply to ten different problems in the same domain? If yes, it lacks specificity -- load more details from Step 3.
3. Are your concerns in the confirmation step real? Would you actually worry about them? If not, find better concerns.
4. Is the desire statement a want (emotional, human) or a tension (analytical, framework-y)? It must be a want. Tensions are analytical. Desires are generative.
