/**
 * Chapter-wise question expansion (V2). Two kinds:
 *  - numerical generators whose answers are plain integer arithmetic on the generated rupees (each has a hand-worked oracle in test/questions-v2.test.ts);
 *  - concept (MCQ) banks for the theory clauses, written as a PGT would set them: one correct option, three plausible wrong ones, a one-line reason.
 * Stems are original. Nothing here goes beyond the official 2026-27 syllabus (docs/CBSE_2026_27_SYLLABUS_MATRIX.md).
 */
import { Money } from '../../engine/src';
import type { Distractor, Gen, Part } from './questions';
import type { Rng } from './rng';

const M = (n: number) => Money.rupees(n), R = (n: number) => M(n).format().replace(/\.00$/, ''), A = (n: number) => M(n).toString();
const money = (label: string, n: number, marks = 1): Part => ({ label, kind: 'MONEY', answer: A(n), marks });
const text = (label: string, answer: string, unit?: string, marks = 1): Part => (unit ? { label, kind: 'TEXT', answer, marks, unit } : { label, kind: 'TEXT', answer, marks });
const dist = (part: number, n: number, mistake: string, fix: string): Distractor => ({ part, value: A(n), mistake, fix });

// ───────────────────────────── numerical generators ─────────────────────────────
const NUMERIC: Gen[] = [
  {
    skill: 'gp-np', clause: 'XI.3.trading-pl', title: 'Gross profit and net profit', typology: 'AP',
    make: r => {
      const open = r.multiple(30000, 80000, 10000), purch = r.multiple(200000, 500000, 50000), pr = r.multiple(5000, 20000, 5000), carr = r.multiple(2000, 10000, 2000), wages = r.multiple(10000, 40000, 5000), close = r.multiple(40000, 90000, 10000);
      const rent = r.multiple(10000, 40000, 5000), sal = r.multiple(30000, 90000, 10000), comm = r.multiple(5000, 20000, 5000), sr = r.multiple(5000, 25000, 5000), np = r.multiple(20000, 80000, 10000);
      const cogs = open + (purch - pr) + carr + wages - close, gp = np + rent + sal - comm, sales = cogs + gp + sr;
      return {
        stem: `Sales ${R(sales)}, sales returns ${R(sr)}, opening stock ${R(open)}, purchases ${R(purch)}, purchases returns ${R(pr)}, carriage inwards ${R(carr)}, wages ${R(wages)}, closing stock ${R(close)}, rent ${R(rent)}, salaries ${R(sal)}, commission received ${R(comm)}. Find the gross profit and the net profit.`,
        parts: [money('Gross profit', gp), money('Net profit', np)],
        hints: ['Cost of goods sold = opening stock + net purchases + direct expenses (carriage inwards, wages) − closing stock.', 'Gross profit = NET sales (after returns) − cost of goods sold. Net profit = gross profit + indirect incomes − indirect expenses.'],
        working: [`Net sales = ${R(sales)} − ${R(sr)} = ${R(sales - sr)}`, `Cost of goods sold = ${R(open)} + (${R(purch)} − ${R(pr)}) + ${R(carr)} + ${R(wages)} − ${R(close)} = ${R(cogs)}`, `Gross profit = ${R(sales - sr)} − ${R(cogs)} = ${R(gp)}`, `Net profit = ${R(gp)} + ${R(comm)} − ${R(rent)} − ${R(sal)} = ${R(np)}`],
        distractors: [dist(0, gp + carr, 'You left carriage inwards out of the cost of goods sold.', 'Carriage inwards is a DIRECT expense: it goes to the debit of the Trading Account.'), dist(1, np - comm, 'You did not add commission received.', 'Indirect incomes such as commission received are credited to the Profit and Loss Account.')],
      };
    },
  },
  {
    skill: 'closing-capital', clause: 'XI.3.balance-sheet', title: 'Closing capital and balance sheet total', typology: 'AP',
    make: r => {
      const open = r.multiple(200000, 800000, 50000), fresh = r.multiple(10000, 100000, 10000), profit = r.multiple(20000, 150000, 10000), draw = r.multiple(10000, 60000, 10000), loan = r.multiple(50000, 200000, 50000), cred = r.multiple(20000, 90000, 10000);
      const close = open + fresh + profit - draw;
      return {
        stem: `Opening capital ${R(open)}. During the year the owner introduced ${R(fresh)} more, the business earned a net profit of ${R(profit)}, and the owner withdrew ${R(draw)}. The firm also owes a long-term loan of ${R(loan)} and creditors of ${R(cred)}. Find the closing capital and the total of the balance sheet.`,
        parts: [money('Closing capital', close), money('Total of the balance sheet', close + loan + cred)],
        hints: ['Closing capital = opening capital + fresh capital + net profit − drawings.', 'The balance sheet total equals capital plus all outside liabilities (assets = capital + liabilities).'],
        working: [`Closing capital = ${R(open)} + ${R(fresh)} + ${R(profit)} − ${R(draw)} = ${R(close)}`, `Total = ${R(close)} + ${R(loan)} + ${R(cred)} = ${R(close + loan + cred)}`],
        distractors: [dist(0, open + fresh + profit + draw, 'You added the drawings instead of deducting them.', 'Drawings reduce the owner’s capital.')],
      };
    },
  },
  {
    skill: 'outstanding-prepaid', clause: 'XI.3.adjustments', title: 'Outstanding and prepaid expenses', typology: 'AP',
    make: r => {
      const paid = r.multiple(60000, 150000, 10000), o1 = r.multiple(10000, 15000, 5000), prem = r.multiple(12000, 60000, 12000), m = r.pick([3, 4, 5, 7, 8, 9]), o2 = o1 + r.pick([-5000, 5000, 10000]);
      const charge = paid - o1 + o2, prepaid = (prem / 12) * (12 - m);
      return {
        stem: `Rent paid during the year was ${R(paid)}. Rent outstanding at the beginning was ${R(o1)} and at the end ${R(o2)}. Separately, an insurance premium of ${R(prem)} was paid for a 12-month policy that started ${m} months before the end of the financial year. Find the rent to be charged to the Profit and Loss Account and the prepaid insurance at the year end.`,
        parts: [money('Rent charged to P&L', charge), money('Prepaid insurance', prepaid)],
        hints: ['Expense of the year = amount paid − outstanding at the beginning (it belongs to last year) + outstanding at the end.', 'Premium per month = annual premium ÷ 12. Prepaid = premium for the months still left after the year end.'],
        working: [`Rent = ${R(paid)} − ${R(o1)} + ${R(o2)} = ${R(charge)}`, `Premium per month = ${R(prem / 12)}; months unexpired = 12 − ${m} = ${12 - m}`, `Prepaid insurance = ${R(prepaid)}`],
        distractors: [dist(0, paid + o1 - o2, 'You reversed the outstanding amounts.', 'Last year’s outstanding rent is DEDUCTED; this year’s outstanding rent is ADDED.'), dist(1, (prem / 12) * m, 'You gave the expired part of the premium, not the unexpired part.', 'Prepaid is the part that relates to the NEXT year.')],
      };
    },
  },
  {
    skill: 'tb-missing', clause: 'XI.2.errors', title: 'Find the missing trial balance figure', typology: 'AP',
    make: r => {
      const mach = r.multiple(150000, 400000, 10000), purch = r.multiple(100000, 250000, 10000), debt = r.multiple(40000, 120000, 10000), cash = r.multiple(10000, 50000, 5000), rent = r.multiple(10000, 30000, 5000);
      const sales = r.multiple(100000, 200000, 10000), cred = r.multiple(30000, 80000, 10000), dr = mach + purch + debt + cash + rent, cap = dr - sales - cred;
      return {
        stem: `The trial balance of a firm agrees. Debit balances: Machinery ${R(mach)}, Purchases ${R(purch)}, Debtors ${R(debt)}, Cash ${R(cash)}, Rent ${R(rent)}. Credit balances: Sales ${R(sales)}, Creditors ${R(cred)} and Capital. Find the capital.`,
        parts: [money('Capital', cap)],
        hints: ['A trial balance that agrees has total debits = total credits.', 'Add all the debit balances, then deduct the credit balances that are already known.'],
        working: [`Total debits = ${R(dr)}`, `Capital = ${R(dr)} − ${R(sales)} − ${R(cred)} = ${R(cap)}`],
        distractors: [dist(0, cap + cred, 'You did not deduct the creditors.', 'Capital = total debits − ALL the other credit balances, including creditors.')],
      };
    },
  },
  {
    skill: 'purchases-book', clause: 'XI.2.subsidiary', title: 'Net purchases from the purchases books', typology: 'AP',
    make: r => {
      const td = r.pick([10, 20]), l = [r.multiple(10000, 50000, 5000), r.multiple(10000, 50000, 5000), r.multiple(10000, 50000, 5000)], ret = r.multiple(1000, 5000, 1000);
      const nets = l.map(x => (x * (100 - td)) / 100), net = nets[0]! + nets[1]! + nets[2]! - ret;
      return {
        stem: `Goods were bought on credit under three invoices at list prices ${R(l[0]!)}, ${R(l[1]!)} and ${R(l[2]!)}, all subject to ${td}% trade discount. Goods worth ${R(ret)} (net of trade discount) were later returned to a supplier. What is the net purchases figure?`,
        parts: [money('Net purchases', net)],
        hints: ['Trade discount is deducted from the list price BEFORE the purchase is recorded.', 'Net purchases = purchases (net of trade discount) − purchases returns.'],
        working: [`Invoices net of ${td}% = ${nets.map(R).join(' + ')} = ${R(nets[0]! + nets[1]! + nets[2]!)}`, `Net purchases = ${R(nets[0]! + nets[1]! + nets[2]!)} − ${R(ret)} = ${R(net)}`],
        distractors: [dist(0, l[0]! + l[1]! + l[2]! - ret, 'You recorded the purchases at list price.', 'Trade discount is never recorded in the books; use the net price.')],
      };
    },
  },
  {
    skill: 'credit-sales', clause: 'XI.3.incomplete', title: 'Credit sales from the debtors account', typology: 'AP',
    make: r => {
      const open = r.multiple(30000, 90000, 10000), close = r.multiple(30000, 100000, 10000), cash = r.multiple(150000, 400000, 10000), disc = r.multiple(2000, 8000, 1000), bad = r.multiple(1000, 6000, 1000), ret = r.multiple(3000, 12000, 1000);
      const sales = close + cash + disc + bad + ret - open;
      return {
        stem: `Debtors at the beginning ${R(open)} and at the end ${R(close)}. During the year cash received from debtors ${R(cash)}, discount allowed ${R(disc)}, bad debts ${R(bad)} and sales returns ${R(ret)}. Prepare the Total Debtors Account in your head and find the credit sales.`,
        parts: [money('Credit sales', sales)],
        hints: ['Total Debtors Account: debit side = opening balance + credit sales; credit side = cash received, discount, bad debts, returns and closing balance.', 'Credit sales is the balancing figure.'],
        working: [`Credit side total = ${R(cash)} + ${R(disc)} + ${R(bad)} + ${R(ret)} + ${R(close)} = ${R(cash + disc + bad + ret + close)}`, `Credit sales = ${R(cash + disc + bad + ret + close)} − ${R(open)} = ${R(sales)}`],
        distractors: [dist(0, sales - ret, 'You left sales returns out of the Total Debtors Account.', 'Goods returned by customers also reduce the debtors’ balance.')],
      };
    },
  },
  {
    skill: 'corrected-profit', clause: 'XI.2.errors', title: 'Profit after correcting errors', typology: 'AP',
    make: r => {
      const p = r.multiple(60000, 200000, 10000), fur = r.multiple(10000, 40000, 5000), wag = r.multiple(5000, 20000, 5000), sal = r.multiple(5000, 20000, 5000);
      const fixed = p + fur - wag + sal;
      return {
        stem: `A firm showed a net profit of ${R(p)}. Later it was found that (i) furniture bought for ${R(fur)} had been debited to Purchases, (ii) wages outstanding of ${R(wag)} had not been recorded, and (iii) the owner’s personal withdrawal of ${R(sal)} had been debited to Salary account. Ignoring depreciation, find the correct net profit.`,
        parts: [money('Correct net profit', fixed)],
        hints: ['A capital item wrongly charged as an expense makes profit too LOW; correct it by adding it back.', 'An unrecorded expense makes profit too HIGH. A personal withdrawal wrongly charged as expense makes profit too LOW.'],
        working: [`(i) Furniture is an asset, not an expense: + ${R(fur)}`, `(ii) Outstanding wages are an expense of the year: − ${R(wag)}`, `(iii) Drawings are not an expense: + ${R(sal)}`, `Correct profit = ${R(p)} + ${R(fur)} − ${R(wag)} + ${R(sal)} = ${R(fixed)}`],
        distractors: [dist(0, p - fur - wag - sal, 'You treated every error as reducing profit.', 'Decide for each error whether profit was understated (add) or overstated (deduct).')],
      };
    },
  },
  {
    skill: 'capital-accounts', clause: 'XII.1.capital', title: 'Fixed and fluctuating capital', typology: 'AP',
    make: r => {
      const c = r.multiple(200000, 600000, 50000), add = r.multiple(10000, 60000, 10000), cur = r.multiple(5000, 30000, 5000), rate = r.pick([6, 8, 10, 12]), sh = r.multiple(20000, 90000, 5000), dr = r.multiple(10000, 40000, 5000);
      const interest = (c * rate) / 100, current = cur + interest + sh - dr;
      return {
        stem: `Partner A’s capitals are fixed. Opening capital account ${R(c)}, opening current account (credit) ${R(cur)}. During the year A brought in ${R(add)} additional capital. Interest on capital is ${rate}% p.a. on the opening capital, A’s share of profit is ${R(sh)} and A’s drawings are ${R(dr)}. Find the closing balance of A’s capital account and of A’s current account.`,
        parts: [money('Capital account (closing)', c + add), money('Current account (closing, credit)', current)],
        hints: ['With FIXED capitals, only additional capital introduced or withdrawn changes the capital account.', 'Interest, salary, share of profit and drawings all go through the CURRENT account.'],
        working: [`Capital account = ${R(c)} + ${R(add)} = ${R(c + add)}`, `Interest = ${R(c)} × ${rate}% = ${R(interest)}`, `Current account = ${R(cur)} + ${R(interest)} + ${R(sh)} − ${R(dr)} = ${R(current)}`],
        distractors: [dist(0, c, 'You ignored the additional capital.', 'Capital introduced is credited to the capital account even when capitals are fixed.')],
      };
    },
  },
  {
    skill: 'past-salary', clause: 'XII.1.past-adjustments', title: 'Past adjustment: omitted partner’s salary', typology: 'AP',
    make: r => {
      const [a, b] = r.pick([[3, 2], [2, 1], [3, 1], [1, 1]] as const), n = r.pick([2, 3]), t = r.multiple(30000, 120000, 30000), s = t / n, pay = (t * b) / (a + b);
      return {
        stem: `A and B share profits ${a} : ${b}. According to the deed A is entitled to a salary of ${R(s)} a year, but it was not given for the last ${n} years. The partners decide to adjust this now. How much must B’s current account be debited (and A’s correspondingly gain, net of A’s own share)?`,
        parts: [money('Net amount B bears and A receives', pay)],
        hints: ['Total salary due = annual salary × number of years. A is credited with all of it, and the firm’s partners (A and B) bear it in the profit-sharing ratio.', 'Net effect: only the part of the salary that B has to bear is a real transfer from B to A.'],
        working: [`Total salary due = ${R(s)} × ${n} = ${R(t)}`, `A’s own share of this burden = ${R((t * a) / (a + b))}`, `B bears ${b}/${a + b} of ${R(t)} = ${R(pay)}`],
        distractors: [dist(0, t, 'You treated the entire salary as paid by B.', 'A also bears a share of the salary as a partner; only B’s share is a transfer.')],
      };
    },
  },
  {
    skill: 'death-profit', clause: 'XII.1.death', title: 'Death of a partner: share of profit up to the date of death', typology: 'AP',
    make: r => {
      const [a, b] = r.pick([[3, 2], [1, 1], [2, 3]] as const), p = r.multiple(60000, 240000, 60000), m = r.pick([3, 6, 9]), share = (((p * m) / 12) * a) / (a + b);
      return {
        stem: `A and B are partners sharing profits ${a} : ${b}. A died after ${m} months of the financial year. The profit of the previous year was ${R(p)}, and the deed says the share of profit up to the date of death is based on the previous year’s profit. Find A’s share of profit till the date of death.`,
        parts: [money('A’s share of profit till death', share)],
        hints: ['Profit for the period = previous year’s profit × months ÷ 12.', 'Then take A’s share of that profit in the profit-sharing ratio.'],
        working: [`Profit for ${m} months = ${R(p)} × ${m}/12 = ${R((p * m) / 12)}`, `A’s share = ${a}/${a + b} × ${R((p * m) / 12)} = ${R(share)}`],
        distractors: [dist(0, (p * a) / (a + b), 'You took a full year’s profit.', 'A was alive only for part of the year: scale by months ÷ 12.')],
      };
    },
  },
  {
    skill: 'admission-capital', clause: 'XII.1.admission', title: 'Goodwill from the new partner’s capital', typology: 'AP',
    make: r => {
      const n = r.pick([4, 5]), x = r.multiple(100000, 300000, 50000), g = r.multiple(20000, 100000, 10000), old = (n - 1) * x - g, a = Math.floor(old / 20000) * 10000, b = old - a;
      return {
        stem: `A and B have capitals of ${R(a)} and ${R(b)}. C is admitted for a 1/${n} share and brings ${R(x)} as his capital. C’s capital is in proportion to his share, so it fixes the total capital of the new firm. Find the goodwill of the firm.`,
        parts: [money('Goodwill of the firm', g)],
        hints: ['If C’s share is 1/n and his capital is X, the total capital of the new firm = n × X.', 'Goodwill = total capital of the new firm − (existing capitals + C’s capital).'],
        working: [`Total capital of the new firm = ${n} × ${R(x)} = ${R(n * x)}`, `Actual capital = ${R(a)} + ${R(b)} + ${R(x)} = ${R(a + b + x)}`, `Goodwill = ${R(n * x)} − ${R(a + b + x)} = ${R(g)}`],
        distractors: [dist(0, n * x, 'You gave the total capital, not the goodwill.', 'Goodwill is only the excess over the capital actually available.')],
      };
    },
  },
  {
    skill: 'premium-issue', clause: 'XII.2.issue', title: 'Issue of shares at a premium', typology: 'AP',
    make: r => {
      const n = r.multiple(10000, 60000, 5000), p = r.pick([2, 3, 4, 5]);
      return {
        stem: `A company issued ${n} equity shares of ₹10 each at a premium of ₹${p} per share. The full amount was received on application and all shares were allotted. Find the total cash received, the Equity Share Capital credited and the Securities Premium credited.`,
        parts: [money('Cash received', n * (10 + p)), money('Equity Share Capital', n * 10), money('Securities Premium', n * p)],
        hints: ['Cash per share = face value + premium.', 'Share capital is credited at face value only; the premium goes to Securities Premium (a reserve), never to share capital.'],
        working: [`Cash = ${n} × ₹${10 + p} = ${R(n * (10 + p))}`, `Share capital = ${n} × ₹10 = ${R(n * 10)}`, `Securities premium = ${n} × ₹${p} = ${R(n * p)}`],
        distractors: [dist(1, n * (10 + p), 'You credited the premium to share capital.', 'Only the face value is share capital.')],
      };
    },
  },
  {
    skill: 'paid-up', clause: 'XII.2.disclosure', title: 'Paid-up capital after calls in arrears', typology: 'AP',
    make: r => {
      const n = r.multiple(10000, 50000, 5000), c = r.pick([7, 8, 9]), arr = r.multiple(1000, 5000, 1000);
      return {
        stem: `A company has issued and subscribed ${n} shares of ₹10 each, of which ₹${c} per share has been called. Calls in arrears amount to ${R(arr)}. What is the subscribed and PAID-UP capital to be shown in the balance sheet?`,
        parts: [money('Paid-up capital', n * c - arr)],
        hints: ['Called-up capital = shares × amount called per share.', 'Paid-up capital = called-up capital − calls in arrears.'],
        working: [`Called-up = ${n} × ₹${c} = ${R(n * c)}`, `Paid-up = ${R(n * c)} − ${R(arr)} = ${R(n * c - arr)}`],
        distractors: [dist(0, n * c, 'You did not deduct the calls in arrears.', 'Calls in arrears were called but not received; they are not paid-up.')],
      };
    },
  },
  {
    skill: 'comparative', clause: 'XII.3.comparative', title: 'Comparative statement: change and % change', typology: 'AP',
    make: r => {
      const prev = r.multiple(200000, 800000, 100000), p = r.pick([5, 10, 15, 20, 25, -10, -20]), cur = (prev * (100 + p)) / 100;
      return {
        stem: `A firm’s revenue from operations was ${R(prev)} last year and ${R(cur)} this year. Find the absolute change and the percentage change (enter a decrease with a minus sign, and the percentage as a plain number).`,
        parts: [money('Absolute change', cur - prev), text('Percentage change', String(p), '%')],
        hints: ['Absolute change = current year − previous year.', 'Percentage change = absolute change ÷ PREVIOUS year × 100. The previous year is always the base.'],
        working: [`Change = ${R(cur)} − ${R(prev)} = ${R(cur - prev)}`, `% change = ${R(cur - prev)} ÷ ${R(prev)} × 100 = ${p}%`],
        distractors: [],
      };
    },
  },
  {
    skill: 'common-size', clause: 'XII.3.common-size', title: 'Common-size statement', typology: 'AP',
    make: r => {
      const base = r.multiple(200000, 1000000, 100000), p1 = r.int(5, 40), p2 = r.int(5, 40);
      return {
        stem: `In a common-size statement of profit and loss, revenue from operations (${R(base)}) is taken as 100. Cost of materials consumed is ${R((base * p1) / 100)} and employee benefit expense is ${R((base * p2) / 100)}. Find each as a percentage of revenue (plain numbers).`,
        parts: [text('Cost of materials (%)', String(p1), '%'), text('Employee benefit expense (%)', String(p2), '%')],
        hints: ['Common-size % = item ÷ base × 100.', 'For the statement of profit and loss the base is revenue from operations.'],
        working: [`${R((base * p1) / 100)} ÷ ${R(base)} × 100 = ${p1}%`, `${R((base * p2) / 100)} ÷ ${R(base)} × 100 = ${p2}%`],
        distractors: [],
      };
    },
  },
  {
    skill: 'ratio-profit', clause: 'XII.3.profitability', title: 'Gross profit, operating and operating profit ratios', typology: 'AP',
    make: r => {
      const rev = r.multiple(500000, 2000000, 100000), pc = r.pick([50, 55, 60, 65, 70, 75]), ox = r.pick([8, 10, 12, 15, 20]);
      return {
        stem: `Revenue from operations ${R(rev)}; cost of revenue from operations ${R((rev * pc) / 100)}; operating expenses ${R((rev * ox) / 100)}. Calculate the gross profit ratio, the operating ratio and the operating profit ratio (plain numbers, in %).`,
        parts: [text('Gross profit ratio (%)', String(100 - pc), '%'), text('Operating ratio (%)', String(pc + ox), '%'), text('Operating profit ratio (%)', String(100 - pc - ox), '%')],
        hints: ['Gross profit = revenue − cost of revenue from operations.', 'Operating ratio = (cost of revenue + operating expenses) ÷ revenue × 100. Operating profit ratio = 100 − operating ratio.'],
        working: [`Gross profit ratio = (${R(rev)} − ${R((rev * pc) / 100)}) ÷ ${R(rev)} × 100 = ${100 - pc}%`, `Operating ratio = ${pc + ox}%`, `Operating profit ratio = ${100 - pc - ox}%`],
        distractors: [],
      };
    },
  },
  {
    skill: 'ratio-receivables', clause: 'XII.3.activity', title: 'Trade receivables turnover and collection period', typology: 'AP',
    make: r => {
      const t = r.pick([4, 6, 12]), avg = r.multiple(20000, 80000, 10000), d = r.multiple(5000, 15000, 5000), rev = t * avg;
      return {
        stem: `Net credit revenue from operations ${R(rev)}. Trade receivables at the beginning ${R(avg - d)} and at the end ${R(avg + d)}. Find the trade receivables turnover ratio (times) and the average collection period (in months).`,
        parts: [text('Receivables turnover (times)', String(t), 'times'), text('Average collection period (months)', String(12 / t), 'months')],
        hints: ['Turnover = net credit revenue ÷ AVERAGE trade receivables.', 'Average collection period = 12 months ÷ turnover.'],
        working: [`Average receivables = (${R(avg - d)} + ${R(avg + d)}) ÷ 2 = ${R(avg)}`, `Turnover = ${R(rev)} ÷ ${R(avg)} = ${t} times`, `Collection period = 12 ÷ ${t} = ${12 / t} months`],
        distractors: [],
      };
    },
  },
  {
    skill: 'cfi-cff', clause: 'XII.4.preparation', title: 'Cash flows from investing and financing activities', typology: 'AP',
    make: r => {
      const buy = r.multiple(100000, 300000, 10000), sell = r.multiple(20000, 80000, 10000), intr = r.multiple(3000, 12000, 1000), sh = r.multiple(100000, 400000, 50000), loan = r.multiple(50000, 200000, 50000), rep = r.multiple(20000, 80000, 10000), div = r.multiple(10000, 40000, 5000);
      const inv = sell + intr - buy, fin = sh + loan - rep - div;
      return {
        stem: `A non-financial company: purchased machinery ${R(buy)}, sold old machinery ${R(sell)}, received interest on investments ${R(intr)}, issued equity shares for cash ${R(sh)}, raised a long-term loan ${R(loan)}, repaid a loan ${R(rep)} and paid dividend ${R(div)}. Find the net cash from investing activities and the net cash from financing activities (use a minus sign for an outflow).`,
        parts: [money('Net cash from investing', inv), money('Net cash from financing', fin)],
        hints: ['Investing: purchase and sale of fixed assets and investments, and interest/dividend received (for a non-financial company).', 'Financing: raising or repaying share capital and borrowings, and dividend and interest paid.'],
        working: [`Investing = ${R(sell)} + ${R(intr)} − ${R(buy)} = ${R(inv)}`, `Financing = ${R(sh)} + ${R(loan)} − ${R(rep)} − ${R(div)} = ${R(fin)}`],
        distractors: [dist(1, sh + loan - rep, 'You left the dividend paid out of financing.', 'Dividend paid to shareholders is a financing outflow.')],
      };
    },
  },
];

