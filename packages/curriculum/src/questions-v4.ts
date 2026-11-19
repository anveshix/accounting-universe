/**
 * V4: Class XI deepening, chapter by chapter, from foundation to "mastermind" level.
 *  - concept banks for the chapters that only had calculations (books, trial balance, cash book, subsidiary books, reserves, error types, depreciation, incomplete records);
 *  - spot-the-error journal items and assertion-reason banks (higher-order);
 *  - multi-step full problems: petty cash, overdraft BRS, machinery account with a mid-year purchase, final accounts from a trial balance, discount on debtors, credit purchases, abnormal loss.
 * Every figure is integer arithmetic on the generated rupees; oracles are in test/questions-v4.test.ts.
 */
import { Money } from '../../engine/src';
import type { Distractor, Gen, Part, Typology } from './questions';
import type { Rng } from './rng';

const M = (n: number) => Money.rupees(n), R = (n: number) => M(n).format().replace(/\.00$/, ''), A = (n: number) => M(n).toString();
const step = (label: string, n: number): Part => ({ label, kind: 'MONEY', answer: A(n), marks: 1 });
const dist = (part: number, n: number, mistake: string, fix: string): Distractor => ({ part, value: A(n), mistake, fix });
const HINTS_STEP = ['Do the steps in order: each step uses the result of the one before it.', 'Write the formula for each step first, then put the figures in.'];
function shuffle<T>(r: Rng, xs: readonly T[]): T[] { const o = [...xs]; for (let i = o.length - 1; i > 0; i--) { const j = r.int(0, i), t = o[i]!; o[i] = o[j]!; o[j] = t; } return o; }

