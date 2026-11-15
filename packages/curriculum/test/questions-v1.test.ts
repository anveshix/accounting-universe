import { describe, expect, it } from 'vitest';
import { SKILLS, checkAnswer, makeQuestion, type Question } from '../src';

const V1 = ['XI.2.equation', 'XI.2.rules', 'XI.2.journal', 'XI.2.ledger', 'XI.2.tb'];
const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);
const qs = (skill: string): Question[] => SEEDS.map(s => makeQuestion(skill, s));
const rupees = (s: string) => Number(s.replace(/[₹,]/g, '').replace(/\.$/, ''));

describe('V1 coverage', () => {
  it('every Class XI core topic now has at least one practice skill', () => { for (const c of V1) expect(SKILLS.some(s => s.clause === c), c).toBe(true); });
  it('V1 assessment spans all three CBSE typology bands', () => {
    expect(new Set(SKILLS.filter(s => V1.includes(s.clause)).map(s => s.typology))).toEqual(new Set(['RU', 'AP', 'AEC']));
  });
  it('every skill carries a typology tag', () => { for (const s of SKILLS) expect(['RU', 'AP', 'AEC'], s.skill).toContain(s.typology); });
});

describe('CHOICE parts', () => {
  it('the answer is one of the options; any other option or a non-option is marked wrong; case and spacing are ignored', () => {
    for (const skill of ['eq-impact', 'drcr-choose', 'journal-entry', 'ledger-balance', 'tb-agree'])
      for (const q of qs(skill)) for (const p of q.parts.filter(x => x.kind === 'CHOICE')) {
        expect(p.options, q.id).toContain(p.answer);
        expect(checkAnswer(p, `  ${p.answer.toUpperCase()} `)).toBe(true);
        for (const o of p.options!.filter(o => o !== p.answer)) expect(checkAnswer(p, o), `${q.id} ${o}`).toBe(false);
        expect(checkAnswer(p, 'not an option')).toBe(false);
      }
  });
});

describe('independent oracles (recomputed from the question text, not from the engine)', () => {
  // the test's own reading of each transaction: [account debited, account credited]
  const READ: Record<string, [string, string]> = {
    'Started business with cash (capital)': ['Cash', 'Capital'], 'Bought machinery for cash': ['Machinery', 'Cash'], 'Cash sales': ['Cash', 'Sales'],
    'Purchased goods on credit': ['Purchases', 'Creditors'], 'Paid creditors in cash': ['Creditors', 'Cash'], 'Sold goods on credit': ['Debtors', 'Sales'],
    'Received cash from debtors': ['Cash', 'Debtors'], 'Paid rent': ['Rent', 'Cash'], 'Paid salary': ['Salary', 'Cash'],
    'Owner withdrew cash for personal use': ['Drawings', 'Cash'], 'Deposited cash into the bank': ['Bank', 'Cash'],
  };
  const NORMAL: Record<string, 'Debit balance' | 'Credit balance'> = { Cash: 'Debit balance', Debtors: 'Debit balance', Creditors: 'Credit balance' };
  it('ledger-balance: balance and its nature agree with hand arithmetic for 200 questions', () => {
    for (const q of qs('ledger-balance')) {
      const acct = /to the (\w+) Account/.exec(q.stem)![1]!;
      let dr = 0, cr = 0;
      for (const line of q.stem.split('\n').slice(1)) {
        const m = /^\d+ April: (.+) (₹[\d,.]+)$/.exec(line)!; const [d, c] = READ[m[1]!]!; const amt = rupees(m[2]!);
        if (d === acct) dr += amt; if (c === acct) cr += amt;
      }
      const bal = Math.abs(dr - cr), nature = dr === cr ? NORMAL[acct] : dr > cr ? 'Debit balance' : 'Credit balance';
      expect(rupees(q.parts[0]!.answer), q.id).toBe(bal);
      if (bal) expect(q.parts[1]!.answer, q.id).toBe(nature);
    }
  });
  it('tb-agree: the printed totals add up, and the suspense is their difference on the short side', () => {
    let wrongSide = 0;
    for (const q of qs('tb-agree')) {
      const lines = q.stem.split('\n').filter(l => /: (Dr|Cr) ₹/.test(l) && !l.startsWith('Totals'));
      const dr = lines.filter(l => /: Dr/.test(l)).reduce((s, l) => s + rupees(l.split(' ').pop()!), 0), cr = lines.filter(l => /: Cr/.test(l)).reduce((s, l) => s + rupees(l.split(' ').pop()!), 0);
      const m = /Totals: Dr (₹[\d,]+\.\d\d), Cr (₹[\d,]+\.\d\d)/.exec(q.stem)!;
      expect([dr, cr], q.id).toEqual([rupees(m[1]!), rupees(m[2]!)]);
      expect(rupees(q.parts[0]!.answer), q.id).toBe(Math.abs(dr - cr));
      expect(q.parts[1]!.answer, q.id).toBe(dr < cr ? 'Debit side' : 'Credit side');
      if (q.working.some(w => /twice/.test(w))) wrongSide++;
    }
    expect(wrongSide).toBeGreaterThan(30);                         // both kinds of copying error are generated
  });
  it('eq-balance: the closing equation balances and matches the answers', () => {
    for (const q of qs('eq-balance')) {
      const m = /End: assets (₹[\d,.-]+) = liabilities (₹[\d,.-]+) \+ capital (-?₹[\d,.-]+)/.exec(q.working.at(-1)!)!;
      const [a, l, c] = [m[1]!, m[2]!, m[3]!].map(x => Number(x.replace(/[₹,]/g, '')));
      expect(a, q.id).toBeCloseTo(l! + c!, 2); expect(rupees(q.parts[0]!.answer)).toBe(a); expect(Number(q.parts[1]!.answer)).toBe(c);
    }
  });
  it('drcr-choose / journal-entry: the debit and credit accounts are never the same, and swapping them is caught as a mistake', () => {
    for (const skill of ['drcr-choose', 'journal-entry']) for (const q of qs(skill)) {
      expect(q.parts[0]!.answer).not.toBe(q.parts[1]!.answer);
      expect(q.distractors.some(d => d.part === 0 && d.value === q.parts[1]!.answer && /swapped/.test(d.mistake)), q.id).toBe(true);
    }
  });
});

