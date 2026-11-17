import type { WhatIf } from '../spec';

/** Guided experiments, keyed by lab id. Each changes the worked example in one teaching-relevant way. */
export const WHAT_IF: Readonly<Record<string, readonly WhatIf[]>> = {
  'xi-depreciation': [
    {
      label: 'Use SLM instead',
      set: { method: 'SLM' },
      prompt: 'Straight line charges the same ₹10,000 every year. WDV charged less each year — compare the closing values and the profit or loss on sale.',
    },
    { label: 'Sell for ₹80,000', set: { sale: '80000' }, prompt: 'Now the sale price is above the book value, so the loss on sale turns into a profit.' },
    { label: 'Use a provision account', set: { recording: 'PROVISION' }, prompt: 'The asset stays at cost; the credit goes to Provision for Depreciation. Same expense, different ledger.' },
    { label: 'Bought 4 months before year end', set: { months: '4' }, prompt: 'Only 4/12 of the first year is charged, and every later WDV year changes because the opening balance is higher.' },
  ],
  'xi-brs': [
    { label: 'Start from the pass book', set: { start: 'PASS_BOOK', balance: '56500' }, prompt: 'Starting from the other book reverses every Add and Less — and lands back on ₹50,000.' },
    { label: 'Make it an overdraft', set: { balance: '-20000' }, prompt: 'A minus sign means overdraft; the same items now move an overdraft balance.' },
  ],
  'xi-gst': [
    { label: 'Inter-state sale', set: { inter: 'Y' }, prompt: 'CGST and SGST are replaced by a single IGST of the same total rate.' },
    { label: 'No trade discount', set: { td: '0' }, prompt: 'Taxable value rises, and so does GST — tax is charged after the trade discount.' },
  ],
  'xi-incomplete': [{ label: 'No drawings', set: { draw: '0' }, prompt: 'Without drawings the increase in capital understates profit less: profit falls by the drawings you added back.' }],
  'xii-appropriation': [
    { label: 'Remove the guarantee', set: { gPartner: '', gMin: '' }, prompt: 'Without the guarantee, profit is simply shared 4:3:3.' },
    { label: 'Raise profit to ₹1,50,000', set: { profit: '150000' }, prompt: 'When profit is large enough, C’s share already exceeds the guarantee and nobody else has to make it up.' },
  ],
  'xii-ratio-change': [{ label: 'No goodwill', set: { gw: '0' }, prompt: 'Only reserves and revaluation are shared in the old ratio; no one pays or receives goodwill.' }],
  'xii-admission': [{ label: 'No goodwill', set: { gw: '0' }, prompt: 'The sacrifice is unchanged, but no premium is brought in.' }],
  'xii-exit': [{ label: 'No goodwill', set: { gw: '0' }, prompt: 'The retiring partner gets only capital, reserve and revaluation share.' }],
  'xii-debentures': [{ label: 'Issue at par', set: { issue: '100' }, prompt: 'No discount on issue; only the premium on redemption remains as a loss.' }],
};
