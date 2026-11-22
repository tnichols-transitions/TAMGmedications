/* ═══════════════════════════════════════════════════════════════════
   TAMG Clinical Workflow — drop-in module
   Adds a "🧭 Clinical Workflow" tab to the TAMG Medication Reference.
   Install: add a script tag pointing to workflow.js just before the closing body tag
   (after the existing inline <script>).
   Nothing entered here is saved, stored or transmitted — all state lives
   in memory and is cleared on reload or "Start new assessment".
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Palette (matches PATHWAY_COLORS in the main site) ── */
  const COL = { aud: '#ffb74d', oud: '#81c995', stim: '#ce93d8', bzd: '#4fc3f7', can: '#a5d6a7' };
  const SUBS = [
    { id: 'aud', label: 'Alcohol', pw: 'aud' },
    { id: 'oud', label: 'Opioids', pw: 'oud' },
    { id: 'stim', label: 'Stimulants', pw: 'stim' },
    { id: 'bzd', label: 'Benzodiazepines / sedatives', pw: 'bzd' },
    { id: 'can', label: 'Cannabis', pw: 'can' }
  ];
  const RULESET = 'Rule set v1.2 (draft) — consolidated single plan; pending medical director approval';
  const STEPS = ['Intake', 'Safety & history', 'Treatment plan'];
  const LAST = STEPS.length - 1;

  /* ── Instruments ── */
  const CIWA = [
    { id: 'nv', name: 'Nausea / vomiting', max: 7, a: { 0: 'None', 1: 'Mild nausea, no vomiting', 4: 'Intermittent nausea with dry heaves', 7: 'Constant nausea, frequent dry heaves and vomiting' } },
    { id: 'tr', name: 'Tremor', max: 7, a: { 0: 'None', 1: 'Not visible, can be felt fingertip to fingertip', 4: 'Moderate, with arms extended', 7: 'Severe, even with arms not extended' } },
    { id: 'sw', name: 'Paroxysmal sweats', max: 7, a: { 0: 'None visible', 1: 'Barely perceptible, palms moist', 4: 'Beads of sweat obvious on forehead', 7: 'Drenching sweats' } },
    { id: 'ax', name: 'Anxiety', max: 7, a: { 0: 'At ease', 1: 'Mildly anxious', 4: 'Moderately anxious or guarded', 7: 'Equivalent to acute panic' } },
    { id: 'ag', name: 'Agitation', max: 7, a: { 0: 'Normal activity', 1: 'Somewhat more than normal', 4: 'Moderately fidgety and restless', 7: 'Paces or constantly thrashes about' } },
    { id: 'td', name: 'Tactile disturbances', max: 7, a: { 0: 'None', 1: 'Very mild itching / pins & needles / numbness', 4: 'Moderately severe hallucinations', 7: 'Continuous hallucinations' } },
    { id: 'ad', name: 'Auditory disturbances', max: 7, a: { 0: 'Not present', 1: 'Very mild harshness or ability to frighten', 4: 'Moderately severe hallucinations', 7: 'Continuous hallucinations' } },
    { id: 'vd', name: 'Visual disturbances', max: 7, a: { 0: 'Not present', 1: 'Very mild sensitivity', 4: 'Moderately severe hallucinations', 7: 'Continuous hallucinations' } },
    { id: 'hd', name: 'Headache / fullness in head', max: 7, a: { 0: 'Not present', 1: 'Very mild', 4: 'Moderately severe', 7: 'Extremely severe' } },
    { id: 'or', name: 'Orientation / clouding of sensorium', max: 4, a: { 0: 'Oriented, can do serial additions', 1: 'Cannot do serial additions or uncertain of date', 2: 'Date off by ≤2 calendar days', 3: 'Date off by >2 calendar days', 4: 'Disoriented to place and/or person' } }
  ];
  const COWS = [
    { id: 'pr', name: 'Resting pulse rate', v: [[0, '≤80 bpm'], [1, '81–100'], [2, '101–120'], [4, '>120']] },
    { id: 'sw', name: 'Sweating (past ½ hr, not activity/temp)', v: [[0, 'None'], [1, 'Barely perceptible / palms moist'], [2, 'Flushed or observable moisture'], [3, 'Beads of sweat on brow or face'], [4, 'Streaming off face']] },
    { id: 'rs', name: 'Restlessness', v: [[0, 'Able to sit still'], [1, 'Reports difficulty sitting still'], [3, 'Frequent shifting / extraneous movement'], [5, 'Unable to sit still for more than a few seconds']] },
    { id: 'pu', name: 'Pupil size', v: [[0, 'Pinned or normal for room light'], [1, 'Possibly larger than normal'], [2, 'Moderately dilated'], [5, 'So dilated only the rim of iris is visible']] },
    { id: 'bj', name: 'Bone or joint aches', v: [[0, 'Not present'], [1, 'Mild diffuse discomfort'], [2, 'Severe diffuse aching'], [4, 'Rubbing joints/muscles, unable to sit still']] },
    { id: 'rn', name: 'Runny nose or tearing', v: [[0, 'Not present'], [1, 'Nasal stuffiness / unusually moist eyes'], [2, 'Nose running or tearing'], [4, 'Constantly running / tears streaming']] },
    { id: 'gi', name: 'GI upset (past ½ hr)', v: [[0, 'None'], [1, 'Stomach cramps'], [2, 'Nausea or loose stool'], [3, 'Vomiting or diarrhea'], [5, 'Multiple episodes of diarrhea or vomiting']] },
    { id: 'tr', name: 'Tremor (outstretched hands)', v: [[0, 'None'], [1, 'Felt, not observed'], [2, 'Slight tremor observable'], [4, 'Gross tremor or muscle twitching']] },
    { id: 'ya', name: 'Yawning', v: [[0, 'None'], [1, '1–2 times during assessment'], [2, '3+ times during assessment'], [4, 'Several times per minute']] },
    { id: 'ai', name: 'Anxiety or irritability', v: [[0, 'None'], [1, 'Reports increasing irritability/anxiety'], [2, 'Obviously irritable or anxious'], [4, 'So irritable/anxious participation is difficult']] },
    { id: 'gs', name: 'Gooseflesh skin', v: [[0, 'Skin is smooth'], [3, 'Piloerection can be felt / hairs standing up'], [5, 'Prominent piloerection']] }
  ];

  /* ── Safety screen items ── */
  const EMERGENT = [
    ['seizure', 'Seizure now or within the past 24 hours'],
    ['delirium', 'Confusion, disorientation or hallucinations with autonomic instability (possible DTs)'],
    ['vitals', 'Unstable vitals (e.g., HR >120, SBP >180 or <90, temp ≥38.5 °C, SpO₂ <92%)'],
    ['resp', 'Sedation, slowed breathing or suspected overdose / co-intoxication'],
    ['chest', 'Chest pain, stroke symptoms or other acute medical emergency'],
    ['si', 'Suicidal ideation with plan or intent, or homicidal ideation'],
    ['fluids', 'Persistent vomiting / unable to keep fluids down'],
    ['psychosis', 'Acute psychosis with unsafe behavior']
  ];
  const REVIEW = [
    ['hxsz', 'History of withdrawal seizures or delirium tremens'],
    ['od', 'Overdose in the past 30 days'],
    ['siPassive', 'Passive suicidal ideation (no plan or intent)'],
    ['unstableMed', 'Significant or unstable medical illness'],
    ['prevFail', 'Prior failed withdrawal management at this level of care']
  ];

  /* ── Clinical factors ── */
  const FACTORS = [
    { g: 'Medical', items: [
      ['liver', 'Liver disease (cirrhosis, hepatitis, LFTs >3× ULN)'],
      ['renal', 'Renal impairment — CrCl 30–50'],
      ['renalSevere', 'Severe renal impairment — CrCl <30'],
      ['cardiac', 'Cardiac disease or prolonged QTc'],
      ['szDisorder', 'Seizure disorder (non-withdrawal)'],
      ['pain', 'Chronic pain, currently on opioid analgesics'],
      ['stones', 'History of kidney stones'],
      ['eating', 'History of eating disorder']
    ]},
    { g: 'Psychiatric', items: [
      ['depression', 'Depression'],
      ['anxiety', 'Anxiety disorder'],
      ['ptsd', 'PTSD / trauma-related nightmares'],
      ['bipolar', 'Bipolar disorder'],
      ['psychoticD', 'Psychotic disorder / schizophrenia'],
      ['insomnia', 'Insomnia'],
      ['adhd', 'ADHD']
    ]},
    { g: 'Treatment history & preference', items: [
      ['bupFail', 'Prior buprenorphine treatment failure'],
      ['prefNoAgonist', 'Patient prefers non-agonist (non-opioid) treatment'],
      ['prefMoud', 'Patient interested in MOUD'],
      ['highTol', 'Very high opioid tolerance']
    ]}
  ];

  /* ── State (in memory only) ── */
  const fresh = () => ({
    step: 0, subs: {}, hrs: {}, fentanyl: false, methadoneUse: false, pills: false, kratom: false, sevenOH: false, moud: 'none',
    preg: 'na', older: false, emerg: {}, review: {}, f: {}
  });
  let S = fresh();

  /* ── Helpers ── */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const any = (o) => Object.values(o).some(Boolean);
  const chosen = () => SUBS.filter((s) => S.subs[s.id]);
  const knownMeds = () => {
    try { return (typeof MEDS !== 'undefined' ? MEDS : []).map((m) => m.name.toLowerCase()); } catch (e) { return []; }
  };
  const sumScale = (obj, items) => {
    const done = items.filter((i) => obj[i.id] !== undefined);
    return { total: done.reduce((a, i) => a + obj[i.id], 0), done: done.length, n: items.length };
  };
  const ciwaBand = (t) => t < 10 ? ['Minimal', 'ok'] : t < 19 ? ['Mild–moderate', 'warn'] : ['Severe', 'bad'];
  const cowsBand = (t) => t < 5 ? ['No active withdrawal', 'ok'] : t <= 12 ? ['Mild', 'ok'] : t <= 24 ? ['Moderate', 'warn'] : t <= 36 ? ['Moderately severe', 'bad'] : ['Severe', 'bad'];

  /* ── Rules engine (v1.2) ──
     One patient-level plan. Each medication is decided once, using every
     substance and clinical factor together, so the plan can never recommend
     a drug in one place and advise against it in another. */

  const calc = (tab, label) => `<button class="wf-link" data-tab-go="${tab}">${label} →</button>`;
  const GROUPS = ['Withdrawal', 'Maintenance', 'Co-occurring', 'Symptom relief', 'Safety & nutrition'];

  function buildPlan() {
    const f = S.f, sub = S.subs, preg = S.preg === 'yes';
    const lines = [], avoid = new Map(), actions = [];
    const no = (m, why) => { if (!avoid.has(m)) avoid.set(m, []); if (!avoid.get(m).includes(why)) avoid.get(m).push(why); };
    const act = (lvl, text) => actions.push({ lvl, text });
    const line = (group, purpose, meds, text, o) => lines.push({ group, purpose, meds, text, status: (o && o.status) || 'start', alts: (o && o.alts) || [] });
    const hepatic = f.liver || S.older;
    const renalAny = f.renal || f.renalSevere;
    const szRisk = [f.szDisorder || S.review.hxsz ? 'seizure history' : '', f.eating ? 'eating disorder' : '', sub.aud || sub.bzd ? 'alcohol/sedative withdrawal' : ''].filter(Boolean);
    if (szRisk.length) no('Bupropion', `lowers seizure threshold (${szRisk.join(', ')})`);

    /* 1 ─ Opioid plan: decided first, because it determines whether naltrexone can be used anywhere */
    const opioid = sub.oud || S.moud !== 'none';
    const current = S.moud !== 'none';
    let oplan = null;
    if (current) oplan = S.moud;
    else if (sub.oud) oplan = f.prefNoAgonist && !f.pain && !preg ? 'xrntx' : f.bupFail || f.highTol ? 'methadone' : 'bup';
    const agonist = oplan === 'bup' || oplan === 'methadone';
    const antagonist = oplan === 'xrntx';
    if (agonist) no('Naltrexone', `would block the ${oplan === 'bup' ? 'buprenorphine' : 'methadone'} in this plan and precipitate opioid withdrawal`);
    if (f.pain && !antagonist) no('Naltrexone', 'patient takes opioid analgesics — would precipitate withdrawal and block analgesia');
    if (preg && sub.oud) no('Naltrexone', 'pregnancy — do not initiate for OUD; agonist MOUD is the standard of care');
    if (antagonist && f.pain) act('alert', '<b>Opioid analgesics are blocked by naltrexone</b> — coordinate a non-opioid pain plan with the prescriber.');

    if (oplan) {
      const both = antagonist && sub.aud ? ' <b>Also treats alcohol use disorder</b> — no separate alcohol medication is needed.' : '';
      if (current) {
        line('Maintenance', both ? 'Opioid + alcohol use disorder' : 'Opioid use disorder', [{ bup: 'Buprenorphine', methadone: 'Methadone', xrntx: 'Naltrexone' }[oplan]], oplan === 'xrntx'
          ? `<b>Continue XR-naltrexone</b> monthly injections if effective.${both}`
          : `<b>Continue current ${oplan === 'bup' ? 'buprenorphine' : 'methadone'}.</b> Verify last dose with the prescriber${oplan === 'methadone' ? ' / OTP (guest dosing if needed)' : ''} and avoid any interruption.${oplan === 'methadone' && f.cardiac ? ' <b>Cardiac:</b> QTc risk — ECG.' : ''}`, { status: 'continue' });
      } else if (oplan === 'bup') {
        const low = S.fentanyl || S.methadoneUse, hrs = S.hrs.oud;
        const waitH = S.methadoneUse ? '36–72' : S.fentanyl ? '24–72' : '12–24';
        let txt, st = 'start';
        if (low) txt = `<b>Start buprenorphine by low-dose (Bernese/micro) induction.</b> ${S.fentanyl ? 'Fentanyl' : 'Methadone'} exposure raises the risk of precipitated withdrawal with standard induction; low-dose induction overlaps with full agonist and does not require waiting for withdrawal.`;
        else { st = 'cond'; txt = `<b>Start buprenorphine (standard induction)</b> once objective withdrawal is present — COWS ≥8–12 (many protocols begin at ≥8; others wait for ≥12) — and ~${waitH} h since last use${hrs ? ` (currently ${hrs} h)` : ''}. ${calc('cows', 'Score with the COWS calculator')}`; }
        if (preg) txt += ' Buprenorphine or methadone are both recommended in pregnancy.';
        line('Maintenance', 'Opioid use disorder', ['Buprenorphine'], txt, { status: st, alts: [{ med: 'Methadone', text: `if buprenorphine fails or tolerance is very high; requires OTP enrollment${f.cardiac ? '; QTc risk — ECG' : ''}.` }] });
      } else if (oplan === 'methadone') {
        const why = [f.bupFail && 'prior buprenorphine failure', f.highTol && 'very high tolerance'].filter(Boolean).join('; ');
        line('Maintenance', 'Opioid use disorder', ['Methadone'], `<b>Methadone</b> — favored: ${why}. OUD treatment requires OTP enrollment; coordinate discharge linkage early.${f.cardiac ? ' <b>Cardiac:</b> QTc prolongation risk — baseline and follow-up ECG.' : ''}`, { alts: [{ med: 'Buprenorphine', text: 'alternative agonist; low-dose induction if fentanyl/methadone exposure.' }] });
      } else {
        line('Maintenance', both ? 'Opioid + alcohol use disorder' : 'Opioid use disorder', ['Naltrexone'], `<b>XR-naltrexone</b> — matches the patient's preference for non-agonist treatment. Requires 7–10 opioid-free days (longer after methadone) and a negative naloxone challenge or confirmation per protocol.${f.liver ? ' Check LFTs.' : ''}${both}`, { status: 'cond', alts: [{ med: 'Buprenorphine', text: 'if the patient cannot complete the opioid-free period.' }] });
      }
      if (sub.oud && !(current && agonist)) {
        line('Withdrawal', 'Opioid withdrawal symptoms', ['Clonidine', 'Ondansetron', 'Loperamide', 'Dicyclomine'], 'As needed: clonidine (hold for low BP/HR), ondansetron, loperamide, dicyclomine, NSAIDs/acetaminophen.', { status: 'prn' });
        act('alert', `<b>Score COWS</b> at admission and before induction; >24 → notify prescriber, assess hydration and level of care. ${calc('cows', 'COWS calculator')}`);
      }
      line('Safety & nutrition', 'Overdose prevention', ['Naloxone'], '<b>Naloxone kit</b> at discharge (and for family). Counsel on loss of tolerance after a residential stay.');
      if (sub.oud && S.pills) act('caution', '<b>Prescription opioid pills (e.g., Norco, Vicodin):</b> check the PDMP and coordinate with any current prescriber. Pills from non-pharmacy sources may be counterfeit and contain fentanyl — if so, also check the fentanyl box (switches to low-dose induction).');
      if (sub.oud && S.kratom) act('caution', `<b>Kratom:</b> partial opioid agonist — withdrawal is usually milder and COWS still applies. ${S.fentanyl || S.pills || S.methadoneUse || S.sevenOH ? 'Treat the opioid use disorder as a whole.' : 'For mild use, symptomatic withdrawal care may be enough; buprenorphine for moderate–severe kratom use disorder (evidence from case series).'} Check LFTs (kratom-associated liver injury) and ask about high-dose use (seizure reports) and adulterated products.`);
      if (sub.oud && S.sevenOH) act('alert', '<b>High-potency kratom derivatives (7-OH):</b> potent full mu-agonist effects — manage as opioid use disorder; withdrawal can be as severe as with other opioids. Evidence on induction approach is limited — prescriber to decide timing; consider low-dose induction with heavy daily use.');
      if (sub.aud || sub.bzd) act('caution', '<b>Opioids with alcohol/sedatives:</b> heightened respiratory-depression risk. Do not withhold MOUD for this reason — monitor closely.');
      if (preg) act('alert', '<b>Pregnancy:</b> MOUD is the standard of care; avoid medically supervised withdrawal without MOUD. Coordinate with OB.');
    }

    /* 2 ─ One benzodiazepine regimen covers alcohol withdrawal and any sedative taper */
    if (sub.aud || sub.bzd) {
      const agent = hepatic ? 'Lorazepam' : 'Diazepam';
      const why = hepatic ? ` Lorazepam chosen (${f.liver ? 'liver disease' : 'age ≥65'}): no active metabolites, while long-acting agents can accumulate — monitor sedation and falls.` : ' Diazepam (long-acting) gives a smoother, self-tapering course.';
      const ciwaTxt = 'dose by CIWA-Ar per facility protocol: <10 — medication generally not indicated unless high-risk history; 10–18 — symptom-triggered dosing, reassess after each dose; ≥19 — notify prescriber';
      const taper = 'reduce by 10% of the current dose at each change, every 2–4 weeks; hold or extend the interval if withdrawal emerges. Never stop abruptly.';
      const hx = S.review.hxsz ? ' <b>Seizure/DT history:</b> prescriber may prefer scheduled or front-loaded dosing.' : '';
      let purpose, txt, st = 'start';
      if (sub.aud && sub.bzd) { purpose = 'Alcohol withdrawal + benzodiazepine taper'; txt = `<b>One ${agent.toLowerCase()} regimen for both.</b> Treat alcohol withdrawal first (${ciwaTxt}), then continue the same agent as a supervised taper: ${taper}`; }
      else if (sub.aud) { purpose = 'Alcohol withdrawal'; txt = `<b>${agent}</b> — ${ciwaTxt}.`; st = 'cond'; }
      else { purpose = 'Benzodiazepine taper'; txt = `<b>Convert to ${agent.toLowerCase()}</b> using an equivalence table (e.g., Ashton), verified by the prescriber. Goal: ${taper}`; }
      const alts = [];
      if (sub.bzd && !hepatic) alts.push({ med: 'Clonazepam', text: 'alternative taper agent.' });
      if (sub.aud) alts.push({ med: 'Phenobarbital', text: 'for benzodiazepine-resistant withdrawal, typically in more closely monitored settings.' });
      if (sub.bzd) ['Carbamazepine', 'Valproate'].forEach((m) => alts.push({ med: m, text: 'taper adjunct per prescriber.' }));
      if (sub.bzd) alts.push({ med: 'Propranolol', text: 'for somatic symptoms during the taper.' });
      line('Withdrawal', purpose, [agent], txt + why + hx, { status: st, alts });
      if (sub.aud) act('alert', `<b>Score CIWA-Ar</b> at admission and per protocol; ≥19 → notify prescriber now and evaluate need for a higher level of care. ${calc('ciwa', 'CIWA-Ar calculator')}`);
      if (sub.bzd) act('info', '<b>Benzodiazepine taper is dose-driven, not score-driven:</b> document agent, daily dose, duration of use and any withdrawal seizure history.');
    }
    if (sub.aud) line('Safety & nutrition', 'Wernicke prevention', ['Thiamine', 'Folate'], '<b>Thiamine for every patient, before any glucose.</b> Add folate and a multivitamin. Watch for confusion, ataxia and eye-movement abnormalities.');
    if (sub.stim || sub.bzd || f.anxiety || f.insomnia) no('Benzodiazepines / Z-drugs for sleep or anxiety', 'dependence risk — use the non-benzodiazepine options in this plan' + (sub.aud || sub.bzd ? ' (the withdrawal/taper regimen above is the only benzodiazepine)' : ''));

    /* 3 ─ Valproate and topiramate exclusions apply wherever they could appear */
    if (f.liver || preg) no('Valproate', [f.liver && 'liver disease', preg && 'pregnancy'].filter(Boolean).join(', '));
    const topBad = [preg && 'pregnancy (teratogenic)', f.stones && 'kidney stones'].filter(Boolean);
    if (topBad.length && sub.aud) no('Topiramate', topBad.join(', '));

    /* 4 ─ Alcohol relapse prevention — one primary medication */
    if (sub.aud && !antagonist) {
      if (f.renalSevere) no('Acamprosate', 'contraindicated with CrCl <30');
      const dsfBad = [f.cardiac && 'cardiac disease', f.psychoticD && 'psychotic disorder', preg && 'pregnancy', f.liver && 'liver disease'].filter(Boolean);
      if (dsfBad.length) no('Disulfiram', dsfBad.join(', '));
      const ntxOk = !avoid.has('Naltrexone'), acaOk = !f.renalSevere;
      const acaTxt = `<b>Acamprosate</b> — best for maintaining abstinence once achieved${f.renal ? '; <b>dose-adjust</b> for CrCl 30–50' : ''}${f.liver || agonist || f.pain ? '; no hepatic metabolism and no opioid interaction' : ''}.`;
      const ntxTxt = `<b>Naltrexone</b> — first-line; reduces heavy drinking and craving. Oral or monthly injectable${f.liver ? '. Liver disease: check LFTs; avoid in acute hepatitis or liver failure' : ''}.`;
      const alts = [];
      let primary = null, txt = '', st = 'start';
      if (ntxOk && !f.liver) { primary = 'Naltrexone'; txt = ntxTxt; if (acaOk) alts.push({ med: 'Acamprosate', text: `if naltrexone is not tolerated${f.renal ? '; dose-adjust for CrCl 30–50' : ''}.` }); }
      else if (acaOk) { primary = 'Acamprosate'; txt = acaTxt; if (ntxOk) alts.push({ med: 'Naltrexone', text: 'check LFTs first; avoid in acute hepatitis or liver failure.' }); }
      else if (ntxOk) { primary = 'Naltrexone'; txt = ntxTxt; }
      if (!topBad.length) alts.push({ med: 'Topiramate', text: 'off-label; slow titration, watch for cognitive slowing and paresthesias.' });
      if (!dsfBad.length) alts.push({ med: 'Disulfiram', text: 'selected patients only — requires commitment to abstinence and supervised dosing; never give while intoxicated.' });
      if (!primary) { const a = alts.shift(); primary = a ? a.med : null; st = 'cond'; txt = 'Naltrexone and acamprosate are both excluded (see Avoid).' + (a ? ` <b>${a.med}</b> — ${a.text}` : ' Psychosocial treatment; discuss options with the prescriber.'); }
      line('Maintenance', 'Alcohol use disorder', primary ? [primary] : [], txt, { status: st, alts });
    }

    /* 5 ─ ADHD and stimulants, decided together so one medication can treat both */
    const mphBad = [f.cardiac && 'cardiac disease', f.psychoticD && 'psychotic disorder'].filter(Boolean);
    let stimCovered = false, adhdViaStim = false;
    if (f.adhd) {
      if (mphBad.length) no('Methylphenidate', mphBad.join(', '));
      const mphTxt = '<b>Long-acting methylphenidate</b> (extended-release, abuse-deterrent formulation). Controlled substance: supervised or limited dispensing, PDMP check and urine drug screens.' + (f.bipolar ? ' <b>Bipolar disorder:</b> start only once mood is stabilized.' : '') + (preg ? ' <b>Pregnancy:</b> weigh risk and benefit with OB.' : '');
      if (sub.stim && !mphBad.length) {
        stimCovered = true;
        line('Maintenance', 'ADHD + stimulant use disorder', ['Methylphenidate'], mphTxt + ' <b>One medication for both:</b> treats ADHD and has trial evidence for reducing stimulant use when ADHD co-occurs.', { status: 'cond', alts: [{ med: 'Bupropion', text: 'non-stimulant option that also targets stimulant use.' }, { med: 'Atomoxetine', text: 'non-stimulant option for ADHD.' }] });
      } else if (!avoid.has('Bupropion') && sub.stim) {
        adhdViaStim = true;
      } else if (!avoid.has('Bupropion')) {
        line('Co-occurring', 'ADHD', ['Bupropion'], `<b>Bupropion</b> — non-stimulant option${sub.stim ? ' that also targets stimulant use' : ''}.`, { status: 'cond', alts: [{ med: 'Atomoxetine', text: 'non-stimulant option for ADHD.' }].concat(mphBad.length ? [] : [{ med: 'Methylphenidate', text: 'long-acting formulation with monitoring (PDMP, urine drug screens).' }]) });
      } else {
        line('Co-occurring', 'ADHD', ['Atomoxetine'], '<b>Atomoxetine</b> — non-stimulant option.', { status: 'cond', alts: mphBad.length ? [] : [{ med: 'Methylphenidate', text: 'long-acting formulation with monitoring (PDMP, urine drug screens).' }] });
      }
    }

    /* 6 ─ Stimulants */
    if (sub.stim) {
      act('info', '<b>Stimulants: no FDA-approved medication.</b> Contingency management has the strongest evidence; add CBT and community reinforcement. Mirtazapine (methamphetamine) and topiramate/modafinil (cocaine) have limited, mixed evidence.');
      act('caution', '<b>Stimulant crash (days 1–10):</b> hypersomnia, hyperphagia, dysphoria — screen for suicidal ideation daily.');
      if (f.cardiac) act('alert', '<b>Cardiac disease with stimulant use:</b> ECG and medical follow-up.');
      if (!stimCovered && !avoid.has('Bupropion')) {
        const ntxInPlan = lines.some((l) => l.meds.includes('Naltrexone'));
        const adhd = adhdViaStim ? ' <b>Also treats ADHD</b> (methylphenidate excluded — see Avoid).' : '';
        const o = { status: 'cond', alts: adhdViaStim ? [{ med: 'Atomoxetine', text: 'non-stimulant option for ADHD.' }] : [] };
        if (ntxInPlan) line('Maintenance', 'Stimulant use (off-label)', ['Bupropion'], '<b>Bupropion</b>, combined with the naltrexone already in this plan — the combination has trial evidence for methamphetamine use.' + adhd, o);
        else if (!avoid.has('Naltrexone')) line('Maintenance', 'Stimulant use (off-label)', ['Bupropion', 'Naltrexone'], `<b>Bupropion + injectable naltrexone</b> — the combination has trial evidence for methamphetamine use.${f.liver ? ' Check LFTs.' : ''}${adhd}`, o);
        else line('Maintenance', 'Stimulant use (off-label)', ['Bupropion'], '<b>Bupropion alone</b> may be considered; the naltrexone combination is not possible with this opioid plan.' + adhd, o);
      }
    }

    /* 7 ─ Cannabis */
    if (sub.can) {
      act('info', '<b>Cannabis withdrawal:</b> irritability, insomnia, reduced appetite, cravings — peaks days 2–6, mostly resolves in 1–2 weeks. Psychosocial core: MET, CBT, contingency management.');
      line('Symptom relief', 'Cannabinoid hyperemesis (if cyclic vomiting)', ['Capsaicin'], 'Topical capsaicin; haloperidol/droperidol in ED settings. Abstinence is the definitive treatment.', { status: 'prn' });
    }

    /* 8 ─ Co-occurring conditions — one medication per need */
    if (f.psychoticD) line('Co-occurring', 'Psychotic disorder', ['Aripiprazole', 'Risperidone'], `<b>Continue or optimize the antipsychotic.</b>${sub.can ? ' Cannabis worsens the course — strong abstinence focus.' : ''}${f.cardiac ? ' Check QTc.' : ''}`);
    const moodFor = [f.depression && 'depression', f.anxiety && 'anxiety', f.ptsd && 'PTSD'].filter(Boolean);
    const bupInPlan = lines.some((l) => l.meds.includes('Bupropion'));
    const snri = f.pain && !f.ptsd && (f.depression || f.anxiety);
    if (moodFor.length) {
      const label = moodFor.join(' / ');
      const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
      const bip = f.bipolar ? ' <b>Bipolar disorder:</b> only alongside a mood stabilizer — antidepressant monotherapy risks switching.' : '';
      const reassess = f.depression ? ' Reassess after 2–4 weeks of abstinence; substance-induced symptoms often improve.' : '';
      if (snri) {
        line('Co-occurring', cap(label) + ' + chronic pain', ['Duloxetine'], `<b>Duloxetine</b> (SNRI) — <b>one medication for both</b> ${label} and chronic pain. Add non-opioid pain strategies; coordinate with the opioid prescriber.${oplan === 'bup' ? ' The buprenorphine in this plan also helps pain.' : ''}${reassess}${bip}`, { status: f.bipolar ? 'cond' : 'start', alts: [{ med: 'Sertraline', text: `SSRI alternative for ${label}.` }] });
      } else if (f.depression && !f.anxiety && !f.ptsd && bupInPlan) {
        line('Co-occurring', 'Depression', [], `<b>The bupropion already in this plan also treats depression.</b>${reassess}${bip}`, { status: 'cond', alts: [{ med: 'Sertraline', text: 'add or switch if depression does not respond.' }, { med: 'Mirtazapine', text: 'alternative; also helps sleep and appetite.' }] });
      } else {
        const alts = [];
        if (f.anxiety) alts.push({ med: 'Venlafaxine', text: 'SNRI alternative for anxiety.' });
        if (f.depression) alts.push({ med: 'Bupropion', text: 'alternative for depression (also helps stimulant/nicotine use).' });
        if (f.depression) alts.push({ med: 'Mirtazapine', text: 'alternative for depression; also helps sleep and appetite.' });
        line('Co-occurring', cap(label), ['Sertraline'], `<b>Sertraline</b> (SSRI) first-line${moodFor.length > 1 ? ` — one medication covers ${moodFor.join(' and ')}` : ''}.${reassess}${f.ptsd ? ' Trauma-focused therapy when stable.' : ''}${bip}`, { status: f.bipolar ? 'cond' : 'start', alts });
      }
    }
    if (f.ptsd) line('Co-occurring', 'PTSD nightmares', ['Prazosin'], '<b>Prazosin</b> at bedtime; check orthostatic BP.');
    if (f.bipolar) line('Co-occurring', 'Bipolar disorder', ['Lithium', 'Valproate', 'Lamotrigine', 'Quetiapine'], `<b>One mood stabilizer, chosen by psychiatry.</b>${renalAny ? ' Lithium needs renal caution.' : ''}`, { status: 'cond' });
    if (f.pain && !snri) line('Co-occurring', 'Chronic pain', ['Duloxetine'], `<b>Duloxetine</b> and non-opioid strategies; coordinate with the opioid prescriber.${oplan === 'bup' ? ' The buprenorphine in this plan can address both pain and OUD.' : ''}`, { status: 'cond' });

    /* 9 ─ Symptom relief shared across substances */
    if (f.anxiety || sub.bzd || sub.stim || sub.can || sub.oud) line('Symptom relief', 'Anxiety / restlessness', ['Hydroxyzine'], '<b>Hydroxyzine</b> as needed — not habit-forming.', { status: 'prn', alts: f.anxiety || sub.bzd ? [{ med: 'Buspirone', text: 'scheduled option for ongoing anxiety.' }] : [] });
    if (f.insomnia || sub.stim || sub.can || sub.bzd) line('Symptom relief', 'Sleep', ['Trazodone'], `${f.insomnia ? 'Sleep hygiene / CBT-I first; then ' : ''}<b>trazodone</b> at bedtime as needed.`, { status: 'prn', alts: [{ med: 'Mirtazapine', text: 'if appetite is also low.' }].concat(sub.bzd ? [{ med: 'Melatonin', text: 'mild option.' }] : []) });
    if (sub.aud || sub.can || sub.bzd) line('Symptom relief', 'Withdrawal symptoms, sleep, anxiety (off-label)', ['Gabapentin'], `<b>Gabapentin</b> adjunct.${opioid ? ' <b>Misuse risk with opioid use</b> — monitor closely.' : ''}${renalAny ? ' Renal dose adjustment required.' : ''}`, { status: opioid || renalAny ? 'cond' : 'prn' });

    /* Consistency pass: an avoided drug never appears in the plan; each drug is listed once. */
    const placed = new Set(), altSeen = new Set();
    lines.forEach((l) => { l.meds = l.meds.filter((m) => !avoid.has(m) && !placed.has(m)); l.meds.forEach((m) => placed.add(m)); });
    lines.forEach((l) => { l.alts = l.alts.filter((a) => { const ok = !avoid.has(a.med) && !placed.has(a.med) && !altSeen.has(a.med); altSeen.add(a.med); return ok; }); });
    lines.sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group));
    return { lines, avoid, actions };
  }

  function acuity() {
    const reasons = [];
    EMERGENT.forEach(([k, l]) => { if (S.emerg[k]) reasons.push(l); });
    if (reasons.length) return { lvl: 'bad', label: 'Emergency escalation', text: 'Call 911 / transfer to emergency department per facility policy. Do not continue the admission workflow until stabilized.', reasons };
    const r = [];
    REVIEW.forEach(([k, l]) => { if (S.review[k]) r.push(l); });
    if (S.preg === 'yes') r.push('Pregnancy');
    if (S.subs.aud && S.subs.bzd) r.push('Combined alcohol + sedative withdrawal');
    if (S.older) r.push('Age ≥65');
    if (S.f.liver) r.push('Liver disease');
    if (S.f.cardiac && (S.subs.stim || S.subs.oud)) r.push('Cardiac disease with stimulant/opioid use');
    if (r.length) return { lvl: 'warn', label: 'Prescriber review before proceeding', text: 'Notify the prescriber/medical provider today and document a plan before routine protocol orders.', reasons: r };
    return { lvl: 'ok', label: 'Routine residential protocol', text: 'No escalation triggers identified. Proceed with standard protocol and scheduled reassessment.', reasons: [] };
  }

  /* ── Rendering ── */
  const LVL = {
    go: { icon: '✓', color: '#81c995', label: 'Suggested' },
    caution: { icon: '!', color: 'var(--warn)', label: 'Caution' },
    avoid: { icon: '✕', color: '#ef5350', label: 'Avoid / escalate' },
    info: { icon: 'i', color: 'var(--accent)', label: 'Consider' },
    alert: { icon: '→', color: 'var(--warn)', label: 'Action' }
  };

  function medChips(meds, col) {
    if (!meds || !meds.length) return '';
    const known = knownMeds();
    return '<div class="wf-meds">' + meds.map((m) => {
      const isKnown = known.includes(m.toLowerCase());
      return isKnown
        ? `<button class="pw-med wf-medlink" data-med="${esc(m)}" style="background:${col}1f;color:${col};border-color:${col}55" title="Open in Medication Reference">${esc(m)} ↗</button>`
        : `<span class="pw-med" style="background:var(--tag-bg);color:var(--text-dim)">${esc(m)}</span>`;
    }).join('') + '</div>';
  }

  function itemHTML(it, col) {
    const L = LVL[it.lvl];
    return `<div class="wf-rec wf-${it.lvl}"><div class="wf-rec-icon" style="color:${L.color};border-color:${L.color}">${L.icon}</div><div class="wf-rec-body"><div class="wf-rec-text">${it.text}</div>${medChips(it.meds, col)}</div></div>`;
  }

  function stepper() {
    return `<div class="wf-steps">${STEPS.map((s, i) => `<button class="wf-step ${i === S.step ? 'cur' : ''} ${i < S.step ? 'done' : ''}" data-go="${i}"><span class="wf-step-n">${i < S.step ? '✓' : i + 1}</span><span class="wf-step-l">${s}</span></button>`).join('')}</div>`;
  }

  function check(group, key, label, extraCls) {
    const on = group === 'root' ? !!S[key] : !!S[group][key];
    return `<label class="wf-check ${on ? 'on' : ''} ${extraCls || ''}"><input type="checkbox" data-g="${group}" data-k="${key}" ${on ? 'checked' : ''}><span class="wf-box"></span><span>${label}</span></label>`;
  }

  function radio(name, val, label) {
    const on = S[name] === val;
    return `<button class="wf-seg ${on ? 'on' : ''}" data-set="${name}" data-val="${val}">${label}</button>`;
  }

  function vStep0() {
    const cards = SUBS.map((s) => {
      const on = !!S.subs[s.id], c = COL[s.id];
      return `<div class="wf-sub ${on ? 'on' : ''}" style="${on ? `border-color:${c};background:${c}14` : ''}">
        <label class="wf-sub-top"><input type="checkbox" data-g="subs" data-k="${s.id}" ${on ? 'checked' : ''}><span class="wf-dot" style="background:${c}"></span><span class="wf-sub-name">${s.label}</span></label>
        ${on ? `<div class="wf-sub-extra">
          <label class="wf-inline">Hours since last use <input type="number" min="0" max="2000" inputmode="numeric" class="wf-num" data-hrs="${s.id}" value="${S.hrs[s.id] ?? ''}" placeholder="—"></label>
          ${s.id === 'oud' ? `<div class="wf-mini wf-muted">Opioid types used:</div>${check('root', 'fentanyl', 'Fentanyl / high-potency synthetic opioids')}${check('root', 'pills', 'Prescription opioid pills (e.g., Norco, Vicodin)')}${check('root', 'methadoneUse', 'Methadone (prescribed or illicit)')}${check('root', 'kratom', 'Kratom')}${check('root', 'sevenOH', 'High-potency kratom derivatives (e.g., 7-OH)')}` : ''}
        </div>` : ''}
      </div>`;
    }).join('');
    return `<div class="wf-card"><div class="wf-h">Substances in current use pattern</div><div class="wf-hint">Select all that apply. Each opens its own decision pathway.</div><div class="wf-subs">${cards}</div></div>
      <div class="wf-card"><div class="wf-h">Current MOUD</div><div class="wf-segs">${radio('moud', 'none', 'None')}${radio('moud', 'bup', 'Buprenorphine')}${radio('moud', 'methadone', 'Methadone')}${radio('moud', 'xrntx', 'XR-naltrexone')}</div></div>
      <div class="wf-card wf-row2">
        <div><div class="wf-h">Pregnancy</div><div class="wf-segs">${radio('preg', 'na', 'N/A')}${radio('preg', 'no', 'Negative')}${radio('preg', 'yes', 'Pregnant')}${radio('preg', 'unk', 'Unknown')}</div>${S.preg === 'unk' ? '<div class="wf-mini warn">Obtain pregnancy test before medication decisions.</div>' : ''}</div>
        <div><div class="wf-h">Age</div>${check('root', 'older', 'Age 65 or older')}</div>
      </div>`;
  }

  function vStep1() {
    const a = acuity();
    return `<div class="wf-card"><div class="wf-h" style="color:#ef5350">Emergent — escalate immediately</div><div class="wf-hint">Any one of these stops the workflow.</div><div class="wf-checks">${EMERGENT.map(([k, l]) => check('emerg', k, l, 'red')).join('')}</div></div>
      <div class="wf-card"><div class="wf-h" style="color:var(--warn)">Requires prescriber review</div><div class="wf-checks">${REVIEW.map(([k, l]) => check('review', k, l)).join('')}</div></div>
      ${FACTORS.map((g) => `<div class="wf-card"><div class="wf-h">${g.g}</div><div class="wf-hint">Check any that apply — these change which medications are recommended.</div><div class="wf-checks cols">${g.items.map(([k, l]) => check('f', k, l)).join('')}</div></div>`).join('')}
      ${acuityBanner(a)}`;
  }

  function acuityBanner(a) {
    return `<div class="wf-acuity wf-acuity-${a.lvl}"><div class="wf-acuity-label">${a.label}</div><div class="wf-acuity-text">${a.text}</div>${a.reasons.length ? `<ul>${a.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}</div>`;
  }

  /* ── Score calculators (separate tabs; not used by the workflow) ── */
  const SC = { ciwa: {}, cows: {} };
  const SCALES = {
    ciwa: { items: CIWA, max: 67, band: ciwaBand, label: 'CIWA-Ar', col: COL.aud, title: 'CIWA-Ar — Alcohol withdrawal',
      sub: 'Clinical Institute Withdrawal Assessment for Alcohol, revised. 10 items, maximum 67. Tap a score for each item; bold numbers are the instrument anchors (hover or tap to see the wording).',
      bands: [['0–9', 'Minimal', 'Supportive care; medication generally not indicated unless high-risk history. Reassess per protocol.'], ['10–18', 'Mild–moderate', 'Symptom-triggered benzodiazepine per facility protocol; reassess after each dose.'], ['≥19', 'Severe', 'Notify prescriber now; evaluate need for a higher level of care.']] },
    cows: { items: COWS, max: 48, band: cowsBand, label: 'COWS', col: COL.oud, title: 'COWS — Opioid withdrawal',
      sub: 'Clinical Opiate Withdrawal Scale. 11 items, maximum 48. Score observed signs; take the resting pulse after the patient has been seated for 1 minute.',
      bands: [['0–4', 'No active withdrawal', 'Too early for standard buprenorphine induction.'], ['5–12', 'Mild', 'Standard induction often begins at ≥8; other protocols wait for ≥12.'], ['13–24', 'Moderate', 'Standard buprenorphine induction threshold met in most protocols.'], ['25–36', 'Moderately severe', 'Notify prescriber; assess hydration and level of care.'], ['>36', 'Severe', 'Notify prescriber; assess hydration and level of care.']] }
  };

  function scaleRows(kind) {
    const obj = SC[kind];
    if (kind === 'ciwa') return CIWA.map((it) => {
      const v = obj[it.id];
      const btns = Array.from({ length: it.max + 1 }, (_, n) => `<button class="wf-sc ${v === n ? 'on' : ''} ${it.a[n] ? 'anch' : ''}" data-item="${it.id}" data-v="${n}" title="${esc(it.a[n] || '')}">${n}</button>`).join('');
      let desc = '';
      if (v !== undefined) { const keys = Object.keys(it.a).map(Number).filter((k) => k <= v); desc = it.a[v] || `Between “${it.a[Math.max(...keys)]}” and the next anchor`; }
      return `<div class="wf-item"><div class="wf-item-name">${it.name} <span class="wf-max">0–${it.max}</span></div><div class="wf-scs">${btns}</div><div class="wf-desc">${esc(desc)}</div></div>`;
    }).join('');
    return COWS.map((it) => {
      const v = obj[it.id];
      const btns = it.v.map(([n, l]) => `<button class="wf-sc wide ${v === n ? 'on' : ''}" data-item="${it.id}" data-v="${n}"><b>${n}</b> ${esc(l)}</button>`).join('');
      return `<div class="wf-item"><div class="wf-item-name">${it.name}</div><div class="wf-scs wrap">${btns}</div></div>`;
    }).join('');
  }

  function scoreBadge(r, b, max) {
    const cls = r.done ? b[1] : 'none';
    return `<div class="wf-score wf-score-${cls}"><div class="wf-score-n">${r.done ? r.total : '—'}<span>/${max}</span></div><div class="wf-score-l">${r.done ? b[0] : 'Not scored'}</div><div class="wf-score-p">${r.done}/${r.n} items</div></div>`;
  }

  function scoreText(kind) {
    const K = SCALES[kind], r = sumScale(SC[kind], K.items);
    const L = [`${K.label}: ${r.total}/${K.max} (${K.band(r.total)[0]})${r.done < r.n ? ` — partial, ${r.done}/${r.n} items scored` : ''}`, 'Scored: ' + new Date().toLocaleString()];
    K.items.forEach((it) => { if (SC[kind][it.id] !== undefined) L.push(`  ${it.name}: ${SC[kind][it.id]}`); });
    return L.join('\n');
  }

  function renderScale(kind, keepScroll) {
    const root = document.getElementById('scRoot-' + kind);
    if (!root) return;
    const y = window.scrollY;
    const K = SCALES[kind], r = sumScale(SC[kind], K.items), b = K.band(r.total);
    root.innerHTML = `<div class="pw-header"><div class="pw-title">${K.title}</div><div class="pw-sub">${K.sub}</div></div>
      <div class="wf-card" style="border-top:3px solid ${K.col}"><div class="wf-scale-head"><div><div class="wf-h">${K.label} calculator</div><div class="wf-hint">${r.done < r.n ? `${r.n - r.done} of ${r.n} items left to score.` : 'All items scored.'}</div></div>${scoreBadge(r, b, K.max)}</div>${scaleRows(kind)}</div>
      <div class="wf-card"><div class="wf-h">Interpretation</div><div class="sc-bands">${K.bands.map(([rng, lab, txt]) => `<div class="sc-band ${r.done && lab === b[0] ? 'on' : ''}"><b>${rng}</b><span class="sc-lab">${lab}</span><span class="sc-txt">${txt}</span></div>`).join('')}</div><div class="wf-hint" style="margin:.6rem 0 0">Use your facility's protocol thresholds.</div></div>
      <div class="wf-actions"><button class="wf-btn" data-sc-copy="1" ${r.done ? '' : 'disabled'}>Copy score</button><button class="wf-btn ghost danger" data-sc-reset="1">Clear</button></div>
      <div class="pw-note" style="margin-top:1.5rem">Nothing entered is saved; scores clear on reload. Record the score in the chart — the Clinical Workflow does not read it.</div>`;
    if (keepScroll) window.scrollTo(0, y);
  }

  function copyText(text, btn, label) {
    const done = () => { btn.textContent = 'Copied ✓'; setTimeout(() => { btn.textContent = label; }, 1600); };
    const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); done(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }

  function onScaleClick(kind, e) {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.item) { const o = SC[kind], k = t.dataset.item, v = +t.dataset.v; if (o[k] === v) delete o[k]; else o[k] = v; renderScale(kind, true); return; }
    if (t.dataset.scCopy) { copyText(scoreText(kind), t, 'Copy score'); return; }
    if (t.dataset.scReset) { SC[kind] = {}; renderScale(kind); }
  }

  /* ── Treatment plan view ── */
  const STATUS = { start: ['Start', '#81c995'], continue: ['Continue', '#81c995'], cond: ['Prescriber decision', 'var(--warn)'], prn: ['As needed', 'var(--accent)'] };
  const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  function medChip(m, bad) {
    const c = bad ? '#ef5350' : 'var(--accent)';
    const st = `background:color-mix(in srgb,${c} 12%,transparent);color:${c};border-color:color-mix(in srgb,${c} 35%,transparent)`;
    return knownMeds().includes(m.toLowerCase())
      ? `<button class="pw-med wf-medlink" data-med="${esc(m)}" style="${st}" title="Open in Medication Reference">${esc(m)} ↗</button>`
      : `<span class="pw-med" style="${st}">${esc(m)}</span>`;
  }

  function planRow(l) {
    const [lab, col] = STATUS[l.status];
    return `<div class="wf-pl"><div class="wf-pl-head"><span class="wf-pl-purpose">${esc(l.purpose)}</span><span class="wf-badge" style="color:${col};border-color:${col}">${lab}</span></div>
      ${l.meds.length ? `<div class="wf-meds">${l.meds.map((m) => medChip(m)).join('')}</div>` : ''}
      <div class="wf-pl-text">${l.text}</div>
      ${l.alts.length ? `<div class="wf-pl-alts"><span class="wf-pl-altl">Alternatives</span>${l.alts.map((a) => `<div>${medChip(a.med)} ${a.text}</div>`).join('')}</div>` : ''}</div>`;
  }

  function vPlan() {
    const a = acuity();
    let html = acuityBanner(a);
    if (a.lvl === 'bad') return html;
    if (!chosen().length) return html + '<div class="wf-card"><div class="wf-hint">Select at least one substance in Intake.</div></div>';
    const p = buildPlan();
    html += `<div class="wf-card"><div class="wf-h">Treatment plan</div><div class="wf-hint">One plan for this patient, built from all substances and clinical factors together. Each medication appears once.</div>
      ${GROUPS.map((g) => { const ls = p.lines.filter((l) => l.group === g); return ls.length ? `<div class="wf-group">${g}</div>${ls.map(planRow).join('')}` : ''; }).join('')}</div>`;
    if (p.avoid.size) html += `<div class="wf-card" style="border-left:3px solid #ef5350"><div class="wf-h" style="color:#ef5350">Avoid</div>${[...p.avoid].map(([m, why]) => `<div class="wf-av">${medChip(m, true)}<span>${esc(why.join('; '))}</span></div>`).join('')}</div>`;
    if (p.actions.length) html += `<div class="wf-card"><div class="wf-h">Actions &amp; monitoring</div>${p.actions.map((x) => itemHTML(x, 'var(--accent)')).join('')}</div>`;
    html += `<div class="wf-card wf-pwlinks"><span class="wf-muted">Full pathways:</span> ${chosen().map((s) => `<button class="wf-link" data-pw="${s.pw}" style="color:${COL[s.id]}">${s.label} →</button>`).join('')}</div>`;
    html += '<div class="wf-actions"><button class="wf-btn" id="wfCopy">Copy plan</button><button class="wf-btn ghost" id="wfPrint">Print</button><button class="wf-btn ghost danger" id="wfReset">Start new assessment</button></div>';
    return html;
  }

  function planText() {
    const a = acuity(), L = [];
    L.push('MEDICATION TREATMENT PLAN (TAMG Clinical Workflow)');
    L.push('Generated: ' + new Date().toLocaleString());
    L.push('Substances: ' + (chosen().map((s) => s.label + (S.hrs[s.id] ? ` (last use ~${S.hrs[s.id]} h)` : '')).join('; ') || 'none selected'));
    if (S.subs.oud) { const ox = [S.fentanyl && 'fentanyl', S.pills && 'prescription pills', S.methadoneUse && 'methadone', S.kratom && 'kratom', S.sevenOH && '7-OH'].filter(Boolean); if (ox.length) L.push('Opioid types: ' + ox.join(', ')); }
    L.push('Current MOUD: ' + ({ none: 'none', bup: 'buprenorphine', methadone: 'methadone', xrntx: 'XR-naltrexone' })[S.moud] + ' | Pregnancy: ' + ({ na: 'N/A', no: 'negative', yes: 'PREGNANT', unk: 'unknown — test pending' })[S.preg] + (S.older ? ' | Age ≥65' : ''));
    L.push('');
    L.push('ACUITY: ' + a.label.toUpperCase());
    a.reasons.forEach((r) => L.push('  - ' + r));
    if (a.lvl !== 'bad') {
      const p = buildPlan();
      GROUPS.forEach((g) => {
        const ls = p.lines.filter((l) => l.group === g);
        if (!ls.length) return;
        L.push(''); L.push(g.toUpperCase());
        ls.forEach((l) => {
          L.push(`  • ${l.purpose}: ${l.meds.join(' + ') || '—'} [${STATUS[l.status][0]}]`);
          L.push('      ' + strip(l.text));
          l.alts.forEach((x) => L.push(`      Alternative: ${x.med} — ${strip(x.text)}`));
        });
      });
      if (p.avoid.size) { L.push(''); L.push('AVOID'); p.avoid.forEach((why, m) => L.push(`  • ${m} — ${why.join('; ')}`)); }
      if (p.actions.length) { L.push(''); L.push('ACTIONS & MONITORING'); p.actions.forEach((x) => L.push('  • ' + strip(x.text))); }
    }
    L.push('');
    L.push('Decision support only — not an order. Dosing, contraindications and interactions to be verified by the prescriber.');
    L.push(RULESET);
    return L.join('\n');
  }

  const VIEWS = [vStep0, vStep1, vPlan];

  function render(keepScroll) {
    const root = document.getElementById('wfRoot');
    if (!root) return;
    const y = window.scrollY;
    const a = acuity();
    const stop = a.lvl === 'bad' && S.step > 1;
    root.innerHTML = `
      <div class="pw-header"><div class="pw-title">Clinical Decision Workflow</div><div class="pw-sub">Admission assessment → medication treatment plan for residential SUD treatment. Withdrawal scores are in the CIWA-Ar and COWS tabs.</div></div>
      ${stepper()}
      ${a.lvl !== 'ok' && S.step !== 1 && S.step !== LAST ? `<div class="wf-strip wf-acuity-${a.lvl}"><b>${a.label}</b> — ${a.reasons.length} trigger${a.reasons.length !== 1 ? 's' : ''}. <button class="wf-link" data-go="1">Review</button></div>` : ''}
      <div class="wf-view">${stop ? acuityBanner(a) : VIEWS[S.step]()}</div>
      <div class="wf-nav">
        <button class="wf-btn ghost" data-go="${S.step - 1}" ${S.step === 0 ? 'disabled' : ''}>← Back</button>
        <div class="wf-nav-mid">Step ${S.step + 1} of ${STEPS.length}</div>
        ${S.step < STEPS.length - 1 ? `<button class="wf-btn" data-go="${S.step + 1}" ${S.step === 0 && !chosen().length ? 'disabled title="Select at least one substance"' : ''}>Next →</button>` : '<span></span>'}
      </div>
      <div class="pw-note" style="margin-top:1.5rem"><b>Decision support only.</b> Suggestions are rule-based prompts drawn from this reference and common protocols; they are not orders and do not replace clinical judgment, prescriber review, or facility policy. <span style="opacity:.75">${RULESET}.</span></div>`;
    if (keepScroll) window.scrollTo(0, y);
  }

  /* ── Events (delegated) ── */
  function onClick(e) {
    const t = e.target.closest('button');
    if (!t || !document.getElementById('wfRoot').contains(t)) return;
    if (t.dataset.go !== undefined) {
      const n = +t.dataset.go;
      if (n < 0 || n >= STEPS.length) return;
      if (n > 0 && !chosen().length) return;
      S.step = n; render(); document.getElementById('wfRoot').scrollIntoView({ block: 'start' }); return;
    }
    if (t.dataset.set) { S[t.dataset.set] = t.dataset.val; render(true); return; }
    if (t.dataset.tabGo) { switchTab(t.dataset.tabGo); window.scrollTo({ top: 0 }); return; }
    if (t.classList.contains('wf-medlink')) { openMed(t.dataset.med); return; }
    if (t.dataset.pw) { openPathway(t.dataset.pw); return; }
    if (t.id === 'wfCopy') { copyText(planText(), t, 'Copy plan'); return; }
    if (t.id === 'wfPrint') { document.body.classList.add('wf-printing'); try { window.print(); } catch (err) { /* printing blocked in sandboxed previews */ } setTimeout(() => document.body.classList.remove('wf-printing'), 500); return; }
    if (t.id === 'wfReset') {
      if (t.dataset.armed) { S = fresh(); render(); return; }
      t.dataset.armed = '1'; t.textContent = 'Click again to clear everything';
      setTimeout(() => { if (t.isConnected) { delete t.dataset.armed; t.textContent = 'Start new assessment'; } }, 3000);
    }
  }

  function onChange(e) {
    const t = e.target;
    if (t.matches('input[type=checkbox][data-g]')) {
      const g = t.dataset.g, k = t.dataset.k;
      if (g === 'root') S[k] = t.checked; else S[g][k] = t.checked;
      if (g === 'subs' && !t.checked) delete S.hrs[k];
      if (k === 'renalSevere' && t.checked) S.f.renal = false;
      if (k === 'renal' && t.checked) S.f.renalSevere = false;
      render(true);
    }
  }
  function onInput(e) {
    const t = e.target;
    if (t.matches('input[data-hrs]')) { const v = t.value.trim(); if (v === '') delete S.hrs[t.dataset.hrs]; else S.hrs[t.dataset.hrs] = Math.max(0, Math.round(+v)); }
  }

  /* ── Cross-links into the existing site ── */
  function switchTab(name) {
    const btn = document.querySelector(`.tab-btn[data-tab="${name}"]`);
    if (btn) btn.click();
    return !!btn;
  }
  function openMed(name) {
    if (!switchTab('meds')) return;
    const inp = document.getElementById('searchInput');
    if (inp) {
      const all = document.querySelector('#filterPills .pill[data-filter="all"]'); if (all) all.click();
      inp.value = name; inp.dispatchEvent(new Event('input', { bubbles: true }));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function openPathway(pw) {
    if (!switchTab('pathways')) return;
    const b = document.querySelector(`.pnav-btn[data-pw="${pw}"]`); if (b) b.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── Styles (uses the site's CSS variables) ── */
  const CSS = `
  .wf-steps{display:flex;gap:.35rem;margin-bottom:1.25rem;overflow-x:auto;padding-bottom:.25rem;scrollbar-width:none}
  .wf-steps::-webkit-scrollbar{display:none}
  .wf-step{flex:1;min-width:max-content;display:flex;align-items:center;gap:.45rem;padding:.5rem .7rem;border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--text-muted);font-family:'IBM Plex Mono',monospace;font-size:11px;cursor:pointer;transition:all .15s}
  .wf-step:hover{color:var(--text);border-color:var(--text-muted)}
  .wf-step.cur{background:var(--surface2);color:var(--text);border-color:var(--accent)}
  .wf-step.done{color:var(--text-dim)}
  .wf-step-n{width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--tag-bg);font-size:10px;font-weight:600;flex-shrink:0}
  .wf-step.cur .wf-step-n{background:var(--accent);color:var(--bg)}
  .wf-step.done .wf-step-n{background:color-mix(in srgb,#81c995 25%,transparent);color:#81c995}
  .wf-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1rem 1.1rem;margin-bottom:1rem}
  .wf-h{font-size:13.5px;font-weight:600;margin-bottom:.2rem}
  .wf-hint{font-size:12px;color:var(--text-dim);margin-bottom:.75rem;line-height:1.5}
  .wf-muted{color:var(--text-muted)}
  .wf-mini{font-size:11.5px;margin-top:.5rem}.wf-mini.warn{color:var(--warn)}
  .wf-subs{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.6rem}
  .wf-sub{border:1px solid var(--border);border-radius:8px;padding:.65rem .75rem;transition:all .15s}
  .wf-sub-top{display:flex;align-items:center;gap:.55rem;cursor:pointer;font-size:13px;font-weight:500}
  .wf-sub-top input{accent-color:var(--accent);width:15px;height:15px}
  .wf-dot{width:8px;height:8px;border-radius:50%}
  .wf-sub-extra{margin-top:.6rem;padding-top:.6rem;border-top:1px dashed var(--border);display:flex;flex-direction:column;gap:.4rem}
  .wf-inline{display:flex;align-items:center;justify-content:space-between;gap:.5rem;font-size:12px;color:var(--text-dim)}
  .wf-num{width:80px;background:var(--bg);border:1px solid var(--border);border-radius:5px;color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:.3rem .45rem;outline:none}
  .wf-num:focus{border-color:var(--accent)}
  .wf-segs{display:flex;flex-wrap:wrap;gap:.35rem}
  .wf-seg{font-family:'IBM Plex Mono',monospace;font-size:11.5px;padding:.4rem .8rem;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text-dim);cursor:pointer}
  .wf-seg:hover{color:var(--text);border-color:var(--text-muted)}
  .wf-seg.on{background:var(--accent);border-color:var(--accent);color:var(--bg);font-weight:600}
  .wf-row2{display:grid;grid-template-columns:2fr 1fr;gap:1.25rem}
  .wf-checks{display:flex;flex-direction:column;gap:.35rem}
  .wf-checks.cols{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
  .wf-check{display:flex;align-items:flex-start;gap:.55rem;font-size:12.5px;color:var(--text-dim);padding:.45rem .55rem;border-radius:6px;border:1px solid transparent;cursor:pointer;line-height:1.45}
  .wf-check:hover{background:var(--surface2)}
  .wf-check input{position:absolute;opacity:0;pointer-events:none}
  .wf-box{width:15px;height:15px;border:1.5px solid var(--text-muted);border-radius:4px;flex-shrink:0;margin-top:1px;position:relative}
  .wf-check.on{color:var(--text);background:var(--surface2);border-color:var(--border)}
  .wf-check.on .wf-box{background:var(--accent);border-color:var(--accent)}
  .wf-check.on .wf-box::after{content:'';position:absolute;left:4px;top:1px;width:4px;height:8px;border:solid var(--bg);border-width:0 2px 2px 0;transform:rotate(45deg)}
  .wf-check.red.on{border-color:#ef535088;background:color-mix(in srgb,#ef5350 10%,transparent)}
  .wf-check.red.on .wf-box{background:#ef5350;border-color:#ef5350}
  .wf-check input:focus-visible + .wf-box{outline:2px solid var(--accent);outline-offset:2px}
  .wf-acuity{border-radius:10px;padding:1rem 1.1rem;margin-bottom:1rem;border:1px solid}
  .wf-acuity-label{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;margin-bottom:.3rem}
  .wf-acuity-text{font-size:13px;color:var(--text)}
  .wf-acuity ul{margin:.5rem 0 0 1.1rem;font-size:12.5px;color:var(--text-dim)}
  .wf-acuity-ok{background:color-mix(in srgb,#81c995 10%,transparent);border-color:color-mix(in srgb,#81c995 40%,transparent)}.wf-acuity-ok .wf-acuity-label{color:#81c995}
  .wf-acuity-warn{background:color-mix(in srgb,var(--warn) 10%,transparent);border-color:color-mix(in srgb,var(--warn) 40%,transparent)}.wf-acuity-warn .wf-acuity-label{color:var(--warn)}
  .wf-acuity-bad{background:color-mix(in srgb,#ef5350 12%,transparent);border-color:#ef5350}.wf-acuity-bad .wf-acuity-label{color:#ef5350}
  .wf-strip{font-size:12px;padding:.55rem .8rem;border-radius:8px;border:1px solid;margin-bottom:1rem;color:var(--text-dim)}
  .wf-strip.wf-acuity-warn b{color:var(--warn)}.wf-strip.wf-acuity-bad b{color:#ef5350}
  .wf-scale-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin:-.25rem -.25rem .5rem;padding:.25rem;position:sticky;top:0;z-index:3;background:var(--surface)}
  .wf-score{text-align:right;min-width:110px;padding:.45rem .7rem;border-radius:8px;border:1px solid var(--border);background:var(--bg)}
  .wf-score-n{font-family:'IBM Plex Mono',monospace;font-size:1.6rem;font-weight:600;line-height:1}
  .wf-score-n span{font-size:11px;color:var(--text-muted);font-weight:400}
  .wf-score-l{font-size:11px;font-weight:600;margin-top:.2rem}
  .wf-score-p{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text-muted)}
  .wf-score-ok .wf-score-l{color:#81c995}.wf-score-warn .wf-score-l{color:var(--warn)}.wf-score-bad .wf-score-l{color:#ef5350}.wf-score-bad{border-color:#ef5350}
  .wf-item{padding:.65rem 0;border-top:1px solid var(--border)}
  .wf-item-name{font-size:12.5px;font-weight:500;margin-bottom:.4rem}
  .wf-max{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text-muted);font-weight:400;margin-left:.3rem}
  .wf-scs{display:flex;gap:.3rem}
  .wf-scs.wrap{flex-wrap:wrap}
  .wf-sc{min-width:34px;height:32px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text-muted);font-family:'IBM Plex Mono',monospace;font-size:12px;cursor:pointer;transition:all .12s}
  .wf-sc.anch{color:var(--text-dim);font-weight:600}
  .wf-sc:hover{border-color:var(--text-dim);color:var(--text)}
  .wf-sc.on{background:var(--accent);border-color:var(--accent);color:var(--bg);font-weight:600}
  .wf-sc.wide{height:auto;min-height:32px;padding:.35rem .6rem;text-align:left;font-family:'IBM Plex Sans',sans-serif;font-size:11.5px}
  .wf-sc.wide b{font-family:'IBM Plex Mono',monospace;margin-right:.3rem}
  .wf-desc{font-size:11.5px;color:var(--text-dim);margin-top:.3rem;min-height:1em}
  .wf-bands{display:flex;flex-wrap:wrap;gap:.4rem 1rem;margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--border);font-size:11px;font-family:'IBM Plex Mono',monospace;color:var(--text-dim)}
  .sc-bands{display:flex;flex-direction:column;gap:.35rem;margin-top:.5rem}
  .sc-band{display:grid;grid-template-columns:64px 150px 1fr;gap:.3rem .75rem;align-items:baseline;padding:.5rem .65rem;border:1px solid var(--border);border-radius:6px;font-size:12px;color:var(--text-dim)}
  .sc-band b{font-family:'IBM Plex Mono',monospace;color:var(--text)}
  .sc-lab{color:var(--text);font-weight:500}
  .sc-band.on{border-color:var(--accent);background:var(--surface2);box-shadow:inset 3px 0 0 var(--accent)}
  .wf-path-head{display:flex;justify-content:space-between;align-items:center;gap:.5rem}
  .wf-link{background:none;border:none;color:var(--accent);font-family:'IBM Plex Mono',monospace;font-size:11px;cursor:pointer;padding:.2rem 0}
  .wf-link:hover{text-decoration:underline}
  .wf-rec{display:flex;gap:.65rem;align-items:flex-start;padding:.5rem 0}
  .wf-rec + .wf-rec{border-top:1px dashed var(--border)}
  .wf-rec-icon{width:20px;height:20px;border-radius:50%;border:1.5px solid;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:1px;font-family:'IBM Plex Mono',monospace}
  .wf-rec-text{font-size:12.5px;color:var(--text-dim);line-height:1.55}
  .wf-rec-text b{color:var(--text);font-weight:500}
  .wf-avoid .wf-rec-text b{color:#ef5350}
  .wf-meds{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.4rem}
  .wf-medlink{cursor:pointer;background:none}
  .wf-medlink:hover{filter:brightness(1.15)}
  .wf-legend{display:flex;flex-wrap:wrap;gap:.5rem 1.1rem;font-size:11px;color:var(--text-muted);font-family:'IBM Plex Mono',monospace;margin:.25rem 0 0}
  .wf-legend span{display:inline-flex;align-items:center;gap:.35rem}
  .wf-legend i{font-style:normal;width:16px;height:16px;border-radius:50%;border:1.5px solid;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700}
  .wf-group{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text);margin:1.1rem 0 .1rem}
  .wf-pl{padding:.7rem 0;border-top:1px solid var(--border)}
  .wf-pl-head{display:flex;justify-content:space-between;align-items:center;gap:.6rem}
  .wf-pl-purpose{font-size:13px;font-weight:500;color:var(--text)}
  .wf-badge{font-family:'IBM Plex Mono',monospace;font-size:10px;border:1px solid;border-radius:999px;padding:.05rem .55rem;white-space:nowrap}
  .wf-pl-text{font-size:12.5px;color:var(--text-dim);margin-top:.4rem;line-height:1.55}
  .wf-pl-text b{color:var(--text);font-weight:500}
  .wf-pl-alts{margin-top:.5rem;padding-left:.75rem;border-left:2px solid var(--border);font-size:12px;color:var(--text-dim);display:flex;flex-direction:column;gap:.35rem;line-height:1.5}
  .wf-pl-altl{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em}
  .wf-pl-alts .pw-med{margin-right:.35rem}
  .wf-av{display:flex;align-items:baseline;flex-wrap:wrap;gap:.3rem .6rem;padding:.5rem 0;border-top:1px dashed var(--border);font-size:12.5px;color:var(--text-dim)}
  .wf-card > .wf-h + .wf-av{border-top:none}
  .wf-pwlinks{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem .9rem;font-size:12px}
  .wf-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem}
  .wf-nav{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-top:.5rem}
  .wf-nav-mid{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-muted)}
  .wf-btn{font-family:'IBM Plex Mono',monospace;font-size:12px;padding:.55rem 1.1rem;border-radius:6px;border:1px solid var(--accent);background:var(--accent);color:var(--bg);font-weight:600;cursor:pointer}
  .wf-btn:hover{filter:brightness(1.08)}
  .wf-btn:disabled{opacity:.35;cursor:not-allowed}
  .wf-btn.ghost{background:transparent;color:var(--text-dim);border-color:var(--border);font-weight:500}
  .wf-btn.ghost:hover{color:var(--text);border-color:var(--text-muted)}
  .wf-btn.danger:hover{color:#ef5350;border-color:#ef5350}
  .tab-bar{overflow-x:auto;scrollbar-width:none}.tab-bar::-webkit-scrollbar{display:none}
  @media(max-width:700px){.tab-btn{padding:.6rem .8rem}.wf-row2{grid-template-columns:1fr}.wf-step-l{display:none}.wf-step.cur .wf-step-l{display:inline}.wf-scs{flex-wrap:wrap}.wf-sc{min-width:38px;height:36px}.wf-score{min-width:90px}.wf-checks.cols{grid-template-columns:1fr}.sc-band{grid-template-columns:56px 1fr}.sc-txt{grid-column:1/-1}}
  @media print{body.wf-printing .site-header,body.wf-printing .wf-steps,body.wf-printing .wf-nav,body.wf-printing .wf-actions,body.wf-printing .wf-hint,body.wf-printing .wf-strip,body.wf-printing .wf-pwlinks,body.wf-printing .tab-panel:not(#tab-workflow),body.wf-printing .pw-header,body.wf-printing .footer{display:none!important}
    body.wf-printing,body.wf-printing #wfRoot,body.wf-printing .wf-card,body.wf-printing .wf-acuity{background:#fff!important}
    body.wf-printing #wfRoot *{color:#000!important}
    body.wf-printing .wf-card{padding:.4rem .6rem;break-inside:avoid}}
  `;

  /* ── Mount ── */
  function mount() {
    if (document.getElementById('tab-workflow')) return;
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

    const bar = document.querySelector('.tab-bar');
    const page = document.querySelector('.page');
    if (!bar || !page) return;
    const TABS = [
      { id: 'workflow', label: '🧭 Clinical Workflow', html: '<div id="wfRoot"></div>' },
      { id: 'ciwa', label: '🧮 CIWA-Ar', html: '<div id="scRoot-ciwa"></div>' },
      { id: 'cows', label: '🧮 COWS', html: '<div id="scRoot-cows"></div>' }
    ];
    const panels = page.querySelectorAll(':scope > .tab-panel');
    let after = panels[panels.length - 1];
    const mine = TABS.map((T) => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn'; btn.dataset.tab = T.id; btn.textContent = T.label;
      bar.appendChild(btn);
      const panel = document.createElement('div');
      panel.className = 'tab-panel'; panel.id = 'tab-' + T.id; panel.innerHTML = T.html;
      if (after && after.nextSibling) page.insertBefore(panel, after.nextSibling); else page.appendChild(panel);
      after = panel;
      // Same switching behaviour as the existing tabs (the site's handlers were bound before these buttons existed).
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active'); panel.classList.add('active');
        if (history.replaceState) history.replaceState(null, '', '#' + T.id);
      });
      return { T, btn, panel };
    });
    // When one of the site's own tabs is clicked, its handler won't know about these panels — hide them.
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('.tab-btn');
      if (!b || mine.some((m) => m.btn === b)) return;
      mine.forEach((m) => { m.panel.classList.remove('active'); m.btn.classList.remove('active'); });
      if (mine.some((m) => location.hash === '#' + m.T.id) && history.replaceState) history.replaceState(null, '', location.pathname);
    });

    const wf = mine[0].panel;
    wf.addEventListener('click', onClick);
    wf.addEventListener('change', onChange);
    wf.addEventListener('input', onInput);
    mine[1].panel.addEventListener('click', (e) => onScaleClick('ciwa', e));
    mine[2].panel.addEventListener('click', (e) => onScaleClick('cows', e));
    render(); renderScale('ciwa'); renderScale('cows');
    const start = mine.find((m) => location.hash === '#' + m.T.id);
    if (start) start.btn.click();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