describe('Hindi (draft) for V1 questions', () => {
  const DEV = /[ऀ-ॿ]/;
  it('every V1 question has a Hindi stem, part labels, hints and working, aligned with the English', () => {
    for (const s of SKILLS.filter(x => V1.includes(x.clause))) for (const q of qs(s.skill).slice(0, 40)) {
      const hi = q.hi!; expect(hi, q.id).toBeTruthy();
      expect(DEV.test(hi.stem), q.id).toBe(true); expect(hi.parts.length).toBe(q.parts.length);
      for (const p of hi.parts) expect(DEV.test(p), `${q.id} part`).toBe(true);
      expect(hi.hints.length).toBe(q.hints.length); for (const h of hi.hints) expect(DEV.test(h)).toBe(true);
      expect(hi.working.length).toBeGreaterThan(0);
      q.parts.forEach((p, k) => { if (p.kind === 'CHOICE' && hi.options?.[k]) expect(hi.options[k]!.length, q.id).toBe(p.options!.length); });
    }
  });
});

describe('rule-based feedback for every wrong account choice (T0.6)', () => {
  const ACCOUNT_SKILLS = ['drcr-choose', 'journal-entry'];
  it('every wrong option on the Dr and Cr parts has its own explanation and a rule-based fix', () => {
    for (const skill of ACCOUNT_SKILLS) for (const q of qs(skill)) for (const k of [0, 1]) {
      const p = q.parts[k]!;
      for (const o of p.options!.filter(o => o !== p.answer)) {
        const d = q.distractors.find(x => x.part === k && checkAnswer({ ...p, answer: x.value }, o));
        expect(d, `${q.id} part ${k} option ${o}`).toBeDefined();
        expect(d!.fix, q.id).toMatch(/(DEBITED|CREDITED)\.$/);
      }
      // no distractor ever equals the right answer
      expect(q.distractors.some(x => x.part === k && x.value === p.answer), q.id).toBe(false);
    }
  });
  const all = ACCOUNT_SKILLS.flatMap(skill => Array.from({ length: 600 }, (_, i) => makeQuestion(skill, i + 1)));
  const said = (re: RegExp) => all.flatMap(q => q.distractors).filter(d => re.test(d.mistake));
  it('names the classic mistakes: drawings as an expense, furniture as purchases, personal vs nominal, sides swapped', () => {
    const drawings = said(/^Drawings are not a business expense/), furniture = said(/^“Purchases” means goods bought for RESALE/), personal = said(/is a personal account .* is a nominal account/), swapped = said(/^You swapped the sides/);
    expect(swapped.length).toBeGreaterThan(0);
    expect(personal.length).toBeGreaterThan(0);
    expect(drawings.length, 'drawings-as-expense').toBeGreaterThan(0);
    expect(furniture.length, 'furniture-as-purchases').toBeGreaterThan(0);
  });
  it('a hand-checked case: Drawings chosen correctly over Salary', () => {
    const q = all.find(x => x.parts[0]!.answer === 'Drawings' && x.parts[0]!.options!.some(o => /Salar|Rent|Wages/.test(o)));
    if (!q) return;   // documented: depends on the migrated bank
    const o = q.parts[0]!.options!.find(o => /Salar|Rent|Wages/.test(o))!;
    expect(q.distractors.find(d => d.part === 0 && d.value === o)!.mistake).toMatch(/^Drawings are not a business expense/);
  });
});
