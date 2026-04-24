# Requirements Verification Questions
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

Please answer each question by filling in the letter choice after the `[Answer]:` tag.
If none of the options match your needs, choose the last option (Other) and describe your preference.
Let me know when you're done.

---

## Question 1
The data model defines three bug statuses: `Open`, `In Progress`, and `Works on My Machine`. Should there be any additional statuses, or is this set final?

A) Final — use exactly those three statuses
B) Add `Closed` / `Resolved` as a fourth status
C) Add `Closed` / `Resolved` AND `Won't Fix` as additional statuses
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
The data model defines four severity levels: `P0`, `P1`, `P2`, `P3`. Should there be any human-readable labels displayed alongside these codes in the UI (e.g., "P0 — Critical")?

A) Yes — display both code and label (e.g., "P0 — Critical", "P1 — High", "P2 — Medium", "P3 — Low")
B) No — display the code only (P0, P1, P2, P3)
C) Display label only (Critical, High, Medium, Low) — no code shown
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 3
The Kanban board is the primary view. Should there be any secondary views (e.g., a flat list/table view of all bugs)?

A) Kanban board only — no secondary view needed
B) Kanban board as primary + a flat list/table view as secondary
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 4
Should users be able to filter or search bugs (e.g., by severity, status, or keyword)?

A) No filtering or search needed for this intent
B) Filter by severity only
C) Filter by severity and status
D) Full search/filter by severity, status, and keyword
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
The `BugFormModal` is used for creating bugs. Should the same modal also handle editing an existing bug, or should editing be a separate interaction?

A) Same modal for both create and edit
B) Separate modal/form for editing
C) Inline editing directly on the Kanban card
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
Should deleting a bug require a confirmation step (e.g., a confirmation dialog before the delete is executed)?

A) Yes — always show a confirmation dialog before deleting
B) No — delete immediately on click (no confirmation)
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7
The architecture doc specifies `stepsToReproduce` as a required field. Should this be a plain text area, or should it support structured input (e.g., numbered steps)?

A) Plain text area — unstructured free text
B) Structured numbered steps (dynamic add/remove step rows)
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 8
Is there any user authentication or authorization requirement for this intent (e.g., login, roles, permissions)?

A) No authentication — the app is open/anonymous for this intent
B) Basic authentication (username/password) required
C) Role-based access (e.g., reporter vs. admin) required
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9
Should the Kanban board support drag-and-drop to move bugs between status columns?

A) Yes — drag-and-drop to change bug status
B) No — status changes via the edit form/modal only
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 10
Are there any pagination or performance requirements for the bug list? (e.g., expected number of bugs)

A) No pagination needed — assume a small dataset (< 100 bugs)
B) Implement basic pagination or infinite scroll for larger datasets
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 11 — Extension: Security Baseline
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 12 — Extension: Property-Based Testing
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips
C) No — skip all PBT rules (suitable for simple CRUD applications or thin integration layers)
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---