// ───────────────────────────── multi-step full problems ─────────────────────────────
const FULL: Gen[] = [
  {
    skill: 'petty-cash', clause: 'XI.2.cashbook', title: 'Petty cash book under the imprest system', typology: 'AP',
    make: r => {
      const imprest = r.multiple(5000, 12000, 1000), e = [r.multiple(200, 900, 100), r.multiple(200, 900, 100), r.multiple(200, 900, 100), r.multiple(200, 900, 100), r.multiple(200, 900, 100)], total = e.reduce((a, b) => a + b, 0);
      return {
        stem: `The imprest of the petty cashier is ${R(imprest)}. During the week he paid: stationery ${R(e[0]!)}, postage ${R(e[1]!)}, conveyance ${R(e[2]!)}, refreshments ${R(e[3]!)} and sundry expenses ${R(e[4]!)}. Find the total expenses, the balance left with him at the end of the week and the amount the head cashier must give him to restore the imprest.`,
        parts: [step('Step 1: total expenses of the week', total), step('Step 2: balance in hand at the end of the week', imprest - total), step('Step 3: amount to be received to restore the imprest', total)],
        hints: HINTS_STEP, working: [`Total = ${e.map(R).join(' + ')} = ${R(total)}`, `Balance = ${R(imprest)} − ${R(total)} = ${R(imprest - total)}`, `To restore the imprest he gets back exactly what he spent: ${R(total)}`],
        distractors: [dist(2, imprest, 'You gave the whole imprest again.', 'Only the amount spent is reimbursed; the balance in hand is already with him.')],
      };
    },
  },
  {
    skill: 'brs-overdraft', clause: 'XI.2.brs', title: 'BRS when the cash book shows an overdraft', typology: 'AEC',
    make: r => {
      const o = r.multiple(30000, 90000, 10000), bc = r.multiple(200, 1000, 100), io = r.multiple(500, 2000, 500), ci = r.multiple(5000, 20000, 5000), cd = r.multiple(5000, 15000, 5000), s1 = o + bc + io, s2 = s1 - ci + cd;
      return {
        stem: `The bank column of the cash book shows an overdraft (credit balance) of ${R(o)}. The bank has debited bank charges ${R(bc)} and interest on the overdraft ${R(io)}, which the firm has not yet recorded. Cheques issued for ${R(ci)} have not been presented, and cheques deposited for ${R(cd)} have not yet been collected. Find the overdraft as per the cash book after correction, and the overdraft as per the pass book.`,
        parts: [step('Step 1: overdraft per cash book after recording the bank’s charges', s1), step('Step 2: overdraft as per the pass book', s2)],
        hints: ['Items the bank has charged but the firm has not recorded make the firm’s own overdraft bigger. Record them first.', 'Then think from the bank’s side: cheques not yet presented have not been paid out by the bank, and cheques not yet collected have not been credited.'],
        working: [`Step 1: ${R(o)} + ${R(bc)} + ${R(io)} = ${R(s1)}`, `Step 2: unpresented cheques lower the bank’s overdraft; uncollected cheques raise it. ${R(s1)} − ${R(ci)} + ${R(cd)} = ${R(s2)}`],
        distractors: [dist(1, s1 + ci + cd, 'You added both timing items.', 'Unpresented cheques REDUCE the bank’s overdraft; only uncollected cheques increase it.')],
      };
    },
  },
  {
    skill: 'dep-machinery-account', clause: 'XI.2.depreciation', title: 'Machinery account with a purchase during the year', typology: 'AEC',
    make: r => {
      const b = r.multiple(200000, 800000, 100000), n = r.multiple(100000, 300000, 100000), rate = r.pick([10, 20]), d1 = (b * rate) / 100, d2 = (n * rate) / 200, tot = d1 + d2;
      return {
        stem: `Machinery has a book value of ${R(b)} on 1 April. On 1 October a new machine costing ${R(n)} is bought. Depreciation is charged at ${rate}% per year on the Written Down Value method, and the new machine is depreciated for the part of the year it was used. The year ends on 31 March. Work out the machinery account.`,
        parts: [step('Step 1: depreciation on the opening machinery', d1), step('Step 2: depreciation on the new machine (6 months)', d2), step('Step 3: total depreciation for the year', tot), step('Step 4: book value of machinery on 31 March', b + n - tot)],
        hints: HINTS_STEP, working: [`Step 1: ${R(b)} × ${rate}% = ${R(d1)}`, `Step 2: ${R(n)} × ${rate}% × 6/12 = ${R(d2)}`, `Step 3: ${R(d1)} + ${R(d2)} = ${R(tot)}`, `Step 4: ${R(b)} + ${R(n)} − ${R(tot)} = ${R(b + n - tot)}`],
        distractors: [dist(1, (n * rate) / 100, 'You charged a full year’s depreciation on the new machine.', 'It was in use for only 6 of the 12 months.')],
      };
    },
  },
  {
    skill: 'final-accounts-tb', clause: 'XI.3.trading-pl', title: 'Final accounts from a trial balance (mastermind)', typology: 'AEC',
    make: r => {
      const open = r.multiple(30000, 80000, 10000), purch = r.multiple(200000, 400000, 50000), carr = r.multiple(2000, 8000, 2000), wages = r.multiple(10000, 30000, 5000), rent = r.multiple(10000, 30000, 5000), sal = r.multiple(30000, 70000, 10000), furn = r.multiple(30000, 60000, 10000), debt = r.multiple(40000, 100000, 10000), cash = r.multiple(10000, 40000, 5000), draw = r.multiple(10000, 30000, 5000);
      const cred = r.multiple(30000, 80000, 10000), comm = r.multiple(5000, 15000, 5000), close = r.multiple(40000, 90000, 10000), os = r.multiple(5000, 15000, 5000), dep = r.multiple(10000, 30000, 5000), t = r.multiple(20000, 80000, 10000);
      const gp = t + rent + sal + os + dep - comm, sales = open + purch + carr + wages - close + gp;
      let cap = r.multiple(200000, 500000, 50000), mach: number;
      for (;;) { mach = cap + sales + cred + comm - (open + purch + carr + wages + rent + sal + furn + debt + cash + draw); if (mach >= 100000) break; cap += 50000; }
      const closeCap = cap + t - draw, total = closeCap + cred + os;
      return {
        stem: `Trial balance (balances in ₹) — Debit: Opening stock ${R(open)}, Purchases ${R(purch)}, Carriage inwards ${R(carr)}, Wages ${R(wages)}, Rent ${R(rent)}, Salaries ${R(sal)}, Machinery ${R(mach)}, Furniture ${R(furn)}, Debtors ${R(debt)}, Cash ${R(cash)}, Drawings ${R(draw)}. Credit: Sales ${R(sales)}, Creditors ${R(cred)}, Commission received ${R(comm)}, Capital ${R(cap)}. Adjustments: closing stock ${R(close)}; salaries outstanding ${R(os)}; depreciation on machinery ${R(dep)}. Prepare the final accounts figures.`,
        parts: [step('Step 1: gross profit', gp), step('Step 2: net profit', t), step('Step 3: closing capital', closeCap), step('Step 4: total of the balance sheet', total)],
        hints: ['Gross profit comes from the Trading Account: sales − (opening stock + purchases + carriage inwards + wages − closing stock).', 'Net profit = gross profit + commission − rent − salaries (including the outstanding) − depreciation. Capital then rises by profit and falls by drawings.'],
        working: [`Step 1: cost of goods sold = ${R(open)} + ${R(purch)} + ${R(carr)} + ${R(wages)} − ${R(close)} = ${R(sales - gp)}; gross profit = ${R(sales)} − ${R(sales - gp)} = ${R(gp)}`, `Step 2: ${R(gp)} + ${R(comm)} − ${R(rent)} − (${R(sal)} + ${R(os)}) − ${R(dep)} = ${R(t)}`, `Step 3: ${R(cap)} + ${R(t)} − ${R(draw)} = ${R(closeCap)}`, `Step 4: ${R(closeCap)} + creditors ${R(cred)} + outstanding salaries ${R(os)} = ${R(total)}`],
        distractors: [dist(1, t + os, 'You left the outstanding salaries out of the expenses.', 'An outstanding expense belongs to this year’s Profit and Loss Account.'), dist(2, cap + t + draw, 'You added the drawings.', 'Drawings reduce capital.')],
      };
    },
  },
  {
    skill: 'provision-discount', clause: 'XI.2.provisions', title: 'Provisions: doubtful debts and discount on debtors', typology: 'AP',
    make: r => {
      const d = r.multiple(100000, 300000, 50000), bad = r.multiple(2000, 8000, 1000), p = r.pick([5, 10]), dsc = r.pick([2, 4]), old = r.multiple(3000, 8000, 1000);
      const after = d - bad, pdd = (after * p) / 100, pd = ((after - pdd) * dsc) / 100, charge = bad + (pdd - old) + pd;
      return {
        stem: `Debtors at the end of the year are ${R(d)}. Bad debts of ${R(bad)} are to be written off. A provision for doubtful debts of ${p}% is to be kept on the remaining debtors, followed by a provision for discount of ${dsc}% on the debtors left after that provision. The old provision for doubtful debts was ${R(old)}; there was no old provision for discount.`,
        parts: [step('Step 1: provision for doubtful debts (new)', pdd), step('Step 2: provision for discount on debtors', pd), step('Step 3: total amount charged to the Profit and Loss Account', charge)],
        hints: ['Deduct bad debts from debtors first. The provision for doubtful debts is calculated on that balance.', 'The provision for discount is calculated on debtors left AFTER bad debts AND the provision for doubtful debts. The charge to profit is bad debts + the increase in provisions.'],
        working: [`Debtors after bad debts = ${R(after)}; PDD = ${p}% = ${R(pdd)}`, `Provision for discount = ${dsc}% of (${R(after)} − ${R(pdd)}) = ${R(pd)}`, `P&L charge = ${R(bad)} + (${R(pdd)} − ${R(old)}) + ${R(pd)} = ${R(charge)}`],
        distractors: [dist(2, bad + pdd + pd, 'You did not deduct the old provision.', 'Only the increase over the old provision is a new charge for this year.')],
      };
    },
  },
  {
    skill: 'credit-purchases', clause: 'XI.3.incomplete', title: 'Credit purchases from the creditors account', typology: 'AP',
    make: r => {
      const open = r.multiple(30000, 90000, 10000), close = r.multiple(30000, 100000, 10000), paid = r.multiple(150000, 400000, 10000), disc = r.multiple(2000, 8000, 1000), ret = r.multiple(3000, 12000, 1000), p = close + paid + disc + ret - open;
      return {
        stem: `Creditors at the beginning ${R(open)} and at the end ${R(close)}. During the year cash paid to creditors ${R(paid)}, discount received ${R(disc)} and purchases returned ${R(ret)}. Find the credit purchases.`,
        parts: [step('Credit purchases', p)],
        hints: ['Write the Total Creditors Account: payments, discount, returns and the closing balance on the debit side; the opening balance and credit purchases on the credit side.', 'Credit purchases is the balancing figure.'],
        working: [`Debit side = ${R(paid)} + ${R(disc)} + ${R(ret)} + ${R(close)} = ${R(paid + disc + ret + close)}`, `Credit purchases = ${R(paid + disc + ret + close)} − ${R(open)} = ${R(p)}`],
        distractors: [dist(0, p - ret, 'You left the purchases returns out.', 'Goods returned to creditors also reduce what is owed.')],
      };
    },
  },
  {
    skill: 'adj-abnormal', clause: 'XI.3.adjustments', title: 'Goods drawn and abnormal loss (mastermind)', typology: 'AEC',
    make: r => {
      const np = r.multiple(80000, 200000, 10000), d = r.multiple(2000, 10000, 1000), s = r.multiple(20000, 60000, 10000), c = s - r.multiple(5000, 15000, 5000), loss = s - c, adj = np + d + c;
      return {
        stem: `A firm’s net profit before adjustments is ${R(np)}. (i) The proprietor took goods costing ${R(d)} for personal use, not yet recorded. (ii) Goods costing ${R(s)} were destroyed by fire; the closing stock given in the books excludes them; the insurance company has admitted a claim of ${R(c)}. Find the abnormal loss to be charged to the Profit and Loss Account, the credit to the Trading Account for the goods destroyed, and the adjusted net profit.`,
        parts: [step('Step 1: abnormal loss charged to Profit and Loss', loss), step('Step 2: goods destroyed credited to Trading Account', s), step('Step 3: adjusted net profit', adj)],
        hints: ['Goods drawn by the proprietor are credited to Purchases, which raises gross profit; the entry is Drawings Dr, Purchases Cr.', 'Goods destroyed are credited to the Trading Account at cost; only the part not recovered from the insurer is a loss for the Profit and Loss Account.'],
        working: [`Step 1: ${R(s)} − claim ${R(c)} = ${R(loss)}`, `Step 2: the full cost ${R(s)} is credited to the Trading Account (it was not sold)`, `Step 3: ${R(np)} + ${R(d)} (goods drawn) + ${R(s)} − ${R(loss)} = ${R(adj)}`],
        distractors: [dist(2, np - d + c, 'You treated the goods drawn as a reduction of profit.', 'Goods drawn are taken out of Purchases, so cost of goods sold falls and profit rises.')],
      };
    },
  },
];

