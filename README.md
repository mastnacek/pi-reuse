# pi-reuse

Pi skill package. Reuse-first design analysis for **IBM Notes/Domino**
(LotusScript, formula language, @commands, XPages, agents, views, forms, ACL,
doclinks).

When you ask "how do I get this done in the application", the answer is usually
*not* new code — the application already has a button, an action or an agent
that does it. This skill makes the model find that element first, and makes it
ask how often the task is repeated **before** it picks a mechanism.

---

## Why the frequency gate exists

The skill was extracted from a real review where the model proposed a new
button without asking how often the task happens. The operator's correction:

> just provide a link to the view where the button already is — the user clicks
> once on the link and a second time on the button and has the report … you
> should have asked me how often they will do this, whether two clicks will be a
> problem for them.

Two clicks are free for a monthly chore and unacceptable for a daily one. The
mechanism follows the frequency, not the phrasing of the request:

| Regime | Acceptable friction | Therefore |
|---|---|---|
| Occasional (≤ weekly), cold start from an email | 2–3 clicks are fine | doclink / URL to the existing view or frameset — zero new code |
| Weekly–daily, or many users | 1 click matters | thin wrapper over an existing agent — never a copy of its logic |
| In-flow inside the app | 0 extra clicks | extend the existing view/form action |

If the frequency is unknown, the skill makes the model ask — or state the
assumption in one line and choose conservatively.

## What the skill contains

- **Step 0 — usage profile** (mandatory gate, click-budget table above).
- **Step 1 — analyse the task:** document, action, actor, rights, document
  state, trigger point, and the keywords derived from them.
- **Step 2 — targeted search:** `agents.csv` (alias, trigger, `aktivovatelny`),
  `views.csv`, `view-columns.csv`, `acl.csv` from an ODP export first, then
  `grep` for the action; `<simpleaction action='runagent' …/>` is the cheapest
  find of all. Report 1–5 elements, never an inventory.
- **Step 3 — the reuse ladder (a–e)** with a click-count column; stop at the
  first rung that satisfies Step 0.
- **Step 4 — anti-patterns:** an emailed form whose button carries its own
  API/business logic (it cannot load your script libraries), copied logic,
  duplicate agents.
- **Step 5 — verification:** ACL/roles, hide-when and
  `showinbar='false'` reachability, client (Notes / web / Verse), and
  **deploy state** — a fixed `.lss` in `01_scripts/` proves nothing about the
  agent in the database.
- **Two calibration examples**, one of them the original wrong answer.

## Install

From GitHub, pinned to a tag:

```bash
pi install git:github.com/mastnacek/pi-reuse@v0.1.0
```

Unpinned (tracks the default branch):

```bash
pi install git:github.com/mastnacek/pi-reuse
```

`pi list` shows it; `pi remove git:github.com/mastnacek/pi-reuse` removes it. The
declaration lands in `~/.pi/agent/settings.json`; add `--local` to write it to
`.pi/settings.json` of a project instead.

The skill is model-invoked by its description, or forced:

```text
/skill:reuse how do I get the unconfirmed-BL report to the person who got the email?
```

If the same skill is also present as a loose directory in
`~/.pi/agent/skills/reuse/`, remove that copy — Pi keeps the first discovered
skill and warns on the collision.

## Layout

```text
pi-reuse/
├── package.json          # "pi": { "skills": ["./skills"] }
├── skills/
│   └── reuse/
│       └── SKILL.md      # the skill
├── scripts/
│   └── validate.mjs      # spec checks: name form/length, dir match, description routing
├── LICENSE
└── README.md
```

## Validate

Dependency-free, runs on a bare checkout:

```bash
npm test        # or: node scripts/validate.mjs
```

Checks every `SKILL.md` under `skills/`: `---` delimiters, `name` in
lowercase-hyphen form (≤ 64 chars, equal to its directory), `description`
≤ 1024 chars and containing a routing phrase, non-empty body.

## License

MIT © mastnacek
