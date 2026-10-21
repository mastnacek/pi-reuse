# Calibration examples

Two cases that shaped this skill. Read them when you are unsure whether a
mechanism is "simple enough" or whether an existing element counts as reusable.

## 1. The report that the email button was rebuilding

**Requirement.** A mailed form (`Memo_BL`) carries a button that produces an
overview of assigned but unconfirmed safety sheets for the recipient.

**What the code showed.** The button held ~500 lines: its own HTTP client, its
own token lookup, its own LZ traversal, its own HTML renderer and an `mshta`
launcher. The report already existed as a view action
(`Bezpečnostní listy\01 Správce BP` → `BL podrizeni neprijate HTML`) calling an
existing agent (`BL_nepotvrzene_podrizeni_html`, alias
`ag_bl_nepotvrzene_podr_html`, `aktivovatelny = true`).

**Wrong answer — given once, do not repeat.** "Replace the button with the
existing thin wrapper `button_Memo_BL_prehled.lss` (open the BL database,
`GetAgent`, `ag.Run()`)." It is a real improvement, but it was chosen before
asking how often a master opens that report.

**Correct answer at that frequency.** Rung (a): put a **doclink to the view** in
the mail. One click on the link, one on the action, report shown. Zero new code,
and the ~500 duplicated lines disappear from the form.

**When (c) would be right instead.** If masters open it daily, or there are many
of them, the second click becomes a real cost — then a thin wrapper button is
justified. Only then.

**Lesson.** The mechanism follows the frequency, not the phrasing of the
request. "Add a button" is a proposed implementation, not a requirement.

## 2. The fix that must not be copied

**Requirement.** HTTP calls from LotusScript fail on Windows terminal servers
(`0x80070057`), and Czech diacritics come back mangled.

**What the code showed.** The fix (WinHttp first, `Open` before options,
`ADODB.Stream` decoding for UTF-8) lived inside per-element procedures
(`VolejApi`, `Utf8Text`). The shared script library was not used, because the
buttons could not load it — see the mail-database constraint.

**Correct move.** Centralise the transport in the database's script library, and
keep elements that cannot load it as thin wrappers over an agent that can. Before
routing anyone to that agent, grep the **deployed** `.dxl` for the fix: a fixed
`.lss` in `01_scripts/` proved nothing about the agent in the database, and the
deployed copy still used the broken call.

**Lesson.** "It is fixed" is a claim about a specific element in a specific
database. Reuse is only reuse when the thing you are reusing actually contains
the fix.

## What the two cases have in common

| Symptom | Underlying question | Where it is answered |
|---|---|---|
| A button that "just needs to be added" | How often, by how many people? | Step 0 |
| A button that re-implements a report | Does the report already exist? | `agents.csv` + grep for `runagent` |
| A fix applied in several places | Which elements can share the library? | mail-database constraint |
| A source file that looks fixed | Is the deployed element the same? | `agents.csv` + grep the deployed `.dxl` |
