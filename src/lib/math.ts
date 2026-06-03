/**
 * Core Mathematics and Financial Engines for Wealth Manager Enterprise
 */

// --- 1. Smart Budgeting (Proportional Allocation) ---
export interface BudgetAllocation {
  tabungan: number;
  darurat: number;
  jajan: number;
}

export function adjustProportionally(
  changedKey: keyof BudgetAllocation,
  newValue: number,
  current: BudgetAllocation
): BudgetAllocation {
  const deltaX = newValue - current[changedKey];
  const keys = ['tabungan', 'darurat', 'jajan'] as const;
  const otherKeys = keys.filter(k => k !== changedKey);
  const yKey = otherKeys[0];
  const zKey = otherKeys[1];

  const y = current[yKey];
  const z = current[zKey];

  let newY: number;
  let newZ: number;

  if (y + z === 0) {
    // If both other sliders are 0, split the remaining percent equally
    const remaining = 100 - newValue;
    newY = remaining / 2;
    newZ = remaining / 2;
  } else {
    // Delta adjustment formula: dy = -dx * (y / (y + z))
    newY = y - deltaX * (y / (y + z));
    newZ = z - deltaX * (z / (y + z));
  }

  // Clamp values between 0 and 100
  newY = Math.max(0, Math.min(100, newY));
  newZ = Math.max(0, Math.min(100, newZ));

  const result = {
    [changedKey]: newValue,
    [yKey]: parseFloat(newY.toFixed(2)),
    [zKey]: parseFloat(newZ.toFixed(2))
  } as BudgetAllocation;

  // Force strict summing to exactly 100% to handle floating-point issues
  const sum = result.tabungan + result.darurat + result.jajan;
  if (sum !== 100) {
    const diff = 100 - sum;
    result[yKey] = parseFloat((result[yKey] + diff).toFixed(2));
  }

  return result;
}

// --- 2. Loan Engine (Amortization Calculator) ---
export interface AmortizationPeriod {
  month: number;
  installment: number;
  principalPayment: number;
  interestPayment: number;
  remainingPrincipal: number;
}

export interface AmortizationResult {
  installmentPerMonth: number; // Flat and Annuity are fixed, Effective is first month
  totalInterest: number;
  totalPayment: number;
  schedule: AmortizationPeriod[];
}

export function calculateAmortization(
  principal: number,
  annualInterestRatePct: number,
  tenorMonths: number,
  type: 'FLAT' | 'EFFECTIVE' | 'ANNUITY'
): AmortizationResult {
  const i = (annualInterestRatePct / 100) / 12; // Monthly interest rate as decimal
  const t = tenorMonths;
  const schedule: AmortizationPeriod[] = [];

  let totalInterest = 0;
  let remainingPrincipal = principal;

  if (type === 'FLAT') {
    const principalPayment = principal / t;
    const interestPayment = principal * i;
    const installment = principalPayment + interestPayment;
    const totalPayment = installment * t;
    totalInterest = interestPayment * t;

    for (let m = 1; m <= t; m++) {
      remainingPrincipal -= principalPayment;
      schedule.push({
        month: m,
        installment,
        principalPayment,
        interestPayment,
        remainingPrincipal: Math.max(0, parseFloat(remainingPrincipal.toFixed(2)))
      });
    }

    return {
      installmentPerMonth: installment,
      totalInterest,
      totalPayment,
      schedule
    };
  }

  if (type === 'EFFECTIVE') {
    const principalPayment = principal / t;
    let totalPayment = 0;

    for (let m = 1; m <= t; m++) {
      const interestPayment = remainingPrincipal * i;
      const installment = principalPayment + interestPayment;
      totalInterest += interestPayment;
      totalPayment += installment;
      remainingPrincipal -= principalPayment;

      schedule.push({
        month: m,
        installment,
        principalPayment,
        interestPayment,
        remainingPrincipal: Math.max(0, parseFloat(remainingPrincipal.toFixed(2)))
      });
    }

    return {
      installmentPerMonth: schedule[0]?.installment || 0,
      totalInterest,
      totalPayment,
      schedule
    };
  }

  // ANNUITY
  // Installment A = P * (i * (1 + i)^n) / ((1 + i)^n - 1)
  let installment = 0;
  if (i === 0) {
    installment = principal / t;
  } else {
    installment = principal * (i * Math.pow(1 + i, t)) / (Math.pow(1 + i, t) - 1);
  }

  const totalPayment = installment * t;
  totalInterest = totalPayment - principal;

  for (let m = 1; m <= t; m++) {
    const interestPayment = remainingPrincipal * i;
    const principalPayment = installment - interestPayment;
    remainingPrincipal -= principalPayment;

    schedule.push({
      month: m,
      installment,
      principalPayment,
      interestPayment,
      remainingPrincipal: Math.max(0, parseFloat(remainingPrincipal.toFixed(2)))
    });
  }

  return {
    installmentPerMonth: installment,
    totalInterest,
    totalPayment,
    schedule
  };
}

