/**
 * Assessment for the Class XI core workflow (V1): accounting equation → rules of debit and credit → journal → ledger → trial balance.
 * Scenario text comes from the legacy app's banks AFTER engine re-verification (banks/verify.ts); figures come from the engine.
 * Hindi (`hi`) is a DRAFT (see i18n/glossary-hi.ts). Legacy scene sentences have no reviewed Hindi version yet, so Hindi questions
 * built on them show the original English sentence in quotation marks — the instructions, options, hints and working are in Hindi.
 */
import { Ledger, Money, normalSide, starterChartClassXI, suspenseFromTrialBalance, type Side } from '../../engine/src';
import type { Distractor, Gen, Part } from './questions';
import { assessableBanks, parseImpact } from './banks/verify';
import { canonical, classify, type AccountClass } from './banks/accounts-xi';
import { TERM_HI, TYPE_HI, accountHi, hasAccountHi } from './i18n/glossary-hi';

const M = (n: number) => Money.rupees(n), R = (m: Money) => m.format(), ans = (m: Money) => m.toString();
const money = (label: string, answer: Money, marks = 1): Part => ({ label, kind: 'MONEY', answer: ans(answer), marks });
const choice = (label: string, options: readonly string[], answer: string, marks = 1): Part => ({ label, kind: 'CHOICE', options, answer, marks });
const BANKS = assessableBanks();
const single = <T extends { debit: string[]; credit: string[] }>(xs: T[]) => xs.filter(s => s.debit.length === 1 && s.credit.length === 1);
const M2 = single(BANKS.m2), M4 = single(BANKS.m4);

// ───── rule explanations (EN + HI) from the independent classification
const kind = (c: AccountClass): [string, string] =>
  c.eq === 'A' && c.sign === -1 ? ['a contra-asset (deducted from an asset)', 'प्रति-परिसंपत्ति (परिसंपत्ति से घटाया जाने वाला)']
    : c.note && /reduces sales/.test(c.note) ? ['a sales-return (deducted from sales)', 'विक्रय वापसी (विक्रय से घटाया जाने वाला)']
      : c.note && /reduces purchases/.test(c.note) ? ['a purchases-return (deducted from purchases)', 'क्रय वापसी (क्रय से घटाया जाने वाला)']
        : [`${/^[AEI]/.test(c.type) ? 'an' : 'a'} ${c.type === 'REVENUE' ? 'income' : c.type.toLowerCase()}`, TYPE_HI[c.type] ?? c.type];
export function ruleEn(name: string, side: Side): string {
  const c = classify(name)!, up = side === c.normal;
  return `${canonical(name)} is ${kind(c)[0]} account; it ${up ? 'increases' : 'decreases'} here, so it is ${side === 'DR' ? 'DEBITED' : 'CREDITED'}.`;
}
export function ruleHi(name: string, side: Side): string {
  const c = classify(name)!, up = side === c.normal;
  return `${accountHi(name)} एक ${kind(c)[1]} खाता है; इसमें ${up ? TERM_HI.increase : TERM_HI.decrease} हुई है, इसलिए इसे ${side === 'DR' ? TERM_HI.debit : TERM_HI.credit} किया जाता है।`;
}
const HINTS_EN = ['Name the two accounts and decide what each one is: asset, liability, capital, income or expense.', 'Assets, expenses and drawings increase on the DEBIT side; liabilities, capital and income increase on the CREDIT side. A decrease goes the other way.'];
const HINTS_HI = ['दोनों खातों के नाम लिखिए और तय कीजिए कि प्रत्येक क्या है: परिसंपत्ति, देयता, पूँजी, आय या व्यय।', 'परिसंपत्ति, व्यय और आहरण में वृद्धि नाम (Dr.) पक्ष में होती है; देयता, पूँजी और आय में वृद्धि जमा (Cr.) पक्ष में। कमी इसके विपरीत होती है।'];
const swap = (part: number, wrong: string, right: string, rightSide: Side): Distractor => ({ part, value: wrong, mistake: `You swapped the sides: ${canonical(wrong)} is on the other side of this entry.`, fix: ruleEn(right, rightSide) });

