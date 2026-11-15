/**
 * Hindi (Devanagari) accounting terms, following the terminology of the NCERT Hindi-medium Accountancy (लेखाशास्त्र) textbooks.
 * STATUS: DRAFT — written by the developer, NOT yet reviewed by a qualified Hindi-medium Accountancy teacher (handoff D10).
 * The UI must label every Hindi screen as a draft until `HINDI_REVIEWED` becomes true through that review.
 */
export const HINDI_REVIEWED = false as const;

export const TERM_HI = {
  debit: 'नाम (Dr.)', credit: 'जमा (Cr.)', debitWord: 'नाम', creditWord: 'जमा',
  assets: 'परिसंपत्तियाँ', liabilities: 'देयताएँ', capital: 'पूँजी', drawings: 'आहरण', expense: 'व्यय', revenue: 'आय',
  equation: 'लेखांकन समीकरण', journal: 'रोज़नामचा (जर्नल)', ledger: 'खाता बही', trialBalance: 'तलपट', suspense: 'उचंत खाता', balanceCd: 'शेष आगे ले गए (c/d)',
  increase: 'वृद्धि', decrease: 'कमी', account: 'खाता',
} as const;
/** Account type → Hindi name (as used in rule explanations). */
export const TYPE_HI: Record<string, string> = { ASSET: 'परिसंपत्ति', LIABILITY: 'देयता', CAPITAL: 'पूँजी', REVENUE: 'आय', EXPENSE: 'व्यय', DRAWINGS: 'आहरण' };

const A: Record<string, string> = {
  Cash: 'रोकड़', Bank: 'बैंक', Capital: 'पूँजी', Drawings: 'आहरण', Sales: 'विक्रय', Purchases: 'क्रय', Debtors: 'देनदार', Creditors: 'लेनदार',
  Rent: 'किराया', 'Rent Paid': 'किराया (भुगतान)', 'Rent Received': 'किराया (प्राप्त)', Salary: 'वेतन', Salaries: 'वेतन', Wages: 'मज़दूरी',
  Furniture: 'फ़र्नीचर', Machinery: 'मशीनरी', Building: 'भवन', Buildings: 'भवन', Vehicle: 'वाहन', Computer: 'कम्प्यूटर', Stock: 'स्टॉक', 'Opening Stock': 'प्रारंभिक स्टॉक',
  'Bank Loan': 'बैंक ऋण', 'Bank Overdraft': 'बैंक अधिविकर्ष', 'Bills Payable': 'देय विपत्र', 'Bills Receivable': 'प्राप्य विपत्र',
  'Commission Received': 'प्राप्त कमीशन', 'Commission Recd': 'प्राप्त कमीशन', 'Commission Rec.': 'प्राप्त कमीशन', 'Interest Received': 'प्राप्त ब्याज', 'Dividend Received': 'प्राप्त लाभांश',
  'Discount Allowed': 'दिया गया बट्टा', 'Discount Received': 'प्राप्त बट्टा', 'Bad Debts': 'डूबत ऋण', 'Bad Debts Recovered': 'डूबत ऋण की वसूली', Depreciation: 'मूल्यह्रास',
  Insurance: 'बीमा', 'Insurance Premium': 'बीमा प्रीमियम', Electricity: 'बिजली', Advertisement: 'विज्ञापन', 'Advertisement Exp.': 'विज्ञापन व्यय',
  'Carriage Inwards': 'आवक गाड़ी-भाड़ा', 'Carriage Outwards': 'जावक गाड़ी-भाड़ा', 'Sales Return': 'विक्रय वापसी', 'Sales Returns': 'विक्रय वापसी', 'Purchase Return': 'क्रय वापसी', 'Purchase Returns': 'क्रय वापसी',
  'Outstanding Salary': 'अदत्त वेतन', 'Outstanding Salaries': 'अदत्त वेतन', 'Prepaid Rent': 'पूर्वदत्त किराया', 'Prepaid Salary': 'पूर्वदत्त वेतन', 'Prepaid Expenses': 'पूर्वदत्त व्यय',
  'Accrued Income': 'उपार्जित आय', 'Accrued Interest': 'उपार्जित ब्याज', 'Accrued Commission': 'उपार्जित कमीशन', 'Unearned Income': 'अनुपार्जित आय', 'Unearned Commission': 'अनुपार्जित कमीशन', 'Unearned Rent': 'अनुपार्जित किराया',
  'Advance from Customer': 'ग्राहक से अग्रिम', 'Advance Income': 'अग्रिम प्राप्त आय', Investments: 'निवेश', Goodwill: 'ख्याति', Patents: 'पेटेंट', Repairs: 'मरम्मत', Stationery: 'लेखन सामग्री',
  Charity: 'दान', 'Loss by Fire': 'आग से हानि', 'Loss by Theft': 'चोरी से हानि', 'Interest on Capital': 'पूँजी पर ब्याज', 'Interest on Drawings': 'आहरण पर ब्याज',
  'Provision for Bad Debts': 'संदिग्ध ऋणों के लिए प्रावधान', 'Provision for Dep': 'मूल्यह्रास के लिए प्रावधान', 'Miscellaneous Income': 'विविध आय', 'Staff Welfare Exp': 'कर्मचारी कल्याण व्यय',
  'Bank Charges': 'बैंक प्रभार', 'Mohan (Debtor)': 'मोहन (देनदार)', 'P&L Profit': 'लाभ (पूँजी में)',
  'Input CGST': 'इनपुट CGST', 'Input SGST': 'इनपुट SGST', 'Input IGST': 'इनपुट IGST', 'Output CGST': 'आउटपुट CGST', 'Output SGST': 'आउटपुट SGST', 'Output IGST': 'आउटपुट IGST',
};
/** Hindi name of an account, falling back to the English name (never invents a translation). */
export const accountHi = (name: string): string => A[name.replace(/\s+A\/c$/i, '').trim()] ?? name;
export const hasAccountHi = (name: string): boolean => name.replace(/\s+A\/c$/i, '').trim() in A;