// --- 3. Budget Advisor (Income-based Recommendation) ---
export interface AdvisorRecommendation {
  tier: number;
  tierLabel: string;
  tabunganPct: number;
  daruratPct: number;
  jajanPct: number;
  tabunganVal: number;
  daruratVal: number;
  jajanVal: number;
}

export function getBudgetRecommendation(ndi: number): AdvisorRecommendation {
  let tier = 1;
  let tierLabel = 'Sangat Terbatas (Perlu Penghematan)';
  let tabunganPct = 10;
  let daruratPct = 20;
  let jajanPct = 70;

  if (ndi >= 5000000 && ndi < 15000000) {
    tier = 2;
    tierLabel = 'Menengah (Ekonomi Sehat)';
    tabunganPct = 20;
    daruratPct = 30;
    jajanPct = 50;
  } else if (ndi >= 15000000) {
    tier = 3;
    tierLabel = 'Mapan (Ekonomi Kuat)';
    tabunganPct = 30;
    daruratPct = 40;
    jajanPct = 30;
  }

  return {
    tier,
    tierLabel,
    tabunganPct,
    daruratPct,
    jajanPct,
    tabunganVal: (tabunganPct / 100) * ndi,
    daruratVal: (daruratPct / 100) * ndi,
    jajanVal: (jajanPct / 100) * ndi
  };
}

// --- 4. Boarding Student (Anak Kost) Survival Engine ---
export interface AnakKostMetrics {
  daysTotal: number;
  daysRemaining: number;
  baseLimit: number;
  neededFund: number;
  limitToday: number;
  accumulatedSavings: number;
  isPenalty: boolean;
  thresholdRed: number;
}

export function calculateAnakKostMetrics(
  initialMoney: number, // Jatah Hiburan / Dana Bersih awal
  actualMoneyRemaining: number, // Sisa dana aktual saat ini
  todayDateNum: number, // tanggal hari ini (1-31)
  daysInMonth: number,
  customThresholdPercent: number = 20, // default 20%
  customThresholdVal?: number // manual override
): AnakKostMetrics {
  // Days engine
  const daysTotal = daysInMonth;
  const daysRemaining = Math.max(1, daysTotal - todayDateNum + 1); // inclusive of today

  // Limit dasar = floor(D_awal / D_total)
  const baseLimit = Math.floor(initialMoney / daysTotal);

  // Dana dibutuhkan = D_sisa * Limit_base
  const neededFund = daysRemaining * baseLimit;

  let limitToday = 0;
  let accumulatedSavings = 0;
  let isPenalty = false;

  if (actualMoneyRemaining < neededFund) {
    // PENALTY / OVERSPENDING: limit_today = floor(D_aktual / D_sisa)
    isPenalty = true;
    limitToday = Math.floor(actualMoneyRemaining / daysRemaining);
    accumulatedSavings = 0;
  } else {
    // REWARD / SAVING: limit_today = limit_base + floor((D_aktual - D_needed) / D_sisa)
    isPenalty = false;
    limitToday = baseLimit + Math.floor((actualMoneyRemaining - neededFund) / daysRemaining);
    accumulatedSavings = actualMoneyRemaining - neededFund;
  }

  // Safety threshold red line
  const thresholdRed = customThresholdVal !== undefined && customThresholdVal > 0
    ? customThresholdVal
    : (customThresholdPercent / 100) * limitToday;

  return {
    daysTotal,
    daysRemaining,
    baseLimit,
    neededFund,
    limitToday: Math.max(0, limitToday),
    accumulatedSavings: Math.max(0, accumulatedSavings),
    isPenalty,
    thresholdRed
  };
}

// --- 5. Expression Parser (Inline Calculator) ---
// Safe recursive descent parser — no eval/new Function (blocked on CF Workers)
export function parseInlineExpression(expr: string): number | null {
  const sanitized = expr.replace(/\s+/g, '');
  if (!/^[\d+\-*/.()]+$/.test(sanitized)) return null;

  let pos = 0;

  function peek(): string { return sanitized[pos] || ''; }
  function consume(): string { return sanitized[pos++]; }

  // Grammar: expr = term (('+' | '-') term)*
  function parseExpr(): number {
    let result = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseTerm();
      result = op === '+' ? result + right : result - right;
    }
    return result;
  }

  // term = factor (('*' | '/') factor)*
  function parseTerm(): number {
    let result = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const right = parseFactor();
      result = op === '*' ? result * right : result / right;
    }
    return result;
  }

  // factor = '(' expr ')' | number
  function parseFactor(): number {
    if (peek() === '(') {
      consume(); // '('
      const result = parseExpr();
      consume(); // ')'
      return result;
    }
    // Parse number (including decimals and leading minus for unary negation)
    let numStr = '';
    if (peek() === '-') numStr += consume();
    while (/[\d.]/.test(peek())) numStr += consume();
    return parseFloat(numStr);
  }

  try {
    const result = parseExpr();
    if (pos !== sanitized.length) return null; // leftover chars = invalid
    return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : null;
  } catch (e) {
    return null;
  }
}