/** Rule-based "why is this wrong" for an account the student chose instead of the right one (handoff T0.6), from the independent classification. */
const FIXED = /^(Furniture|Machinery|Buildings?|Computer|Vehicle|Patents|Goodwill|Investments)$/;
const isPersonal = (n: string) => /Debtor|Creditor|^Bank( Loan| Overdraft)?$|^Cash at Bank$|^Capital$|^Drawings$|^Advance from Customer$/.test(canonical(n));
const isNominal = (n: string) => { const c = classify(n); return !!c && (c.type === 'EXPENSE' || c.type === 'REVENUE'); };
export function whyWrong(part: number, wrong: string, right: string, side: Side): Distractor {
  const w = canonical(wrong), rt = canonical(right), cw = classify(w), cr = classify(rt);
  const mistake =
    cr?.type === 'DRAWINGS' && cw?.type === 'EXPENSE' ? `Drawings are not a business expense: what the owner takes for personal use reduces capital, so it goes to Drawings, not ${w}.`
      : FIXED.test(rt) && w === 'Purchases' ? `“Purchases” means goods bought for RESALE. ${rt} bought for use in the business is an asset, so ${rt} Account is debited.`
        : (isPersonal(rt) && isNominal(w)) || (isNominal(rt) && isPersonal(w)) ? `${isPersonal(rt) ? rt : w} is a personal account (a person, firm or bank the business deals with); ${isPersonal(rt) ? w : rt} is a nominal account (an expense or income). This entry needs ${rt}.`
          : `This transaction does not change ${w}${cw ? ` (${kind(cw)[0]} account)` : ''}.`;
  return { part, value: w, mistake, fix: ruleEn(rt, side) };
}
const accountDistractors = (options: readonly string[], dr: string, cr: string, drPart: number, crPart: number): Distractor[] => [
  swap(drPart, cr, dr, 'DR'), swap(crPart, dr, cr, 'CR'),
  ...options.filter(o => o !== dr && o !== cr).flatMap(o => [whyWrong(drPart, o, dr, 'DR'), whyWrong(crPart, o, cr, 'CR')])];

// ───── impact options in Hindi (symbols and figures unchanged)
export const impactHi = (o: string) => o.replace(/No net change/g, 'कोई शुद्ध परिवर्तन नहीं').replace(/No change/g, 'कोई परिवर्तन नहीं').replace(/Assets?/g, 'परिसंपत्तियाँ').replace(/Liabilities|Liability/g, 'देयताएँ')
  .replace(/Capital/g, 'पूँजी').replace(/ and /g, ' और ').replace(/ by ([\d,]+)/g, ' $1 से');
const SIDE_WORD: Record<number, string> = { 0: 'what the business owns (assets)', 1: 'what it owes to outsiders (liabilities)', 2: "the owner's claim (capital: capital brought in, profit or loss, drawings)" };

// ───── ledger / trial-balance transaction templates on the starter chart (EN, HI)
export type Tx = { en: string; hi: string; dr: string; cr: string };
const TX: Tx[] = [
  { en: 'Bought machinery for cash', hi: 'नकद मशीनरी खरीदी', dr: 'machinery', cr: 'cash' }, { en: 'Cash sales', hi: 'नकद विक्रय', dr: 'cash', cr: 'sales' },
  { en: 'Purchased goods on credit', hi: 'उधार माल खरीदा', dr: 'purchases', cr: 'creditors' }, { en: 'Paid creditors in cash', hi: 'लेनदारों को नकद भुगतान', dr: 'creditors', cr: 'cash' },
  { en: 'Sold goods on credit', hi: 'उधार माल बेचा', dr: 'debtors', cr: 'sales' }, { en: 'Received cash from debtors', hi: 'देनदारों से रोकड़ प्राप्त', dr: 'cash', cr: 'debtors' },
  { en: 'Paid rent', hi: 'किराया चुकाया', dr: 'rent', cr: 'cash' }, { en: 'Paid salary', hi: 'वेतन चुकाया', dr: 'salary', cr: 'cash' },
  { en: 'Owner withdrew cash for personal use', hi: 'स्वामी ने निजी उपयोग के लिए रोकड़ निकाली', dr: 'drawings', cr: 'cash' }, { en: 'Deposited cash into the bank', hi: 'बैंक में रोकड़ जमा की', dr: 'bank', cr: 'cash' },
];
const FOCUS = ['cash', 'creditors', 'debtors'] as const;
const SIDE_ACCOUNTS = ['Cash', 'Machinery', 'Furniture', 'Debtors', 'Purchases', 'Rent Paid', 'Carriage Inwards', 'Bad Debts', 'Drawings', 'Creditors', 'Capital', 'Sales', 'Bank Loan', 'Commission Received', 'Interest Received', 'Bills Payable', 'Outstanding Salary', 'Discount Received'].filter(n => classify(n) && hasAccountHi(n));
/** A short business month posted through the engine; balances never go negative. */
export function month(r: { int: (a: number, b: number) => number; pick: <T>(x: readonly T[]) => T; multiple: (a: number, b: number, s: number) => number }, need?: string) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const l = new Ledger(starterChartClassXI()), lines: { tx: Tx | null; amount: number; day: number }[] = [];
    const start = r.multiple(50000, 150000, 10000);
    l.post({ date: '2026-04-01', narration: 'Capital introduced', lines: [{ accountId: 'cash', side: 'DR', amount: M(start) }, { accountId: 'capital', side: 'CR', amount: M(start) }] });
    lines.push({ tx: null, amount: start, day: 1 });
    const n = r.int(4, 6); let day = 2, ok = true;
    for (let k = 0; k < n; k++) {
      const involving = need ? TX.filter(t => t.dr === need || t.cr === need) : [];
      const tx = involving.length && r.int(0, 9) < 6 ? r.pick(involving) : r.pick(TX), amount = r.multiple(2000, 30000, 1000);   // bias towards the account being asked about
      l.post({ date: `2026-04-${String(day).padStart(2, '0')}`, narration: tx.en, lines: [{ accountId: tx.dr, side: 'DR', amount: M(amount) }, { accountId: tx.cr, side: 'CR', amount: M(amount) }] });
      if (['cash', 'bank', 'creditors', 'debtors'].some(a => l.balance(a).isNegative())) { ok = false; break; }
      lines.push({ tx, amount, day }); day += r.int(2, 5);
    }
    if (!ok) continue;
    if (need && l.tAccount(need).length < 3) continue;
    return { l, lines };
  }
  throw new Error('could not build a valid month');
}
const txEn = (x: { tx: Tx | null; amount: number; day: number }) => `${x.day} April: ${x.tx ? x.tx.en : 'Started business with cash (capital)'} ${R(M(x.amount))}`;
const txHi = (x: { tx: Tx | null; amount: number; day: number }) => `${x.day} अप्रैल: ${x.tx ? x.tx.hi : 'रोकड़ से व्यापार आरंभ किया (पूँजी)'} ${R(M(x.amount))}`;

