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

The treatment plan is **one plan for the whole patient**, not one per substance. Each medication is decided once, using every substance and clinical factor together, in this order:

1. **Opioid plan first** (continue current MOUD, or buprenorphine / methadone / XR-naltrexone). This decides whether naltrexone can be used anywhere in the plan.
2. **One benzodiazepine regimen** covers alcohol withdrawal and any sedative taper (lorazepam with liver disease or age ≥65, otherwise diazepam).
3. **One alcohol relapse-prevention medication** (naltrexone, else acamprosate). It is skipped when XR-naltrexone already treats both opioid and alcohol use.
4. Stimulant, cannabis and co-occurring conditions: one medication per need (for example, a single SSRI covers depression, anxiety and PTSD).
5. Shared symptom relief (anxiety, sleep, gabapentin adjunct) and safety (naloxone, thiamine/folate).

A final consistency pass guarantees that a drug on the Avoid list never appears in the plan, and that each drug is listed only once. Plan rows are grouped as Withdrawal, Maintenance, Co-occurring, Symptom relief, and Safety & nutrition; each row is tagged Start, Continue, Prescriber decision or As needed, with alternatives beneath it.

- Rule-based decision support only; no doses are given.
- Nothing entered is stored or transmitted; state lives in memory and clears on reload.
- Medication names link into the Medication Reference tab; the "Full pathways" links open the matching Treatment Pathway.

### Rule set

Current: **v1.2 (draft) — consolidated single plan; pending medical director approval.** The version string is the `RULESET` constant near the top of `workflow.js` and prints on every plan. Bump it whenever a clinical rule changes.

v1.2 changes: replaces the per-substance recommendation lists with one patient-level plan as described above. Clinical content otherwise carries over from v1.1.

v1.1: benzodiazepine tapers use diazepam (first-line) or clonazepam; goal of a 10% reduction of the current dose per change, every 2–4 weeks.
