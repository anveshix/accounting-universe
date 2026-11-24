/**
 * Registry & page router for the 10 flagship CBSE Class XI & XII Simulator & Visualiser experiences (A–J).
 */
import { CORE_SIMULATORS, coreSimById, type CoreSimId } from '../../../../packages/curriculum/src';
import { h, mount } from '../dom';
import { renderCashbookBrsLab } from './cashbookBrsLab';
import { renderCompanyLab } from './companySimLab';
import { renderComputerisedAccountingLab } from './computerisedSimLab';
import { renderDepreciationLab } from './depreciationSimLab';
import { renderEquationLab } from './equationLab';
import { renderFinalAccountsLab } from './finalAccountsSimLab';
import { renderJournalLedgerLab } from './journalLedgerLab';
import { renderPartnershipLab } from './partnershipSimLab';
import { renderFinancialAnalysisLab } from './financialAnalysisSimLab';
import { mountSimulatorShell, type SimulatorRenderer } from './shell';
import { renderTbErrorLab } from './tbErrorLab';

const RENDERERS: Record<CoreSimId, SimulatorRenderer> = {
  'equation-lab': renderEquationLab,
  'journal-ledger-lab': renderJournalLedgerLab,
  'cashbook-brs-lab': renderCashbookBrsLab,
  'depreciation-lab': renderDepreciationLab,
  'tb-error-lab': renderTbErrorLab,
  'final-accounts-lab': renderFinalAccountsLab,
  'partnership-lab': renderPartnershipLab,
  'company-lab': renderCompanyLab,
  'financial-analysis-lab': renderFinancialAnalysisLab,
  'computerised-accounting-lab': renderComputerisedAccountingLab,
};

let activeCleanup: (() => void) | null = null;

export function disposeActiveSimLab(): void {
  if (activeCleanup) {
    try {
      activeCleanup();
    } finally {
      activeCleanup = null;
    }
  }
}

export function simLabPage(root: HTMLElement, id: string): void {
  disposeActiveSimLab();
  const spec = coreSimById(id);
  if (!spec) {
    mount(
      root,
      h(
        'div',
        { class: 'panel' },
        h('h2', {}, 'Simulator not found'),
        h('p', {}, `No flagship simulator has id "${id}".`),
        h('a', { class: 'btn', href: '#/sims' }, 'Back to CBSE Simulator & Visualiser Hub'),
      ),
    );
    return;
  }
  const renderer = RENDERERS[spec.id];
  activeCleanup = mountSimulatorShell(root, spec, renderer, CORE_SIMULATORS);
}