export const V1_GENERATORS: readonly Gen[] = [
  // ── accounting equation: impact (Remembering & Understanding) — legacy m5 bank, independently re-verified
  {
    skill: 'eq-impact', clause: 'XI.2.equation', title: 'Effect of a transaction on the accounting equation', typology: 'RU',
    make: r => {
      const g = r.pick(BANKS.m5), right = g.options[g.answer]!, want = parseImpact(right)!;
      const distractors: Distractor[] = g.options.filter(o => o !== right).map(o => {
        const p = parseImpact(o), off = p ? [0, 1, 2].filter(k => p[k] !== want[k]) : [0, 1, 2];
        return { part: 0, value: o, mistake: `This option gets ${off.map(k => SIDE_WORD[k]).join(' and ')} wrong.`, fix: g.why };
      });
      return {
        stem: `${g.question.replace(/\s*Impact\?$/, '')} What is the effect on the accounting equation (Assets = Liabilities + Capital)?`,
        parts: [choice('Effect', g.options, right, 1)],
        hints: ['Ask: what does the business now own more or less of? Does it owe outsiders more or less? Has the owner’s claim changed (capital brought in, profit or loss, drawings)?', 'Every transaction keeps the equation balanced: if only one side changes, it changes in two opposite ways on that side.'],
        working: [g.why, `Answer: ${right}.`],
        distractors,
        hi: { stem: `लेन-देन (मूल अंग्रेज़ी में): “${g.question.replace(/\s*Impact\?$/, '')}” — लेखांकन समीकरण (परिसंपत्तियाँ = देयताएँ + पूँजी) पर क्या प्रभाव पड़ेगा?`, parts: ['प्रभाव'],
          hints: ['पूछिए: व्यवसाय के पास क्या अधिक या कम हुआ? बाहरी लोगों के प्रति देनदारी बढ़ी या घटी? स्वामी का दावा (पूँजी, लाभ या हानि, आहरण) बदला?', 'हर लेन-देन के बाद समीकरण संतुलित रहता है: यदि केवल एक पक्ष बदले, तो उसी पक्ष में दो विपरीत परिवर्तन होते हैं।'],
          working: [`उत्तर: ${impactHi(right)}।`], options: [g.options.map(impactHi)] },
      };
    },
  },
  // ── accounting equation: totals after several transactions (Applying) — legacy m1 templates, figures by the engine
  {
    skill: 'eq-balance', clause: 'XI.2.equation', title: 'Accounting equation after several transactions', typology: 'AP',
    make: r => {
      for (let attempt = 0; attempt < 300; attempt++) {
        const start = r.multiple(50000, 200000, 10000), bal: Record<string, number> = { Cash: start, Capital: start };
        const steps: { label: string; amount: number; cost?: number; sale: boolean; reduceC: number }[] = [];
        let ok = true;
        for (let k = 0; k < 3 && ok; k++) {
          const t = r.pick(BANKS.m1), amount = r.multiple(2000, 20000, 1000), sale = !!t.costEffectPer1000, cost = sale ? amount - r.multiple(500, Math.max(500, amount / 2), 500) : 0;
          const eff: Record<string, number> = {};
          for (const [a, d] of Object.entries(t.effectPer1000)) eff[a] = (eff[a] ?? 0) + (d * amount) / 1000;
          for (const [a, d] of Object.entries(t.costEffectPer1000 ?? {})) eff[a] = (eff[a] ?? 0) + (d * cost) / 1000;
          const next = { ...bal }; for (const [a, d] of Object.entries(eff)) next[a] = (next[a] ?? 0) + d;
          if (Object.entries(next).some(([a, v]) => a !== 'P&L Profit' && v < 0)) { ok = false; break; }
          const reduceC = Object.entries(eff).reduce((s, [a, d]) => { const c = classify(a)!; return c.eq === 'C' && c.sign * d < 0 ? s - c.sign * d : s; }, 0);
          Object.assign(bal, next); steps.push({ label: t.label.replace(/^\d+\.\s*/, ''), amount, ...(sale ? { cost } : {}), sale, reduceC });
        }
        if (!ok || steps.length < 3) continue;
        const tot = { A: 0, L: 0, C: 0 }; for (const [a, v] of Object.entries(bal)) { const c = classify(a)!; tot[c.eq] += c.sign * v; }
        if (tot.A !== tot.L + tot.C) throw new Error('equation does not balance');                       // invariant, enforced by tests
        const saleCost = steps.filter(s => s.sale).reduce((s, x) => s + x.cost!, 0), reductions = steps.reduce((s, x) => s + x.reduceC, 0);
        const distractors: Distractor[] = saleCost ? [{ part: 1, value: ans(M(tot.C + saleCost)), mistake: 'You added the whole sale price to capital.', fix: 'Only the profit (sale price − cost of the goods sold) increases capital; the cost leaves as stock.' }]
          : reductions ? [{ part: 1, value: ans(M(tot.C + reductions)), mistake: 'You did not reduce capital for expenses, losses or drawings.', fix: 'Expenses, losses and drawings reduce the owner’s claim (capital).' }] : [];
        const list = steps.map((s, k) => `${k + 1}. ${s.label}: ${R(M(s.amount))}${s.sale ? ` (cost of the goods ${R(M(s.cost!))})` : ''}`);
        return {
          stem: `A business starts with ${R(M(start))} cash brought in by the owner as capital. Then:\n${list.join('\n')}\nFind the total assets and the capital (including profit, less drawings) after these transactions.`,
          parts: [money('Total assets', M(tot.A)), money('Capital', M(tot.C))],
          hints: ['Work through the transactions one at a time and keep a running list of every asset, every liability and capital.', 'A sale: cash or debtors go up by the SELLING price, stock goes down by the COST, and capital goes up only by the difference (profit).'],
          working: [`Start: assets ${R(M(start))} = capital ${R(M(start))}`, ...steps.map((s, k) => `${k + 1}. ${s.label}`), `End: assets ${R(M(tot.A))} = liabilities ${R(M(tot.L))} + capital ${R(M(tot.C))}`],
          distractors,
          hi: { stem: `एक व्यवसाय ${R(M(start))} की रोकड़ से आरंभ होता है जो स्वामी पूँजी के रूप में लाता है। फिर (लेन-देन मूल अंग्रेज़ी में):\n${list.join('\n')}\nइन लेन-देनों के बाद कुल परिसंपत्तियाँ और पूँजी (लाभ सहित, आहरण घटाकर) ज्ञात कीजिए।`, parts: ['कुल परिसंपत्तियाँ', 'पूँजी'],
            hints: ['लेन-देनों को एक-एक करके हल कीजिए और हर परिसंपत्ति, देयता और पूँजी की चालू सूची रखिए।', 'विक्रय में: रोकड़ या देनदार विक्रय मूल्य से बढ़ते हैं, स्टॉक लागत से घटता है, और पूँजी केवल अंतर (लाभ) से बढ़ती है।'],
            working: [`आरंभ: परिसंपत्तियाँ ${R(M(start))} = पूँजी ${R(M(start))}`, `अंत: परिसंपत्तियाँ ${R(M(tot.A))} = देयताएँ ${R(M(tot.L))} + पूँजी ${R(M(tot.C))}`] },
        };
      }
      throw new Error('eq-balance: no valid sequence');
    },
  },
  // ── rules of debit and credit (Remembering & Understanding) — legacy m2 bank
  {
    skill: 'drcr-choose', clause: 'XI.2.rules', title: 'Which account is debited and which credited?', typology: 'RU',
    make: r => {
      const s = r.pick(M2), dr = canonical(s.debit[0]!), cr = canonical(s.credit[0]!), options = s.pool.map(p => canonical(p.account));
      return {
        stem: `${s.text} Which account is debited and which is credited?`,
        parts: [choice('Account to debit', options, dr), choice('Account to credit', options, cr)],
        hints: HINTS_EN, working: [ruleEn(dr, 'DR'), ruleEn(cr, 'CR')],
        distractors: accountDistractors(options, dr, cr, 0, 1),
        hi: { stem: `लेन-देन (मूल अंग्रेज़ी में): “${s.text}” — किस खाते को ${TERM_HI.debit} और किसे ${TERM_HI.credit} किया जाएगा?`, parts: [`${TERM_HI.debitWord} किया जाने वाला खाता`, `${TERM_HI.creditWord} किया जाने वाला खाता`],
          hints: HINTS_HI, working: [ruleHi(dr, 'DR'), ruleHi(cr, 'CR')], options: [options.map(accountHi), options.map(accountHi)] },
      };
    },
  },
  // ── journal entry (Applying) — legacy m4 bank
  {
    skill: 'journal-entry', clause: 'XI.2.journal', title: 'Journal entry for a transaction', typology: 'AP',
    make: r => {
      const s = r.pick(M4), dr = canonical(s.debit[0]!), cr = canonical(s.credit[0]!), options = s.pool.map(canonical);
      return {
        stem: `Pass the journal entry: ${s.text}`,
        parts: [choice('Debit (Dr.)', options, dr), choice('Credit (Cr.) — “To …”', options, cr), money('Amount', M(s.amount))],
        hints: HINTS_EN,
        working: [`${dr} A/c  Dr.  ${R(M(s.amount))}`, `    To ${cr} A/c  ${R(M(s.amount))}`, ruleEn(dr, 'DR'), ruleEn(cr, 'CR')],
        distractors: accountDistractors(options, dr, cr, 0, 1),
        hi: { stem: `रोज़नामचा प्रविष्टि कीजिए (लेन-देन मूल अंग्रेज़ी में): “${s.text}”`, parts: [TERM_HI.debit, `${TERM_HI.credit} — “To …”`, 'राशि'],
          hints: HINTS_HI, working: [`${accountHi(dr)} खाता  नाम  ${R(M(s.amount))}`, `    ${accountHi(cr)} खाते से  ${R(M(s.amount))}`, ruleHi(dr, 'DR'), ruleHi(cr, 'CR')], options: [options.map(accountHi), options.map(accountHi), undefined] },
      };
    },
  },
  // ── ledger posting and balancing (Applying) — postings and balances computed by the engine Ledger
  {
    skill: 'ledger-balance', clause: 'XI.2.ledger', title: 'Post to the ledger and find the balance', typology: 'AP',
    make: r => {
      const focus = r.pick(FOCUS), { l, lines } = month(r, focus), acct = l.chart.get(focus), bal = l.balance(focus);
      const nat = normalSide(acct.type), side: Side = bal.isNegative() ? (nat === 'DR' ? 'CR' : 'DR') : nat;
      const rows = l.tAccount(focus), drTotal = Money.sum(rows.filter(x => x.side === 'DR').map(x => x.amount)), crTotal = Money.sum(rows.filter(x => x.side === 'CR').map(x => x.amount));
      const SIDES = ['Debit balance', 'Credit balance'], right = side === 'DR' ? SIDES[0]! : SIDES[1]!;
      const bigger = drTotal.cmp(crTotal) >= 0 ? drTotal : crTotal;
      return {
        stem: `Post these transactions to the ${acct.name} Account and balance it at the end of the month:\n${lines.map(txEn).join('\n')}`,
        parts: [money(`Closing balance of ${acct.name} Account`, bal.abs()), choice('Nature of the balance', SIDES, right)],
        hints: [`Only the transactions that involve ${acct.name} are posted to its account; each goes to the side on which ${acct.name} was debited or credited in the journal.`, 'Total each side; the balance is the difference, and it is a debit balance if the debit side is bigger.'],
        working: [...rows.map(x => `${x.date}: ${x.side === 'DR' ? 'Dr' : 'Cr'} ${R(x.amount)} → balance ${R(x.running.abs())}`), `Debit total ${R(drTotal)}, credit total ${R(crTotal)} ⇒ ${right.toLowerCase()} of ${R(bal.abs())}`],
        distractors: [...(!bigger.equals(bal.abs()) ? [{ part: 0, value: ans(bigger), mistake: 'You took the total of one side instead of the difference between the two sides.', fix: 'Balance = bigger side total − smaller side total.' }] : []),
          { part: 1, value: right === SIDES[0] ? SIDES[1]! : SIDES[0]!, mistake: 'The balance is named after the side that is BIGGER.', fix: '“Balance c/d” is written on the smaller side to make the totals agree, but the account has a balance on the bigger side.' }],
        hi: { stem: `इन लेन-देनों की ${accountHi(acct.name)} खाते में खतौनी कीजिए और माह के अंत में खाते का शेष निकालिए:\n${lines.map(txHi).join('\n')}`, parts: [`${accountHi(acct.name)} खाते का अंतिम शेष`, 'शेष की प्रकृति'],
          hints: [`केवल वही लेन-देन जिनमें ${accountHi(acct.name)} शामिल है, इस खाते में लिखे जाते हैं।`, 'दोनों पक्षों का योग कीजिए; शेष दोनों का अंतर है, और यदि नाम पक्ष बड़ा है तो यह नाम शेष है।'],
          working: [`नाम पक्ष का योग ${R(drTotal)}, जमा पक्ष का योग ${R(crTotal)} ⇒ ${side === 'DR' ? 'नाम शेष' : 'जमा शेष'} ${R(bal.abs())}`], options: [undefined, ['नाम शेष', 'जमा शेष']] },
      };
    },
  },
  // ── trial balance that does not agree (Analysing) — totals and suspense by the engine
  {
    skill: 'tb-agree', clause: 'XI.2.tb', title: 'Why does the trial balance not agree?', typology: 'AEC',
    make: r => {
      const { l } = month(r), tb = l.trialBalance(), rows = tb.rows.filter(x => !x.debit.isZero() || !x.credit.isZero());
      const victim = r.pick(rows), wrongSide = r.int(0, 1) === 0, amt = victim.debit.isZero() ? victim.credit : victim.debit, wasDr = !victim.debit.isZero();
      let dr = tb.totalDebit, cr = tb.totalCredit;
      if (wrongSide) { if (wasDr) { dr = dr.sub(amt); cr = cr.add(amt); } else { cr = cr.sub(amt); dr = dr.add(amt); } } else { if (wasDr) dr = dr.sub(amt); else cr = cr.sub(amt); }
      const s = suspenseFromTrialBalance(dr, cr)!, SIDES = ['Debit side', 'Credit side'], right = s.side === 'DR' ? SIDES[0]! : SIDES[1]!;
      const shown = rows.map(x => { const own = x === victim; if (!own) return `${x.account.name}: ${x.debit.isZero() ? `Cr ${R(x.credit)}` : `Dr ${R(x.debit)}`}`; return wrongSide ? `${x.account.name}: ${wasDr ? `Cr ${R(amt)}` : `Dr ${R(amt)}`}` : null; }).filter(Boolean) as string[];
      return {
        stem: `A student prepared this trial balance from correct ledger balances but made ONE mistake while copying:\n${shown.join('\n')}\nTotals: Dr ${R(dr)}, Cr ${R(cr)}. Find the amount that must be placed in a Suspense Account and its side.`,
        parts: [money('Suspense account amount', s.amount), choice('Suspense account goes on the', SIDES, right)],
        hints: ['The suspense account makes the two totals equal, so it is the difference between them.', 'It goes on the side whose total is SMALLER.'],
        working: [`Debit total ${R(dr)} − credit total ${R(cr)} = ${R(dr.sub(cr).abs())}`, `Smaller side: ${right.toLowerCase()} ⇒ Suspense ${R(s.amount)} on the ${right.toLowerCase()}.`,
          wrongSide ? `Cause: ${victim.account.name} (${R(amt)}) was written on the wrong side, which moves BOTH totals — the difference is twice the amount.` : `Cause: ${victim.account.name} (${R(amt)}) was left out.`],
        distractors: [...(wrongSide ? [{ part: 0, value: ans(amt), mistake: 'A balance written on the wrong side changes BOTH totals.', fix: 'The difference is twice the amount of that balance.' }] : []),
          { part: 1, value: right === SIDES[0] ? SIDES[1]! : SIDES[0]!, mistake: 'The suspense account is placed on the side that is SHORT.', fix: 'Add the difference to the smaller total so that both totals agree.' }],
        hi: { stem: `एक विद्यार्थी ने सही खाता-बही शेषों से यह तलपट बनाया, पर नकल करते समय एक गलती हो गई:\n${shown.map(x => { const [n, v] = x.split(': '); return `${accountHi(n!)}: ${v!.replace(/^Dr/, 'नाम').replace(/^Cr/, 'जमा')}`; }).join('\n')}\nयोग: नाम ${R(dr)}, जमा ${R(cr)}। उचंत खाते में रखी जाने वाली राशि और उसका पक्ष ज्ञात कीजिए।`, parts: ['उचंत खाते की राशि', 'उचंत खाता किस पक्ष में'],
          hints: ['उचंत खाता दोनों योगों को बराबर करता है, इसलिए यह उनका अंतर है।', 'यह उस पक्ष में जाता है जिसका योग कम है।'],
          working: [`नाम योग ${R(dr)} और जमा योग ${R(cr)} का अंतर = ${R(dr.sub(cr).abs())}`, `कम योग वाला पक्ष: ${s.side === 'DR' ? 'नाम' : 'जमा'} ⇒ उचंत ${R(s.amount)}`], options: [undefined, ['नाम पक्ष', 'जमा पक्ष']] },
      };
    },
  },
  // ── on which side does an account's balance appear (Remembering & Understanding) — normal balances from the independent classification
  ...([
    { skill: 'ledger-side', clause: 'XI.2.ledger', title: 'On which side does a ledger balance normally appear?', where: 'in its ledger account', whereHi: 'अपने खाताबही खाते में' },
    { skill: 'tb-side', clause: 'XI.2.tb', title: 'Which trial-balance column does an account fall in?', where: 'in the trial balance', whereHi: 'तलपट में' },
  ] as const).map(def => ({
    skill: def.skill, clause: def.clause, title: def.title, typology: 'RU' as const,
    make: (r: { pick: <T>(x: readonly T[]) => T }) => {
      const name = r.pick(SIDE_ACCOUNTS), c = classify(name)!, SIDES = ['Debit side', 'Credit side'], right = c.normal === 'DR' ? SIDES[0]! : SIDES[1]!, other = right === SIDES[0] ? SIDES[1]! : SIDES[0]!;
      return {
        stem: `${def.skill === 'tb-side' ? 'In which column of the trial balance does' : 'On which side does'} the closing balance of ${name} Account normally appear${def.skill === 'tb-side' ? '' : ' ' + def.where}?`,
        parts: [choice('Side', SIDES, right)],
        hints: [`First decide what kind of account ${name} is: ${kind(c)[0]}.`, 'Assets, expenses and drawings have DEBIT balances; liabilities, capital and income have CREDIT balances (contra-accounts the opposite of the item they reduce).'],
        working: [`${canonical(name)} is ${kind(c)[0]} account.`, `Its balance is normally on the ${right.toLowerCase()}.`],
        distractors: [{ part: 0, value: other, mistake: `The balance of ${canonical(name)} is not on the ${other.toLowerCase()}.`, fix: `${canonical(name)} is ${kind(c)[0]} account, so its balance is on the ${right.toLowerCase()}.` }],
        hi: { stem: `${accountHi(name)} खाते का अंतिम शेष सामान्यतः ${def.skill === 'tb-side' ? 'तलपट के किस स्तंभ में आता है' : `${def.whereHi} किस पक्ष में आता है`}?`, parts: ['पक्ष'], hints: [`पहले तय कीजिए कि ${accountHi(name)} किस प्रकार का खाता है।`, 'परिसंपत्ति, व्यय और आहरण के शेष नाम पक्ष में तथा देयता, पूँजी और आय के शेष जमा पक्ष में होते हैं।'],
          working: [`${accountHi(name)} एक ${kind(c)[1]} खाता है।`, `इसका शेष सामान्यतः ${c.normal === 'DR' ? 'नाम पक्ष' : 'जमा पक्ष'} में होता है।`], options: [['नाम पक्ष', 'जमा पक्ष']] },
      };
    },
  })),
  // ── find the error in a journal entry (Analysing) — legacy m4 scenes; the wrong entry is built deliberately
  {
    skill: 'journal-error', clause: 'XI.2.journal', title: 'Is this journal entry correct? If not, what is wrong?', typology: 'AEC',
    make: r => {
      const s = r.pick(M4), dr = canonical(s.debit[0]!), cr = canonical(s.credit[0]!), pool = s.pool.map(canonical), amt = R(M(s.amount));
      const others = pool.filter(o => o !== dr && o !== cr), v = others.length ? r.int(0, 2) : r.int(0, 1);
      const shownDr = v === 1 ? cr : v === 2 ? r.pick(others) : dr, shownCr = v === 1 ? dr : cr;
      const KINDS = ['The entry is correct', 'Debit and credit are interchanged', 'A wrong account has been used'], right = KINDS[v]!;
      return {
        stem: `Transaction: ${s.text}\nA student wrote:\n${shownDr} A/c  Dr.  ${amt}\n    To ${shownCr} A/c  ${amt}\nWhat is the position?`,
        parts: [choice('Verdict', KINDS, right), choice('Correct account to debit', pool, dr)],
        hints: HINTS_EN, working: [`${dr} A/c  Dr.  ${amt}`, `    To ${cr} A/c  ${amt}`, ruleEn(dr, 'DR'), ruleEn(cr, 'CR')],
        distractors: [...KINDS.filter(k => k !== right).map(k => ({ part: 0, value: k, mistake: `Check each account against its rule: ${k.toLowerCase()} is not what happened here.`, fix: right === KINDS[0] ? 'Both accounts and both sides agree with the rules, so the entry is correct.' : `${ruleEn(dr, 'DR')} ${ruleEn(cr, 'CR')}` })),
          ...pool.filter(o => o !== dr).map(o => whyWrong(1, o, dr, 'DR'))],
        hi: { stem: `लेन-देन (मूल अंग्रेज़ी में): “${s.text}”\nएक विद्यार्थी ने लिखा:\n${accountHi(shownDr)} खाता  नाम  ${amt}\n    ${accountHi(shownCr)} खाते से  ${amt}\nस्थिति क्या है?`, parts: ['निर्णय', `${TERM_HI.debit} किया जाने वाला सही खाता`],
          hints: HINTS_HI, working: [`${accountHi(dr)} खाता  नाम  ${amt}`, `    ${accountHi(cr)} खाते से  ${amt}`, ruleHi(dr, 'DR'), ruleHi(cr, 'CR')],
          options: [['प्रविष्टि सही है', 'नाम और जमा आपस में बदल गए हैं', 'गलत खाते का प्रयोग हुआ है'], pool.map(accountHi)] },
      };
    },
  },
  // ── a short case with linked parts (Analysing / Evaluating) — everything computed by the engine
  {
    skill: 'case-ledger', clause: 'XI.2.ledger', title: 'Case: a month of transactions, the ledger and the trial balance', typology: 'AEC',
    make: r => {
      const { l, lines } = month(r, 'cash'), tb = l.trialBalance(), bal = l.balance('cash'), biggest = lines.filter(x => x.tx).reduce((a, b) => (b.amount > a.amount ? b : a));
      const SIDES = ['Debit total is larger', 'Credit total is larger', 'The two totals agree'];
      return {
        stem: `Meera starts a small shop and records these transactions in April:\n${lines.map(txEn).join('\n')}\nAnswer the linked questions about her books.`,
        parts: [money('Closing balance of Cash Account', bal.abs()), money('Total of the debit column of the trial balance', tb.totalDebit), choice('Comparing the two trial-balance totals', SIDES, SIDES[2]!)],
        hints: ['Cash is debited when it comes in and credited when it goes out; balance it as an ordinary account.', 'The trial balance lists every closing balance; if every entry was posted on both sides, the totals must agree.'],
        working: [`Cash closing balance = ${R(bal.abs())}`, `Trial balance totals: Dr ${R(tb.totalDebit)}, Cr ${R(tb.totalCredit)} — they agree because every journal entry has equal debit and credit.`, `Largest single transaction: ${biggest.tx!.en} (${R(M(biggest.amount))}).`],
        distractors: [{ part: 2, value: SIDES[0]!, mistake: 'If every entry is posted to both a debit and a credit account, the totals cannot differ.', fix: 'Double entry: equal debits and credits, so the trial balance agrees; a difference would signal an error.' },
          { part: 2, value: SIDES[1]!, mistake: 'If every entry is posted to both a debit and a credit account, the totals cannot differ.', fix: 'Double entry: equal debits and credits, so the trial balance agrees; a difference would signal an error.' }],
        hi: { stem: `मीरा एक छोटी दुकान आरंभ करती है और अप्रैल में ये लेन-देन लिखती है:\n${lines.map(txHi).join('\n')}\nउसकी बहियों से जुड़े प्रश्नों के उत्तर दीजिए।`, parts: ['रोकड़ खाते का अंतिम शेष', 'तलपट के नाम स्तंभ का योग', 'तलपट के दोनों योगों की तुलना'],
          hints: ['रोकड़ आने पर नाम और जाने पर जमा होती है; इसे सामान्य खाते की तरह संतुलित कीजिए।', 'यदि प्रत्येक प्रविष्टि दोनों पक्षों में लिखी गई है तो तलपट के योग बराबर होंगे।'],
          working: [`रोकड़ का अंतिम शेष ${R(bal.abs())}`, `तलपट: नाम ${R(tb.totalDebit)}, जमा ${R(tb.totalCredit)} — दोनों बराबर हैं क्योंकि हर प्रविष्टि में नाम और जमा बराबर होते हैं।`], options: [undefined, undefined, ['नाम योग बड़ा है', 'जमा योग बड़ा है', 'दोनों योग बराबर हैं']] },
      };
    },
  },
];

/**
 * Verified single-debit/single-credit scenes from the legacy m2 bank whose two accounts exist in the given chart (matched by name).
 * Used by the Debit & Credit Trainer so it draws on the migrated, engine-checked bank (handoff T0.5 UI parity).
 */
export function migratedTrainerScenes(chart: readonly { id: string; name: string }[]): { text: string; dr: string; cr: string; why: string }[] {
  const byName = new Map(chart.map(a => [a.name.toLowerCase(), a.id]));
  const out: { text: string; dr: string; cr: string; why: string }[] = [];
  for (const sc of M2) {
    const dn = canonical(sc.debit[0]!), cn = canonical(sc.credit[0]!), dr = byName.get(dn.toLowerCase()), cr = byName.get(cn.toLowerCase());
    if (dr && cr && dr !== cr) out.push({ text: sc.text, dr, cr, why: `${ruleEn(dn, 'DR')} ${ruleEn(cn, 'CR')}` });
  }
  return out;
}