// ───────────────────────────── concept banks, spot-the-error and assertion-reason ─────────────────────────────
type Item = readonly [q: string, correct: string, wrong: readonly [string, string, string], why: string];
function mcq4(skill: string, clause: string, title: string, typology: Typology, bank: readonly Item[]): Gen {
  return {
    skill, clause, title, typology,
    make: r => {
      const [q, correct, wrong, why] = bank[r.int(0, bank.length - 1)]!, options = shuffle(r, [correct, ...wrong]);
      return {
        stem: q.length > 30 ? q : `Complete the statement: ${q}`,
        parts: [{ label: 'Choose the correct option', kind: 'CHOICE', options, answer: correct, marks: 1 }],
        hints: ['Recall the concept card for this topic before looking at the options.', 'Check each option against the exact wording of the question; usually two can be dropped at once.'],
        working: [`${correct}. ${why}`],
        distractors: wrong.map(w => ({ part: 0, value: w, mistake: `“${w}” does not fit what the question asks.`, fix: why })),
      };
    },
  };
}
const ERR = ['an error of omission', 'an error of commission', 'an error of principle', 'a compensating error'] as const;
const errItem = (q: string, ans: (typeof ERR)[number], why: string): Item => [q, ans, ERR.filter(e => e !== ans) as unknown as [string, string, string], why];
const AR_OPTIONS = ['Both A and R are true, and R is the correct explanation of A.', 'Both A and R are true, but R is not the correct explanation of A.', 'A is true, but R is false.', 'A is false, but R is true.'] as const;
type AR = readonly [a: string, r: string, aTrue: boolean, rTrue: boolean, explains: boolean, why: string];
const arAnswer = (aT: boolean, rT: boolean, ex: boolean) => (aT && rT ? (ex ? AR_OPTIONS[0] : AR_OPTIONS[1]) : aT ? AR_OPTIONS[2] : AR_OPTIONS[3]);
function ar(skill: string, clause: string, title: string, bank: readonly AR[]): Gen {
  return {
    skill, clause, title, typology: 'AEC',
    make: r => {
      const [a, rs, aT, rT, ex, why] = bank[r.int(0, bank.length - 1)]!, answer = arAnswer(aT, rT, ex);
      return {
        stem: `Assertion (A): ${a}  Reason (R): ${rs}  Choose the correct option.`,
        parts: [{ label: 'Choose the correct option', kind: 'CHOICE', options: AR_OPTIONS, answer, marks: 1 }],
        hints: ['First decide separately whether A is true and whether R is true.', 'If both are true, ask whether R explains WHY A is true. If it is only a separate true fact, the answer is the “not the correct explanation” option.'],
        working: [`${answer} ${why}`],
        distractors: AR_OPTIONS.filter(o => o !== answer).map(o => ({ part: 0, value: o, mistake: 'This option misjudges the truth of A or R, or how they are related.', fix: why })),
      };
    },
  };
}
const T = true, F = false;
const BANKS: Gen[] = [
  mcq4('mcq-books', 'XI.2.ledger', 'Journal, ledger and posting: concepts', 'RU', [
    ['The book in which transactions are first recorded in the order of their dates is the:', 'journal', ['ledger', 'trial balance', 'balance sheet'], 'The journal is the book of original entry.'],
    ['Transferring entries from the journal to the ledger accounts is called:', 'posting', ['casting', 'rectification', 'marshalling'], 'Posting moves each debit and credit to its own account.'],
    ['Finding the difference between the two sides of a ledger account is called:', 'balancing', ['posting', 'casting', 'marshalling'], 'The difference is the balance of the account.'],
    ['A compound journal entry is one that:', 'involves more than two accounts', ['is passed only at the year end', 'has no narration', 'records only cash'], 'Several debits and/or credits are combined in one entry.'],
    ['The journal proper is used to record:', 'transactions that do not belong to any special book, such as opening entries and rectifications', ['all credit sales', 'all cash receipts', 'all returns of goods'], 'It is the residual journal for non-routine entries.'],
    ['The principle that every debit has an equal credit is the basis of the:', 'double-entry system', ['single-entry system', 'cash basis', 'imprest system'], 'Both aspects of every transaction are recorded.'],
    ['The ledger folio (L.F.) column of the journal shows:', 'the page number of the ledger account in which the entry is posted', ['the date of the transaction', 'the amount in words', 'the voucher number only'], 'It links the journal with the ledger.'],
    ['Narration in a journal entry is:', 'a short explanation of the transaction', ['the amount of the entry', 'the name of the auditor', 'the balance of the account'], 'It tells why the entry has been made.'],
  ]),
  mcq4('mcq-tb', 'XI.2.tb', 'Trial balance: objectives and preparation', 'RU', [
    ['A trial balance is prepared mainly to check:', 'the arithmetical accuracy of the ledger postings', ['the profit of the firm', 'the value of the assets', 'the honesty of the staff'], 'It tests whether total debits equal total credits.'],
    ['In the balance method, the trial balance is prepared from:', 'the closing balances of the ledger accounts', ['the journal entries only', 'the total of the sales book only', 'the bank statement'], 'Each account’s balance is listed on its normal side.'],
    ['Which balance is shown on the debit side of a trial balance?', 'Drawings', ['Capital', 'Sales', 'Creditors'], 'Drawings are a debit balance.'],
    ['Which balance is shown on the credit side of a trial balance?', 'Sales', ['Purchases', 'Wages', 'Cash'], 'Income and liabilities have credit balances.'],
    ['An agreed trial balance proves:', 'only that total debits equal total credits', ['that the books are free from all errors', 'that the profit is correct', 'that no transaction was omitted'], 'Some errors do not disturb the agreement.'],
    ['A difference between the two totals of the trial balance that cannot be traced at once is temporarily put in the:', 'suspense account', ['capital account', 'drawings account', 'profit and loss account'], 'It is kept in suspense until the errors are found.'],
    ['Which of these appears on the debit side of the trial balance?', 'Debtors', ['Creditors', 'Capital', 'Commission received'], 'Assets and expenses are debit balances.'],
  ]),
  mcq4('mcq-cashbook', 'XI.2.cashbook', 'Cash book: contra entries and petty cash', 'RU', [
    ['A contra entry is an entry in which:', 'both the debit and the credit are in the cash book', ['only the debit is in the cash book', 'the entry is passed in the journal proper', 'the entry is posted to the sales account'], 'Deposit into or withdrawal from the bank are examples.'],
    ['Cash deposited into the bank is recorded in the cash book as:', 'debit in the bank column and credit in the cash column', ['debit in the cash column and credit in the bank column', 'debit in both columns', 'no entry is needed'], 'Bank rises (debit) and cash falls (credit).'],
    ['Under the imprest system, the petty cashier:', 'starts with a fixed sum and is reimbursed for what he spends', ['receives no money at all', 'pays all the major expenses of the firm', 'keeps the main cash book'], 'The imprest is restored at the end of each period.'],
    ['Discount allowed is recorded in the cash book on the:', 'debit side (discount column)', ['credit side (discount column)', 'both sides', 'neither side'], 'It is a loss to the firm, so it is on the debit side.'],
    ['A cash book is both a book of original entry and a:', 'ledger (the cash account)', ['trial balance', 'balance sheet', 'journal proper'], 'It is posted as the cash account itself.'],
    ['A debit balance in the bank column of the cash book shows:', 'money lying with the bank', ['a bank overdraft', 'unpaid wages', 'the owner’s capital'], 'The firm has a favourable balance at the bank.'],
    ['The cash column of the cash book can never show a:', 'credit balance', ['debit balance', 'nil balance', 'balance carried forward'], 'A firm cannot pay out more cash than it has.'],
    ['A credit balance in the bank column of the cash book means:', 'a bank overdraft', ['a favourable bank balance', 'cash in hand', 'drawings'], 'The firm owes the bank.'],
  ]),
  mcq4('mcq-subsidiary', 'XI.2.subsidiary', 'Subsidiary books: which book for which transaction', 'RU', [
    ['Credit purchases of goods meant for resale are recorded in the:', 'purchases book', ['sales book', 'cash book', 'journal proper'], 'It records only credit purchases of goods.'],
    ['Goods returned by a customer are recorded in the:', 'sales returns book', ['purchases returns book', 'purchases book', 'cash book'], 'It is based on the credit notes issued.'],
    ['Goods returned to a supplier are recorded in the:', 'purchases returns book', ['sales returns book', 'sales book', 'journal proper'], 'It is based on the debit notes sent.'],
    ['Credit purchase of furniture is recorded in the:', 'journal proper', ['purchases book', 'sales book', 'sales returns book'], 'The purchases book is only for goods bought for resale.'],
    ['Trade discount is:', 'not recorded in the books; the invoice shows the net amount', ['recorded on the credit side of the cash book', 'recorded as an expense', 'recorded as an income'], 'The books begin from the net price.'],
    ['The sales book records:', 'credit sales of goods', ['all sales for cash', 'sale of old furniture', 'return of goods by customers'], 'Cash sales go to the cash book.'],
    ['Entries in the sales returns book are made on the basis of:', 'credit notes', ['debit notes', 'cash memos', 'pay-in-slips'], 'The seller issues the credit note for the returned goods.'],
    ['GST paid on a purchase of goods by a registered firm is recorded as:', 'input tax credit (an asset until set off)', ['an expense of the year', 'drawings', 'capital'], 'It is adjusted against the GST payable on sales.'],
  ]),
  mcq4('mcq-reserves', 'XI.2.provisions', 'Provisions and reserves', 'RU', [
    ['A provision is made to meet:', 'a known liability or loss whose exact amount is uncertain', ['future profits', 'the owner’s drawings', 'a gain on sale of an asset'], 'It is a charge against profit.'],
    ['A reserve is created out of:', 'profits', ['loans', 'drawings', 'creditors'], 'It is an appropriation of profit.'],
    ['A provision is charged against profit, whereas a reserve is:', 'an appropriation of profit', ['a charge against profit', 'an expense of the year', 'a current liability'], 'This is the main difference between the two.'],
    ['A reserve created for a particular purpose, such as dividend equalisation, is a:', 'specific reserve', ['general reserve', 'secret reserve', 'capital reserve'], 'It is set aside for that purpose only.'],
    ['A reserve that is not shown in the balance sheet is a:', 'secret reserve', ['general reserve', 'capital reserve', 'specific reserve'], 'It is hidden, for example by undervaluing assets.'],
    ['A reserve created out of capital profits is a:', 'capital reserve', ['revenue reserve', 'secret reserve', 'general reserve'], 'Capital profits include profit on sale of fixed assets.'],
    ['General reserve is a:', 'revenue reserve created for no specific purpose', ['capital reserve', 'provision', 'current liability'], 'It strengthens the financial position of the firm.'],
    ['Which of these is a provision?', 'Provision for doubtful debts', ['General reserve', 'Capital reserve', 'Dividend equalisation reserve'], 'It is charged to profit to meet an expected loss.'],
  ]),
  mcq4('mcq-error-types', 'XI.2.errors', 'Types of errors', 'AP', [
    errItem('A sale of goods to Ram for ₹2,000 was not recorded in any book at all. This is:', 'an error of omission', 'A transaction was left out completely.'),
    errItem('The purchase of furniture for ₹10,000 was debited to the Purchases account. This is:', 'an error of principle', 'A capital item was treated as a revenue item.'),
    errItem('A sale to Mohan was posted to the account of Mohan Lal. This is:', 'an error of commission', 'The right amount was posted to the wrong personal account.'),
    errItem('An excess debit of ₹500 in X’s account was cancelled by an excess credit of ₹500 in Y’s account. This is:', 'a compensating error', 'The two errors offset each other, so the trial balance still agrees.'),
    errItem('Repairs to machinery of ₹3,000 were debited to the Machinery account. This is:', 'an error of principle', 'A revenue expense was treated as a capital item.'),
    errItem('The sales book was added up wrongly. This is:', 'an error of commission', 'It is a clerical slip in totalling.'),
    errItem('Cash sales of ₹4,000 were recorded neither in the cash book nor in the ledger. This is:', 'an error of omission', 'The whole transaction was missed.'),
    ['Which of these errors will NOT be disclosed by the trial balance?', 'An error of principle', ['Posting only the debit side of an entry', 'Omitting the credit side of an entry in the ledger', 'Wrong balancing of a ledger account'], 'An error of principle debits and credits equal amounts to the wrong type of account, so the totals still agree.'],
    ['Which of these errors WILL be disclosed by the trial balance?', 'Posting only the debit of an entry', ['A compensating error', 'An error of principle', 'Complete omission of a transaction'], 'A one-sided posting makes the totals unequal.'],
  ]),
  mcq4('mcq-depreciation', 'XI.2.depreciation', 'Depreciation: meaning, causes and methods', 'RU', [
    ['Depreciation is:', 'the decrease in the value of a fixed asset through use, time or obsolescence', ['the increase in the value of an asset', 'a cash payment to the bank', 'an appropriation of profit'], 'It is the allocation of an asset’s cost over its life.'],
    ['Which of these is a cause of depreciation?', 'Obsolescence', ['A rise in the market price of goods', 'Withdrawal of cash by the owner', 'An increase in sales'], 'New technology can make an asset outdated.'],
    ['Writing off the cost of a wasting asset such as a mine is called:', 'depletion', ['amortisation', 'appreciation', 'revaluation'], 'Depletion applies to natural resources.'],
    ['Writing off the cost of an intangible asset such as a patent over its life is called:', 'amortisation', ['depletion', 'appreciation', 'drawings'], 'Amortisation applies to intangibles.'],
    ['Which method charges the highest depreciation in the early years of the asset’s life?', 'Written Down Value method', ['Straight Line method', 'Both charge the same each year', 'Neither charges depreciation'], 'The charge falls each year as the book value falls.'],
    ['Under the provision for depreciation method the asset account is shown at:', 'its original cost, with the accumulated depreciation shown separately', ['its market value', 'its scrap value only', 'zero'], 'The depreciation is credited to the provision account.'],
    ['Depreciation is charged to the Profit and Loss Account because it is:', 'a non-cash expense of the period', ['a capital receipt', 'drawings', 'a liability'], 'It matches part of the asset’s cost with the year’s revenue.'],
    ['The amount of depreciation depends on:', 'cost, estimated useful life and residual (scrap) value', ['the owner’s drawings', 'the number of debtors', 'the rate of GST'], 'These are the main factors in the calculation.'],
  ]),
  mcq4('mcq-incomplete', 'XI.3.incomplete', 'Incomplete records and the Statement of Affairs', 'RU', [
    ['Accounts that are not kept on the double-entry system are called:', 'incomplete records (single-entry system)', ['a trial balance', 'a balance sheet', 'a cash flow statement'], 'Only some aspects of the transactions are recorded.'],
    ['Under the Statement of Affairs method, profit is found by comparing:', 'the capital at the end with the capital at the beginning, adjusted for drawings and fresh capital', ['sales and purchases only', 'cash and bank balances only', 'debtors and creditors only'], 'The increase in capital is the profit after adjustments.'],
    ['A Statement of Affairs is similar to a:', 'balance sheet', ['trading account', 'cash book', 'sales book'], 'It lists assets and liabilities at a date to find capital.'],
    ['Capital in a Statement of Affairs is found as:', 'assets − liabilities', ['assets + liabilities', 'liabilities − assets', 'sales − purchases'], 'Capital is the balancing figure.'],
    ['Closing capital + drawings − fresh capital − opening capital =', 'profit for the year', ['loss for the year', 'sales for the year', 'drawings'], 'Drawings are added back and fresh capital is deducted.'],
    ['A limitation of incomplete records is that they:', 'cannot give an accurate profit or a trial balance check', ['are too accurate', 'need double entry', 'are always audited'], 'They lack the check of equal debits and credits.'],
    ['A Statement of Affairs differs from a balance sheet because it is:', 'prepared from incomplete records, often with estimates, rather than from double-entry books', ['prepared by the bank', 'prepared only by companies', 'never used to find profit'], 'Some figures may be estimated.'],
  ]),
  mcq4('mcq-spot-error', 'XI.2.journal', 'Spot the error in the journal entry', 'AEC', [
    ['Transaction: “Bought goods on credit from Sunita for ₹8,000.” Entry given: Purchases A/c Dr ₹8,000 To Cash A/c ₹8,000. What is wrong?', 'Sunita (a creditor) should be credited because the purchase was on credit', ['Purchases should be credited', 'Nothing is wrong', 'The amount should be ₹800'], 'No cash was paid, so cash cannot be credited.'],
    ['Transaction: “Paid rent ₹5,000 by cheque.” Entry given: Bank A/c Dr ₹5,000 To Rent A/c ₹5,000. What is wrong?', 'Both sides are reversed: Rent (an expense) should be debited and Bank credited', ['Only the amount is wrong', 'Rent should be credited and Cash debited', 'Nothing is wrong'], 'An expense is debited; the asset that falls is credited.'],
    ['Transaction: “The owner took goods costing ₹2,000 for personal use.” Entry given: Drawings A/c Dr ₹2,000 To Cash A/c ₹2,000. What is wrong?', 'Purchases (goods) should be credited because no cash was taken', ['Drawings should be credited', 'Sales should be debited', 'Nothing is wrong'], 'Goods left the business, so Purchases is reduced.'],
    ['Transaction: “Bought machinery for cash ₹40,000.” Entry given: Purchases A/c Dr ₹40,000 To Cash A/c ₹40,000. What is wrong?', 'Machinery (a fixed asset) should be debited, not Purchases', ['Cash should be debited', 'Machinery should be credited', 'Nothing is wrong'], 'Goods for resale go to Purchases; assets for use go to their own account.'],
    ['Transaction: “Received ₹6,000 cash from Ravi, a debtor.” Entry given: Cash A/c Dr ₹6,000 To Sales A/c ₹6,000. What is wrong?', 'Ravi (Debtors) should be credited, because the sale was recorded earlier', ['Cash should be credited', 'Sales should be debited', 'Nothing is wrong'], 'The receipt settles a debt; it is not a new sale.'],
    ['Transaction: “Depreciation of ₹4,000 charged on machinery.” Entry given: Depreciation A/c Dr ₹4,000 To Cash A/c ₹4,000. What is wrong?', 'No cash is paid; Machinery (or Provision for Depreciation) should be credited', ['Depreciation should be credited', 'Cash should be debited', 'Nothing is wrong'], 'Depreciation is a non-cash expense.'],
    ['Transaction: “The owner introduced ₹50,000 more by cheque.” Entry given: Bank A/c Dr ₹50,000 To Loan A/c ₹50,000. What is wrong?', 'Capital should be credited, not Loan', ['Bank should be credited', 'Drawings should be debited', 'Nothing is wrong'], 'Money from the owner is capital, not a loan from outsiders.'],
    ['Transaction: “Goods worth ₹1,500 were returned by customer Karan.” Entry given: Karan A/c Dr ₹1,500 To Sales Returns A/c ₹1,500. What is wrong?', 'The sides are reversed: Sales Returns should be debited and Karan credited', ['Only the narration is missing', 'Karan should be debited and Sales credited', 'Nothing is wrong'], 'The customer owes less, so his account is credited.'],
  ]),
  mcq4('mcq-voucher-match', 'XI.2.vouchers', 'Match the transaction to its source document', 'AP', [
    ['Which source document is prepared for a cash sale to a walk-in customer?', 'Cash memo', ['Debit note', 'Pay-in-slip', 'Credit note'], 'A cash memo is the evidence of a cash sale.'],
    ['A customer returns damaged goods to the firm. The firm sends the customer a:', 'credit note', ['debit note', 'cash memo', 'pay-in-slip'], 'The customer’s account is credited for the returned goods.'],
    ['The firm returns defective goods to its supplier. The firm sends the supplier a:', 'debit note', ['credit note', 'cash memo', 'pay-in-slip'], 'The supplier’s account is debited.'],
    ['The accountant deposits cash into the firm’s bank account. The document filled in is the:', 'pay-in-slip', ['invoice', 'debit note', 'cash memo'], 'It is the bank’s deposit slip.'],
    ['Small expenses of ₹80 for tea and ₹120 for postage are paid from petty cash. The source document is the:', 'petty cash voucher', ['credit note', 'invoice', 'pay-in-slip'], 'Each petty payment is supported by a petty cash voucher.'],
    ['Goods are bought on credit from a supplier. The supplier sends an:', 'invoice', ['credit note', 'pay-in-slip', 'cash memo'], 'The invoice states the goods, price and terms.'],
    ['Cash is received from a debtor. The firm gives the debtor a:', 'receipt', ['debit note', 'credit note', 'invoice'], 'A receipt acknowledges money received.'],
    ['Which document is the evidence for entries in the sales returns book?', 'Credit note', ['Debit note', 'Cash memo', 'Pay-in-slip'], 'It records the goods returned by customers.'],
  ]),
  ar('ar-books', 'XI.2.ledger', 'Assertion–reason: journal and ledger', [
    ['Every journal entry has equal debit and credit totals.', 'The double-entry system records two aspects of every transaction.', T, T, T, 'Two equal aspects are recorded for each transaction.'],
    ['The journal is called the book of original entry.', 'Transactions are first recorded in it in the order of their dates.', T, T, T, 'That is exactly what “original entry” means.'],
    ['A trial balance can be prepared before the ledger accounts are balanced.', 'The trial balance is prepared from the closing balances of ledger accounts.', F, T, F, 'Under the balance method the balances must be found first.'],
    ['Journal proper is used for opening entries and rectification entries.', 'Routine transactions are recorded in the special books.', T, T, F, 'Both are true, but R is a separate fact, not the reason A is true.'],
    ['The ledger folio column links the journal with the ledger.', 'It shows the page of the ledger account in which the entry has been posted.', T, T, T, 'That page reference is the link.'],
    ['Posting is the transfer of ledger balances to the journal.', 'The ledger is a collection of accounts.', F, T, F, 'Posting goes from the journal to the ledger, not the other way round.'],
  ]),
  ar('ar-cashbook', 'XI.2.cashbook', 'Assertion–reason: cash book', [
    ['The cash book is both a book of original entry and a ledger.', 'It records cash transactions and is also treated as the cash account.', T, T, T, 'That is why cash needs no separate ledger account.'],
    ['A contra entry needs to be posted to the ledger.', 'Both the debit and the credit of a contra entry are in the cash book.', F, T, F, 'Because both sides are already in the cash book, no posting is needed.'],
    ['Under the imprest system the petty cashier is reimbursed for the actual amount spent.', 'This restores the petty cash to its fixed amount.', T, T, T, 'Spent money is replaced to bring back the imprest.'],
    ['Discount allowed is recorded on the debit side of the cash book.', 'Discount allowed is a loss to the business.', T, T, T, 'A loss is debited.'],
    ['The cash column of the cash book can never show a credit balance.', 'A firm cannot pay out more cash than it has.', T, T, T, 'Payments cannot exceed available cash.'],
    ['The bank column of the cash book may show a credit balance.', 'A bank overdraft appears as a credit balance in the cash book.', T, T, T, 'The firm owes the bank.'],
  ]),
  ar('ar-reserves', 'XI.2.provisions', 'Assertion–reason: provisions and reserves', [
    ['A provision is a charge against profit.', 'It is created to meet a known liability or loss whose amount is uncertain.', T, T, T, 'It reduces the profit of the year.'],
    ['A reserve is an appropriation of profit.', 'It is created out of profit after the profit has been earned.', T, T, T, 'It is set aside from profit, not charged against it.'],
    ['A general reserve can be used for any purpose of the business.', 'It is not created for any specific purpose.', T, T, T, 'Without a specific purpose, it is free for general use.'],
    ['A capital reserve is freely available for distribution as dividend.', 'It is created out of capital profits.', F, T, F, 'Capital profits are not distributed as dividend.'],
    ['A secret reserve is not shown in the balance sheet.', 'It is created by undervaluing assets or overstating liabilities.', T, T, T, 'That is how it stays hidden.'],
    ['Provision for doubtful debts is a reserve.', 'It is created to meet an expected loss from debtors.', F, T, F, 'It is a provision: charged to profit to meet an expected loss.'],
  ]),
  ar('ar-incomplete', 'XI.3.incomplete', 'Assertion–reason: incomplete records', [
    ['Profit can be found from incomplete records by comparing opening and closing capital.', 'The increase in capital, after adjusting for drawings and fresh capital, is the profit.', T, T, T, 'That is the Statement of Affairs method.'],
    ['A Statement of Affairs is prepared to find capital at a given date.', 'Capital = assets − liabilities.', T, T, T, 'Capital is what remains after the liabilities.'],
    ['Incomplete records give a trial balance that proves arithmetical accuracy.', 'Incomplete records do not follow the double-entry system.', F, T, F, 'Without double entry there is no equal debit and credit to test.'],
    ['Drawings are added to the increase in capital to find the profit.', 'Drawings reduce capital but are not a loss of the business.', T, T, T, 'The profit earned must include what the owner took out.'],
    ['Fresh capital introduced during the year is deducted to find the profit.', 'Fresh capital increases capital but is not profit.', T, T, T, 'Only the part of the increase that was earned is profit.'],
    ['Profit found by the Statement of Affairs method is always exact.', 'Some figures in a Statement of Affairs may be estimated.', F, T, F, 'Because estimates enter the figures, the profit is only approximate.'],
  ]),
];

export const V4_GENERATORS: readonly Gen[] = [...FULL, ...BANKS];
