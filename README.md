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

Opioid types at intake: fentanyl, prescription pills (e.g., Norco, Vicodin), methadone, kratom, and high-potency kratom derivatives (e.g., 7-OH). Each adds its own guidance (fentanyl or methadone → low-dose buprenorphine induction; pills → PDMP and counterfeit-fentanyl check; kratom → LFTs and severity-based approach; 7-OH → manage as full-agonist OUD).

Four steps: Intake → Safety & history (safety screen + clinical factors) → Withdrawal scores (CIWA-Ar, COWS) → **Treatment plan**.

The treatment plan is **one plan for the whole patient**, not one per substance. Each medication is decided once, using every substance and clinical factor together, in this order:

1. **Opioid plan first** (continue current MOUD, or buprenorphine / methadone / XR-naltrexone). This decides whether naltrexone can be used anywhere in the plan.
2. **One benzodiazepine regimen** covers alcohol withdrawal and any sedative taper (lorazepam with liver disease or age ≥65, otherwise diazepam).
3. **One alcohol relapse-prevention medication** (naltrexone, else acamprosate). It is skipped when XR-naltrexone already treats both opioid and alcohol use.
4. **ADHD and stimulant use are decided together.** Long-acting methylphenidate treats both (avoided with cardiac disease or a psychotic disorder; then bupropion, or atomoxetine).
5. Cannabis and co-occurring conditions: one medication per need, **using overlap wherever one drug serves several purposes**:
   - XR-naltrexone → opioid + alcohol use
   - one benzodiazepine → alcohol withdrawal + sedative taper
   - methylphenidate ER → ADHD + stimulant use
   - bupropion (when already in the plan for stimulants) → also depression / ADHD
   - duloxetine → depression or anxiety + chronic pain
   - sertraline → depression + anxiety + PTSD
   - buprenorphine → opioid use + chronic pain
6. Shared symptom relief (anxiety, sleep, gabapentin adjunct) and safety (naloxone, thiamine/folate).

A final consistency pass guarantees that a drug on the Avoid list never appears in the plan, and that each drug is listed only once. Plan rows are grouped as Withdrawal, Maintenance, Co-occurring, Symptom relief, and Safety & nutrition; each row is tagged Start, Continue, Prescriber decision or As needed, with alternatives beneath it.

- Rule-based decision support only; no doses are given.
- Nothing entered is stored or transmitted; state lives in memory and clears on reload.
- Medication names link into the Medication Reference tab; the "Full pathways" links open the matching Treatment Pathway.

### Rule set

Current: **v1.2 (draft) — consolidated single plan; pending medical director approval.** The version string is the `RULESET` constant near the top of `workflow.js` and prints on every plan. Bump it whenever a clinical rule changes.

v1.2 changes: replaces the per-substance recommendation lists with one patient-level plan as described above; adds overlap rules (including long-acting methylphenidate for ADHD + stimulant use, and duloxetine for depression/anxiety + chronic pain); adds prescription opioid pills, kratom and 7-OH as opioid types. Other clinical content carries over from v1.1.

v1.1: benzodiazepine tapers use diazepam (first-line) or clonazepam; goal of a 10% reduction of the current dose per change, every 2–4 weeks.
