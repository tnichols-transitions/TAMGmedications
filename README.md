# TAMG Medication Reference

Clinical reference for residential SUD treatment, deployed on Netlify at https://tamgmedications.netlify.app/.

## Files

- `index.html` — Medication Reference and Treatment Pathways (single-file site).
- `workflow.js` — Clinical Workflow tab (drop-in module). Loaded by `index.html` with:

  ```html
  <script src="workflow.js"></script>
  ```

  placed just before `</body>`, after the page's own inline script.

## Clinical Workflow

Four steps: Intake → Safety & history (safety screen + clinical factors) → Withdrawal scores (CIWA-Ar, COWS) → **Treatment plan**.

The treatment plan lists each medication once, grouped as **Recommended**, **Conditional — prescriber decision**, **Also consider** or **Avoid**, with what it is for and an expandable "Why" showing every rule that mentions it. If any rule says to avoid a medication, it is listed under Avoid. Non-medication actions (escalation, monitoring) are listed separately. The plan can be copied as text or printed.

- Rule-based decision support only; no doses are given.
- Nothing entered is stored or transmitted; state lives in memory and clears on reload.
- Medication names link into the Medication Reference tab; the "Full pathways" links open the matching Treatment Pathway.

### Rule set

Current: **v1.1 — approved by medical director 2026-11-19.** The version string is the `RULESET` constant near the top of `workflow.js` and prints on every summary note. Bump it whenever a clinical rule changes.

v1.1 changes: benzodiazepine tapers use diazepam (first-line) or clonazepam; goal of a 10% reduction of the current dose per change, every 2–4 weeks.
