# TAMG Medication Reference

Clinical reference for residential SUD treatment, deployed on Netlify at https://tamgmedications.netlify.app/.

## Files

- `index.html` — Medication Reference and Treatment Pathways (single-file site).
- `workflow.js` — Clinical Workflow, CIWA-Ar, COWS, Opioid conversion and Benzo conversion tabs (drop-in module). Loaded by `index.html` with:

  ```html
  <script src="workflow.js"></script>
  ```

  placed just before `</body>`, after the page's own inline script.

## Tab order

Left to right: Clinical Workflow · Treatment Pathways · Medication Reference · Opioid conversion · Benzo conversion · COWS · CIWA-Ar. The Clinical Workflow opens by default; links ending in `#workflow`, `#opioid-conv`, `#benzo-conv`, `#cows`, `#ciwa` open that tab directly. The order is set in `mount()` in `workflow.js`.

## Clinical Workflow

Opioid types at intake: fentanyl, prescription pills (e.g., Norco, Vicodin), methadone, kratom, and high-potency kratom derivatives (e.g., 7-OH). Each adds its own guidance (fentanyl or methadone → low-dose buprenorphine induction; pills → PDMP and counterfeit-fentanyl check; kratom → LFTs and severity-based approach; 7-OH → manage as full-agonist OUD).

Three steps: Intake → Safety & history (safety screen + clinical factors) → **Treatment plan**. Withdrawal scores are not part of the workflow; the plan states the CIWA-Ar / COWS thresholds and links to the calculators.

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

## CIWA-Ar and COWS calculators

Separate tabs (`#ciwa`, `#cows`) for scoring withdrawal at any time. Tap a score per item; the running total, severity band and the matching interpretation row update live and stay visible while scrolling. **Copy score** copies the total, band, time and item-by-item breakdown for the chart. Scores are kept in memory only and are not read by the Clinical Workflow.

## Dose conversion calculators

Separate tabs (`#opioid-conv`, `#benzo-conv`). Enter every drug the patient takes with its total daily dose (fentanyl patch in mcg/hr); add rows for combinations. **Copy result** copies the per-drug breakdown, total and conversion.

- **Opioid conversion** — total morphine milligram equivalents (MME/day) using the CDC 2022 conversion factors (codeine 0.15, dihydrocodeine 0.25, fentanyl patch 2.4 per mcg/hr, hydrocodone 1, hydromorphone 5, methadone 4.7, morphine 1, oxycodone 1.5, oxymorphone 3, tapentadol 0.4, tramadol 0.2). Flags ≥50 and ≥90 MME/day. Converts to a target opioid with a 25–50% reduction for incomplete cross-tolerance. Methadone and fentanyl patch are never offered as targets, and a warning appears when either is in the total. Buprenorphine, kratom and 7-OH are not converted.
- **Benzo conversion** — total diazepam-equivalent dose using Ashton equivalents (to diazepam 10 mg: alprazolam 0.5, chlordiazepoxide 25, clobazam 20, clonazepam 0.5, clorazepate 15, estazolam 1–2, flurazepam 15–30, lorazepam 1, oxazepam 20, quazepam 20, temazepam 20, triazolam 0.5, zaleplon 20, zolpidem 20). Converts to diazepam, clonazepam or lorazepam and shows the first 10% taper step from the rule set. The workflow's taper row links here.

Conversion tables live in the `OPIOIDS` and `BZDS` constants in `workflow.js`.

### Rule set

Current: **v1.4 (draft) — pending medical director approval.**

v1.4 changes: two new substance categories.
- **Inhalants** — types: nitrous oxide (whippets), solvents/aerosols/fuels, alkyl nitrites (poppers). Nitrous oxide adds a vitamin B12 row (check B12, methylmalonic acid, homocysteine; replace per prescriber). Solvents add a sudden-cardiac-death / ECG / labs alert. Poppers add a methemoglobinemia and PDE5-inhibitor caution. No type selected prompts staff to identify the product. Inhalants are legal products and do not trigger the naloxone rule.
- **Hallucinogens / empathogens** — types: psilocybin, LSD, MDMA, ketamine, other (DMT, mescaline). No FDA-approved medication; screen for HPPD, mood symptoms and persisting psychosis. MDMA adds a serotonin-syndrome caution with serotonergic medications; ketamine adds a bladder (ketamine cystitis) caution. Counts as illicit use for the naloxone rule.
- Neither category has a Treatment Pathways page yet, so the plan's "Full pathways" links skip them.

v1.3: approved by medical director.

v1.3 changes: benzodiazepine types at intake (alprazolam/Xanax, lorazepam/Ativan, clonazepam/Klonopin, diazepam/Valium, temazepam/Restoril, Z-drugs, designer benzodiazepines such as flubromazolam, pressed/counterfeit pills). Designer agents: no conversion — the taper agent is dosed by observed withdrawal, with a seizure-monitoring / level-of-care alert. Designer or counterfeit pills: fentanyl-contamination caution (urine drug screen, test strips) and a naloxone kit even without opioid use. Stimulant types at intake (cocaine powder, cocaine rock, methamphetamine): the bupropion + naltrexone row notes that its evidence is for methamphetamine when only cocaine is selected, and the limited-evidence note shows only the options for the selected types. **Overdose prevention (one rule):** everyone using illicit substances — any opioid use or MOUD, any stimulant use, or street/counterfeit/designer benzodiazepines — gets a naloxone kit and fentanyl test strips in the treatment / discharge plan, with overdose-response education (plus tolerance counselling for opioids). Alcohol, cannabis and prescribed benzodiazepines alone do not trigger it. The Treatment Pathways tab carries the same item for stimulants and benzodiazepines. Intake also records standard drinks per day for alcohol (documentation only) and no longer asks hours since last use.

v1.2: approved by medical director. The version string is the `RULESET` constant near the top of `workflow.js` and prints on every plan. Bump it whenever a clinical rule changes.

v1.2 changes: replaces the per-substance recommendation lists with one patient-level plan as described above; adds overlap rules (including long-acting methylphenidate for ADHD + stimulant use, and duloxetine for depression/anxiety + chronic pain); adds prescription opioid pills, kratom and 7-OH as opioid types. Other clinical content carries over from v1.1.

v1.1: benzodiazepine tapers use diazepam (first-line) or clonazepam; goal of a 10% reduction of the current dose per change, every 2–4 weeks.