// ───────────────────────────── concept (MCQ) banks ─────────────────────────────
type Item = readonly [q: string, correct: string, wrong: readonly [string, string, string], why: string];
function shuffle<T>(r: Rng, xs: readonly T[]): T[] { const o = [...xs]; for (let i = o.length - 1; i > 0; i--) { const j = r.int(0, i), t = o[i]!; o[i] = o[j]!; o[j] = t; } return o; }
function mcq(skill: string, clause: string, title: string, bank: readonly Item[]): Gen {
  return {
    skill, clause, title, typology: 'RU',
    make: r => {
      const [q, correct, wrong, why] = bank[r.int(0, bank.length - 1)]!;
      const options = shuffle(r, [correct, ...wrong]);
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

const BANKS: readonly Gen[] = [
  mcq('mcq-intro', 'XI.1.intro', 'Introduction to accounting', [
    ['Accounting is best described as:', 'identifying, measuring, recording and communicating economic information', ['only writing transactions in the cash book', 'preparing the balance sheet once a year', 'a branch of statistics concerned with sampling'], 'Accounting covers the whole cycle from identifying a transaction to communicating the results to users.'],
    ['Which qualitative characteristic means accounting information should be free from bias and error?', 'Reliability', ['Relevance', 'Comparability', 'Understandability'], 'Reliable information is faithful, neutral and free from material error.'],
    ['Information that helps users to confirm or correct their earlier expectations and to predict the future is:', 'relevant', ['reliable', 'comparable', 'understandable'], 'Relevance means the information can influence the decisions of its users.'],
    ['Which of the following is an INTERNAL user of accounting information?', 'Management of the business', ['Investors', 'Lenders', 'Tax authorities'], 'Owners’ managers use accounting information inside the business; the others are external users.'],
    ['Lenders such as banks are mainly interested in accounting information to judge the business’s:', 'ability to pay interest and repay the loan', ['rate of sales growth only', 'number of employees', 'popularity with customers'], 'Lenders look at solvency and repayment capacity.'],
    ['Book-keeping differs from accounting because book-keeping is mainly concerned with:', 'recording of transactions', ['analysis and interpretation of results', 'preparing budgets and forecasts', 'auditing of the final accounts'], 'Book-keeping is the recording stage; accounting includes summarising, analysing and communicating.'],
    ['Comparability of accounting information means that it can be:', 'compared with other periods and with other firms', ['understood without any training', 'verified only by the auditor', 'prepared at no cost'], 'Consistent methods allow comparison over time and between firms.'],
    ['Accounting records only those transactions and events that can be expressed:', 'in money terms', ['in physical units', 'in a qualitative description', 'in the opinion of the owner'], 'The money-measurement idea underlies all recording.'],
  ]),
  mcq('mcq-terms', 'XI.1.terms', 'Basic accounting terms', [
    ['The amount the business owes to outsiders is called a:', 'liability', ['asset', 'capital', 'revenue'], 'Amounts payable to outsiders are liabilities; the owner’s claim is capital.'],
    ['Drawings means:', 'cash or goods taken by the owner for personal use', ['wages paid to workers', 'interest earned on a deposit', 'goods sold to a debtor'], 'Drawings reduce capital; they are not a business expense.'],
    ['Goods bought for resale are recorded as:', 'purchases', ['machinery', 'capital', 'drawings'], 'Goods bought for use in the business (not resale) are assets, not purchases.'],
    ['A debtor is a person who:', 'owes money to the firm for goods or services bought on credit', ['has lent money to the firm', 'is a partner in the firm', 'holds the firm’s bank account'], 'A debtor’s balance is an asset of the firm.'],
    ['Which of the following is a current asset?', 'Debtors', ['Machinery', 'Building', 'Goodwill'], 'Debtors are expected to be turned into cash within the operating cycle.'],
    ['A reduction in the list price given by the seller to the buyer for buying in bulk is:', 'trade discount', ['cash discount', 'bad debt', 'drawings'], 'Trade discount is not recorded in the books; cash discount is recorded.'],
    ['The excess of revenue over expenses of a period is:', 'profit', ['capital', 'liability', 'drawings'], 'Profit increases the owner’s capital.'],
    ['Capital is:', 'the amount invested by the owner in the business', ['money borrowed from a bank', 'cash in hand and at bank', 'goods held for sale'], 'Capital is the owner’s claim on the assets of the business.'],
  ]),
  mcq('mcq-concepts', 'XI.1.concepts', 'Accounting concepts and principles', [
    ['The firm and its owner are treated as two separate persons. This is the:', 'business entity concept', ['going concern concept', 'cost concept', 'matching concept'], 'Owner’s private affairs are kept apart from the business’s accounts.'],
    ['Assuming the business will continue for the foreseeable future is the:', 'going concern concept', ['business entity concept', 'conservatism concept', 'materiality concept'], 'Assets are not valued as if the firm were about to be closed down.'],
    ['Recording assets at the price paid to acquire them is based on the:', 'historical cost concept', ['dual aspect concept', 'revenue recognition concept', 'consistency concept'], 'Market value changes are generally not recorded.'],
    ['“Every transaction has two aspects: a debit and an equal credit.” This is the:', 'dual aspect concept', ['money measurement concept', 'accounting period concept', 'full disclosure concept'], 'This is why Assets = Liabilities + Capital always holds.'],
    ['Charging expenses against the revenue they helped earn in the same period is the:', 'matching concept', ['going concern concept', 'cost concept', 'business entity concept'], 'Expenses are matched with the revenues of the period.'],
    ['Providing for all possible losses but not anticipating profits follows the:', 'conservatism (prudence) concept', ['materiality concept', 'consistency concept', 'dual aspect concept'], 'Prudence avoids overstating profit or assets.'],
    ['Using the same accounting method year after year is the:', 'consistency concept', ['materiality concept', 'conservatism concept', 'cost concept'], 'Consistency makes statements of different years comparable.'],
    ['Ignoring insignificant items or lumping them together follows the:', 'materiality concept', ['going concern concept', 'matching concept', 'dual aspect concept'], 'Only items that could influence a user’s decision need separate disclosure.'],
    ['Revenue is recorded when it is earned, even if cash is received later. This is:', 'the revenue recognition (realisation) concept', ['the money measurement concept', 'the cost concept', 'the entity concept'], 'Revenue is recognised when the sale is made, not when cash comes in.'],
  ]),
  mcq('mcq-basis', 'XI.1.basis', 'Cash and accrual basis of accounting', [
    ['Under the cash basis of accounting, a transaction is recorded when:', 'cash is actually received or paid', ['the transaction is agreed', 'the invoice is raised', 'the audit is completed'], 'The cash basis ignores amounts that are due but not yet paid.'],
    ['Under the accrual basis, an expense is recorded when:', 'it is incurred, whether or not it has been paid', ['it is paid in cash', 'the auditor approves it', 'the next year begins'], 'Accrual accounting records outstanding and prepaid items.'],
    ['Rent for March, paid in April, is under the accrual basis shown as:', 'an outstanding expense of the year ended March', ['an expense of the next year', 'a prepaid expense', 'a capital item'], 'The expense belongs to the period in which the benefit was used.'],
    ['Income earned but not yet received is called:', 'accrued income', ['unearned income', 'capital receipt', 'drawings'], 'It is a current asset until received.'],
    ['Income received in advance is shown in the balance sheet as:', 'a liability', ['an asset', 'capital', 'an expense'], 'The firm still owes the service or goods to the payer.'],
    ['Which basis is followed by companies as required under the Companies Act?', 'The accrual basis', ['The cash basis', 'The single-entry basis', 'The hybrid cash basis only'], 'Company accounts must follow the accrual basis.'],
  ]),
  mcq('mcq-standards', 'XI.1.standards', 'Accounting standards: AS and Ind AS', [
    ['Accounting Standards (AS) in India are issued by:', 'the Institute of Chartered Accountants of India (ICAI)', ['the Reserve Bank of India', 'the CBSE', 'the Ministry of Education'], 'ICAI formulates the AS; Ind AS are notified by the Ministry of Corporate Affairs.'],
    ['Ind AS stands for:', 'Indian Accounting Standards, converged with IFRS', ['Indian Auditing Standards', 'Internal Accounting System', 'Indirect Accounting Statement'], 'Ind AS are Indian standards that follow international (IFRS) practice.'],
    ['The main purpose of accounting standards is to:', 'bring uniformity and comparability in financial statements', ['reduce the tax payable', 'increase the profit shown', 'remove the need for audit'], 'Standards harmonise the accounting policies used by different firms.'],
    ['The standard that deals with the Cash Flow Statement is:', 'AS 3 (Revised)', ['AS 1', 'AS 2', 'AS 10'], 'AS 3 (Revised) governs cash flow statements.'],
    ['The standard that deals with intangible assets such as goodwill is:', 'AS 26', ['AS 3', 'AS 5', 'AS 10'], 'AS 26 covers intangible assets.'],
    ['Ind AS are notified by the:', 'Ministry of Corporate Affairs', ['Institute of Cost Accountants', 'Reserve Bank of India', 'Election Commission'], 'The MCA notifies Ind AS applicable to specified companies.'],
  ]),
  mcq('mcq-gst', 'XI.1.gst', 'GST: characteristics and advantages', [
    ['GST is best described as:', 'a destination-based indirect tax on the supply of goods and services', ['a direct tax on income', 'a tax only on imports', 'a tax only on luxury goods'], 'GST is levied on supply and borne by the final consumer.'],
    ['On an intra-state supply, GST is charged as:', 'CGST and SGST', ['IGST only', 'customs duty', 'income tax'], 'Central and State GST are both levied on a supply within a state.'],
    ['On an inter-state supply, the tax charged is:', 'IGST', ['CGST and SGST', 'Only SGST', 'Only excise duty'], 'IGST is levied and collected by the Centre on inter-state supplies.'],
    ['Input tax credit means:', 'credit for the GST paid on purchases, set off against the GST payable on sales', ['a refund of income tax', 'a discount allowed to the customer', 'a loan from the government'], 'It avoids tax on tax, removing the cascading effect.'],
    ['GST was introduced in India with effect from:', '1 July 2017', ['1 April 2010', '1 January 2020', '15 August 1947'], 'The GST regime started on 1 July 2017.'],
    ['Which of the following is NOT replaced by GST?', 'Income tax', ['Value Added Tax (VAT)', 'Service tax', 'Central excise duty'], 'GST is an indirect tax; income tax is a direct tax and continues.'],
  ]),
  mcq('mcq-vouchers', 'XI.2.vouchers', 'Source documents and vouchers', [
    ['A document that is the written evidence of a business transaction is a:', 'voucher', ['trial balance', 'ledger', 'balance sheet'], 'Vouchers support the entries made in the books.'],
    ['A bill sent by the seller to the buyer showing the goods, quantity and price is an:', 'invoice', ['debit note', 'cash receipt', 'pay-in-slip'], 'The invoice is the source document for sales and purchases.'],
    ['A debit note is sent by the buyer to the seller when:', 'goods are returned to the seller', ['goods are bought in bulk', 'cash is deposited', 'rent is paid'], 'It informs the seller that the buyer is debiting their account.'],
    ['A credit note is issued by the seller when:', 'the customer returns goods', ['goods are sold on credit', 'cash is received', 'wages are paid'], 'It informs the buyer that their account has been credited.'],
    ['A pay-in-slip is used to:', 'deposit cash or cheques into the bank', ['issue goods to a customer', 'order goods from a supplier', 'record depreciation'], 'The bank stamps its counterfoil as proof of deposit.'],
    ['Source documents are important mainly because they:', 'provide evidence for the entries and help in audit', ['increase the profit', 'replace the ledger', 'avoid the need for a trial balance'], 'Every entry should be traceable to a document.'],
    ['A cash memo is issued for a:', 'cash sale', ['credit sale', 'credit purchase', 'sales return'], 'A cash memo is the evidence of a cash sale.'],
  ]),
  mcq('mcq-expenditure', 'XI.3.concepts', 'Capital and revenue items', [
    ['Purchase of machinery is:', 'capital expenditure', ['revenue expenditure', 'revenue receipt', 'deferred revenue expenditure'], 'It gives benefit for many years and creates an asset.'],
    ['Repairs of machinery to keep it in working order is:', 'revenue expenditure', ['capital expenditure', 'capital receipt', 'drawings'], 'Its benefit is used up within the year.'],
    ['Wages paid for installing newly bought machinery are:', 'capital expenditure', ['revenue expenditure', 'a revenue receipt', 'drawings'], 'Costs of bringing an asset to a usable condition are added to its cost.'],
    ['Sale of old furniture is a:', 'capital receipt', ['revenue receipt', 'revenue expenditure', 'capital expenditure'], 'Sale of a fixed asset is a capital receipt.'],
    ['Interest received on an investment is a:', 'revenue receipt', ['capital receipt', 'capital expenditure', 'drawings'], 'It relates to the earning activity of the year.'],
    ['A bank loan taken by the business is a:', 'capital receipt', ['revenue receipt', 'revenue expenditure', 'profit'], 'It is a liability, not income.'],
    ['Salary paid to staff is:', 'revenue expenditure', ['capital expenditure', 'capital receipt', 'revenue receipt'], 'The benefit is used up in the same year.'],
    ['Legal expenses paid on buying land are:', 'capital expenditure', ['revenue expenditure', 'drawings', 'revenue receipt'], 'They are part of the cost of acquiring the land.'],
  ]),
  mcq('mcq-marshalling', 'XI.3.balance-sheet', 'Balance sheet: grouping and marshalling', [
    ['Arranging the assets and liabilities in a balance sheet in a definite order is called:', 'marshalling', ['posting', 'rectification', 'closing'], 'Marshalling is done in order of liquidity or of permanence.'],
    ['In the order of liquidity, the first asset shown is:', 'cash in hand', ['goodwill', 'land and building', 'machinery'], 'The most liquid asset comes first.'],
    ['In the order of permanence, the first asset shown is generally:', 'goodwill', ['cash in hand', 'debtors', 'closing stock'], 'The least liquid (most permanent) asset comes first.'],
    ['In the balance sheet, drawings are:', 'deducted from capital', ['added to capital', 'shown as an asset', 'shown as a liability'], 'Drawings reduce the owner’s claim.'],
    ['Net profit for the year is:', 'added to capital', ['deducted from capital', 'shown as a liability to outsiders', 'shown as a current asset'], 'Profit belongs to the owner.'],
    ['Closing stock appears in:', 'the Trading Account (credit) and on the assets side of the balance sheet', ['only the Profit and Loss Account', 'only the liabilities side', 'neither the Trading Account nor the balance sheet'], 'It reduces the cost of goods sold and is an asset at the year end.'],
    ['Prepaid expenses are shown on the balance sheet as:', 'a current asset', ['a current liability', 'capital', 'drawings'], 'The firm has paid for a benefit it will receive next year.'],
  ]),
  mcq('mcq-partnership', 'XII.1.fundamentals', 'Partnership: features and Partnership Act', [
    ['Partnership is governed in India by the:', 'Indian Partnership Act, 1932', ['Companies Act, 2013', 'Sale of Goods Act, 1930', 'Negotiable Instruments Act, 1881'], 'Section 4 of the 1932 Act defines partnership.'],
    ['In the absence of a partnership deed, profits are shared:', 'equally', ['in the ratio of capitals', 'in the ratio of drawings', 'in the ratio of experience'], 'The Act provides equal sharing unless agreed otherwise.'],
    ['In the absence of a deed, interest on partners’ capital is:', 'not allowed', ['allowed at 6% p.a.', 'allowed at 12% p.a.', 'allowed at the bank rate'], 'No interest on capital unless the deed provides for it.'],
    ['In the absence of a deed, interest on a partner’s loan to the firm is allowed at:', '6% per annum', ['12% per annum', '9% per annum', 'nil'], 'The Act provides 6% p.a. on a partner’s loan.'],
    ['In the absence of a deed, a partner is entitled to salary:', 'not at all', ['of ₹5,000 per month', 'equal to the other partners', 'of 10% of the profit'], 'Partners are not entitled to a salary unless the deed says so.'],
    ['The liability of the partners of a firm is:', 'unlimited and joint and several', ['limited to their capital', 'limited to the profit share', 'nil'], 'Each partner can be called on to pay the firm’s debts out of personal property.'],
    ['The minimum number of partners in a partnership firm is:', 'two', ['one', 'seven', 'ten'], 'Two persons are needed to form a partnership.'],
    ['A written agreement among partners about their relationship is called the:', 'partnership deed', ['memorandum of association', 'articles of association', 'prospectus'], 'The deed sets out profit-sharing, interest, salary and other terms.'],
  ]),
  mcq('mcq-company', 'XII.2.fundamentals', 'Companies and share capital', [
    ['The share capital that a company is authorised to issue by its Memorandum is the:', 'authorised capital', ['issued capital', 'called-up capital', 'paid-up capital'], 'Authorised capital is the maximum the company can raise by shares.'],
    ['The part of the authorised capital offered to the public for subscription is the:', 'issued capital', ['authorised capital', 'reserve capital', 'paid-up capital'], 'The rest remains unissued.'],
    ['The portion of subscribed capital that has been demanded from shareholders is the:', 'called-up capital', ['uncalled capital', 'authorised capital', 'reserve capital'], 'Called-up capital less calls in arrears is paid-up capital.'],
    ['Calls in arrears are:', 'amounts called but not yet paid by the shareholders', ['amounts received before they are due', 'amounts refunded to applicants', 'shares forfeited'], 'They reduce the paid-up capital.'],
    ['Securities premium may be used by a company to:', 'issue fully paid bonus shares', ['pay dividend in cash', 'pay the directors’ salaries', 'buy goods for sale'], 'The Companies Act restricts the use of securities premium.'],
    ['The minimum number of members in a private company is:', 'two', ['seven', 'one hundred', 'fifty'], 'A public company needs at least seven; a private company two.'],
    ['Preference shareholders:', 'have a preferential right to dividend and to return of capital', ['have no right to dividend', 'always have voting rights equal to equity shareholders', 'are the owners of the company’s assets'], 'Preference shares carry a fixed rate of dividend, paid before equity dividend.'],
    ['Reserve capital is:', 'the part of uncalled capital that can be called only on winding up', ['the amount kept as general reserve', 'the profit retained from last year', 'money refunded to applicants'], 'It cannot be called in the ordinary course of business.'],
  ]),
  mcq('mcq-share-concepts', 'XII.2.concepts', 'Private placement, ESOP and sweat equity', [
    ['Private placement is:', 'an offer of securities to a select group of persons, not to the public', ['an offer to the general public by prospectus', 'a buy-back of shares', 'a refund of application money'], 'It is a non-public offer to chosen investors.'],
    ['An employee stock option plan (ESOP) gives employees:', 'the right to buy shares at a pre-determined price', ['an automatic bonus in cash', 'a right to become a director', 'a loan from the company'], 'The option is exercised after the vesting period.'],
    ['Sweat equity shares are issued:', 'to employees or directors at a discount or for know-how and similar contributions', ['only to the public', 'only to debenture holders', 'only to banks'], 'They reward employees for their know-how or value addition.'],
    ['When shares are issued to a vendor for machinery purchased, the entry credits:', 'share capital (and securities premium, if any)', ['cash', 'bank loan', 'drawings'], 'The shares are issued for a consideration other than cash.'],
    ['The period between the grant of an option and the earliest date it can be exercised is the:', 'vesting period', ['lock-out period', 'accounting period', 'call period'], 'The vesting period is set by the company.'],
    ['Private placement differs from a public issue because it:', 'is not offered to the general public', ['is always at a lower price', 'needs no shareholders’ approval', 'can never be for debentures'], 'It targets a limited number of identified investors.'],
  ]),
  mcq('mcq-disclosure', 'XII.2.disclosure', 'Disclosure of share capital', [
    ['In the balance sheet of a company, share capital is shown under:', 'shareholders’ funds', ['non-current assets', 'current assets', 'current liabilities'], 'Share capital is part of Equity and Liabilities, under shareholders’ funds.'],
    ['Securities premium is shown under:', 'reserves and surplus', ['share capital', 'current liabilities', 'non-current assets'], 'It is a reserve, not part of share capital.'],
    ['Calls in arrears are:', 'deducted from the subscribed capital', ['added to the subscribed capital', 'shown as an asset', 'shown as a loan'], 'Only the amount actually paid is paid-up capital.'],
    ['Calls in advance are shown in the balance sheet as:', 'a liability, not as part of share capital', ['part of share capital', 'an asset', 'a reserve'], 'The company owes the amount until it is called.'],
    ['Company balance sheets are prepared in the format prescribed by:', 'Schedule III of the Companies Act, 2013', ['Schedule I of the Sale of Goods Act', 'the Partnership Act, 1932', 'the Income Tax Act'], 'Schedule III prescribes the format and headings.'],
    ['Authorised, issued and subscribed capital are disclosed:', 'in the notes to accounts of the balance sheet', ['in the cash flow statement only', 'in the trading account', 'nowhere'], 'The notes give the break-up of share capital.'],
  ]),
  mcq('mcq-schedule3', 'XII.3.statements', 'Company financial statements: Schedule III heads', [
    ['Long-term borrowings are shown under:', 'non-current liabilities', ['current liabilities', 'current assets', 'shareholders’ funds'], 'Borrowings due after more than 12 months are non-current.'],
    ['Trade payables are shown under:', 'current liabilities', ['non-current liabilities', 'shareholders’ funds', 'non-current assets'], 'They are payable within the operating cycle.'],
    ['Inventories (stock) are shown under:', 'current assets', ['non-current assets', 'current liabilities', 'shareholders’ funds'], 'Stock is held for sale in the ordinary course of business.'],
    ['Property, plant and equipment are shown under:', 'non-current assets', ['current assets', 'current liabilities', 'shareholders’ funds'], 'They are held for use for more than a year.'],
    ['Cash and cash equivalents are shown under:', 'current assets', ['non-current assets', 'non-current liabilities', 'reserves and surplus'], 'Cash is the most liquid current asset.'],
    ['Provision for tax is shown under:', 'short-term provisions (current liabilities)', ['non-current assets', 'shareholders’ funds', 'long-term borrowings'], 'It is a current obligation for the year.'],
    ['Capital work-in-progress is shown under:', 'non-current assets', ['current assets', 'current liabilities', 'shareholders’ funds'], 'It is an asset still under construction for use in the business.'],
  ]),
  mcq('mcq-comparative', 'XII.3.comparative', 'Comparative statements: concepts', [
    ['A comparative statement shows the figures of:', 'two or more years side by side with the changes', ['one year only', 'only the current year’s percentages of total', 'the budget for the next year'], 'It helps compare changes from year to year.'],
    ['In a comparative statement, the percentage change is calculated on the base of the:', 'previous year', ['current year', 'average of the two years', 'total assets'], 'The earlier year is the base for measuring change.'],
    ['The absolute change in a comparative statement is:', 'current year figure − previous year figure', ['previous year figure − current year figure', 'current year ÷ previous year', 'average of the two years'], 'A positive result shows an increase.'],
    ['Comparative statements are mainly useful for:', 'studying trends and changes over time', ['recording journal entries', 'preparing the trial balance', 'calculating depreciation'], 'They bring out the direction and size of change.'],
    ['If an item was ₹50,000 last year and ₹60,000 this year, its percentage change is:', '20% increase', ['10% increase', '16.7% increase', '20% decrease'], '(60,000 − 50,000) ÷ 50,000 × 100 = 20%.'],
    ['In a comparative balance sheet, an increase in current liabilities with no change in current assets shows:', 'a weaker liquidity position', ['a stronger liquidity position', 'no effect on liquidity', 'a higher profit'], 'More liabilities against the same assets reduce the current ratio.'],
  ]),
  mcq('mcq-common-size', 'XII.3.common-size', 'Common-size statements: concepts', [
    ['In a common-size statement, every item is expressed as a percentage of:', 'a common base such as revenue or total assets', ['the previous year’s figure', 'the profit of the year', 'the capital of the owner'], 'The common base is taken as 100.'],
    ['In a common-size balance sheet the base (100) is usually:', 'the total of the balance sheet', ['revenue from operations', 'net profit', 'share capital'], 'Total assets (= total equity and liabilities) is the base.'],
    ['In a common-size statement of profit and loss the base is:', 'revenue from operations', ['total assets', 'share capital', 'reserves'], 'Each expense is measured against revenue.'],
    ['Common-size statements are especially useful for:', 'comparing firms of different sizes', ['recording transactions', 'computing depreciation', 'preparing the cash book'], 'Percentages remove the effect of size.'],
    ['A common-size statement of two years helps to see:', 'changes in the structure of the statements', ['the audit fee', 'the owner’s drawings', 'the number of customers'], 'The proportion of each item may change from year to year.'],
    ['If revenue is ₹4,00,000 and employee expense is ₹40,000, the common-size percentage of employee expense is:', '10%', ['1%', '40%', '100%'], '40,000 ÷ 4,00,000 × 100 = 10%.'],
  ]),
  mcq('mcq-cfs-classify', 'XII.4.classification', 'Cash flow statement: classifying activities', [
    ['Under AS 3 (Revised), cash received from customers for sales is an:', 'operating activity', ['investing activity', 'financing activity', 'non-cash item'], 'It is a principal revenue-producing activity.'],
    ['Purchase of machinery for cash is an:', 'investing activity', ['operating activity', 'financing activity', 'non-cash item'], 'Acquiring long-term assets is investing.'],
    ['Issue of equity shares for cash is a:', 'financing activity', ['operating activity', 'investing activity', 'non-cash item'], 'It changes the size of owners’ capital.'],
    ['Repayment of a long-term loan is a:', 'financing activity', ['operating activity', 'investing activity', 'non-cash item'], 'It changes the borrowings of the enterprise.'],
    ['Dividend paid to shareholders is a:', 'financing activity', ['operating activity', 'investing activity', 'non-cash item'], 'It is a return paid to the providers of capital.'],
    ['Sale of old machinery for cash is an:', 'investing activity', ['operating activity', 'financing activity', 'non-cash item'], 'Disposal of a long-term asset is investing.'],
    ['Payment to suppliers of goods is an:', 'operating activity', ['investing activity', 'financing activity', 'non-cash item'], 'It relates to the main business activity.'],
    ['Depreciation charged on machinery is:', 'a non-cash item (adjusted in operating activities)', ['an investing activity', 'a financing activity', 'a cash outflow from operating activities'], 'No cash leaves the business when depreciation is charged.'],
    ['Cash deposited into the bank from cash in hand:', 'does not change cash and cash equivalents', ['is an operating inflow', 'is an investing inflow', 'is a financing inflow'], 'Cash and bank are both parts of cash and cash equivalents.'],
  ]),
  mcq('mcq-cas', 'XII.C.cas', 'Computerised accounting system', [
    ['Software that is bought ready-made for general use is called:', 'ready-to-use (off-the-shelf) software', ['tailored software', 'customised hardware', 'operating system only'], 'Ready-made packages suit common needs at a lower cost.'],
    ['Software designed to the specific needs of a particular business is:', 'tailored software', ['ready-to-use software', 'freeware only', 'a spreadsheet'], 'It is built or modified for one firm.'],
    ['An important advantage of a computerised accounting system is:', 'speed and accuracy in processing and reporting', ['it needs no human supervision at all', 'it never needs a backup', 'it makes accounting rules unnecessary'], 'Reports are produced quickly once the entries are made.'],
    ['A risk of using a computerised accounting system is:', 'virus attack or unauthorised access to data', ['no records can be printed', 'accounting rules no longer apply', 'it works only in the morning'], 'Controls such as passwords and backups are needed.'],
    ['A password is used in a computerised system to:', 'prevent unauthorised access', ['speed up posting', 'delete old entries', 'print the trial balance'], 'It is an access-control measure.'],
    ['A copy of the data kept separately to be used after loss of data is a:', 'backup', ['voucher', 'ledger', 'journal'], 'Regular backups protect against loss.'],
    ['A database is:', 'an organised collection of related data', ['a printer', 'a type of voucher', 'a bank account'], 'A DBMS is software to create and manage a database.'],
  ]),
  mcq('mcq-cas-using', 'XII.C.using', 'Using a computerised accounting system', [
    ['Assigning a short code to each ledger account for quick data entry is:', 'codification', ['marshalling', 'posting', 'rectification'], 'Codes make selection and search of accounts easier.'],
    ['A cash deposit into the bank is recorded in accounting software with a:', 'contra voucher', ['sales voucher', 'purchase voucher', 'payment voucher'], 'A contra entry moves money between cash and bank.'],
    ['Non-cash and adjusting entries are normally passed through a:', 'journal voucher', ['receipt voucher', 'contra voucher', 'cheque'], 'Entries like depreciation use the journal voucher.'],
    ['Cash received from a customer is recorded using a:', 'receipt voucher', ['payment voucher', 'journal voucher', 'purchase voucher'], 'A receipt voucher records money coming in.'],
    ['Cash paid to a supplier is recorded using a:', 'payment voucher', ['receipt voucher', 'sales voucher', 'contra voucher'], 'A payment voucher records money going out.'],
    ['Master data in accounting software means:', 'details of ledger accounts, parties and items entered once and reused', ['the yearly profit', 'only the bank statement', 'the auditor’s report'], 'Master data is set up first and then used in transactions.'],
    ['Year-end closing transfers the balances of nominal accounts to the:', 'profit and loss account', ['cash book', 'sales book', 'bank statement'], 'Closing entries bring revenues and expenses to the P&L account.'],
  ]),
  mcq('mcq-spreadsheet', 'XII.C.spreadsheet', 'Spreadsheet basics for accounting', [
    ['A spreadsheet formula always begins with:', 'the = sign', ['the # sign', 'the ₹ sign', 'a full stop'], 'The = sign tells the spreadsheet that what follows is a formula.'],
    ['The cell reference B3 means:', 'column B, row 3', ['row B, column 3', 'cell B multiplied by 3', 'the third sheet'], 'Column letter first, then row number.'],
    ['The formula =SUM(A1:A5) gives:', 'the total of the values in cells A1 to A5', ['the average of A1 and A5', 'the product of A1 to A5', 'the count of text cells'], 'SUM adds a range of cells.'],
    ['The spreadsheet function normally used to find a loan instalment (EMI) is:', 'PMT', ['SUM', 'COUNT', 'MAX'], 'PMT computes the periodic payment of a loan.'],
    ['A cell reference fixed with $ signs, such as $B$2, is called:', 'an absolute reference', ['a relative reference', 'a circular reference', 'a text reference'], 'It does not change when the formula is copied.'],
    ['The function that returns one value if a condition is true and another if false is:', 'IF', ['SUM', 'PMT', 'AVERAGE'], 'IF is a logical function.'],
    ['A rectangular group of cells such as A1:C4 is called a:', 'range', ['voucher', 'ledger', 'macro only'], 'A range is written with a colon between its first and last cells.'],
  ]),
];

export const V2_GENERATORS: readonly Gen[] = [...NUMERIC, ...BANKS];
