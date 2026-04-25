// HC Finishing — Design Rule Engine
// Adapted from HCHC presentation engine design-rules.js
// Evaluates material compatibility by tone, style, and budget tier

const TONE_COMPATIBILITY = {
  warm:    { warm: 1.0, neutral: 0.8, cool: 0.3 },
  neutral: { warm: 0.8, neutral: 1.0, cool: 0.8 },
  cool:    { warm: 0.3, neutral: 0.8, cool: 1.0 }
};

const PRICE_TIER_ORDER = { builder: 1, mid: 2, premium: 3, luxury: 4 };

const CATEGORY_ORDER = [
  'Flooring', 'Cabinetry', 'Countertops', 'Backsplash',
  'Hardware', 'Paint', 'Fixtures', 'Lighting'
];

// Evaluate a set of material selections for compatibility
// selections: array of { category, tone, price_tier, name }
function evaluateCompatibility(selections) {
  const report = {
    overallScore: 0,
    toneScore: 0,
    budgetScore: 0,
    warnings: [],
    suggestions: [],
    status: 'incomplete'
  };

  const filled = selections.filter(s => s && s.tone);
  if (filled.length < 2) {
    report.status = 'incomplete';
    return report;
  }

  // Tone harmony
  report.toneScore = calculateToneScore(filled, report);

  // Budget variance
  report.budgetScore = calculateBudgetScore(filled, report);

  // Specific conflict checks
  checkSpecificConflicts(filled, report);

  // Overall score: 70% tone, 30% budget
  report.overallScore = Math.round(report.toneScore * 0.7 + report.budgetScore * 0.3);

  // Status
  if (report.overallScore >= 80) report.status = 'good';
  else if (report.overallScore >= 60) report.status = 'warning';
  else report.status = 'conflict';

  return report;
}

function calculateToneScore(selections, report) {
  if (selections.length < 2) return 100;

  let totalCompat = 0;
  let pairs = 0;

  for (let i = 0; i < selections.length; i++) {
    for (let j = i + 1; j < selections.length; j++) {
      const toneA = selections[i].tone || 'neutral';
      const toneB = selections[j].tone || 'neutral';
      const compat = TONE_COMPATIBILITY[toneA]?.[toneB] ?? 0.5;
      totalCompat += compat;
      pairs++;

      if (compat <= 0.3) {
        report.warnings.push(
          `${selections[i].category} (${toneA}) and ${selections[j].category} (${toneB}) have clashing undertones.`
        );
      }
    }
  }

  return Math.round((totalCompat / pairs) * 100);
}

function calculateBudgetScore(selections, report) {
  const tiers = selections
    .filter(s => s.price_tier)
    .map(s => PRICE_TIER_ORDER[s.price_tier] || 2);

  if (tiers.length < 2) return 100;

  const maxTier = Math.max(...tiers);
  const minTier = Math.min(...tiers);
  const variance = maxTier - minTier;

  if (variance >= 3) {
    report.warnings.push(
      'Mixing luxury and builder-grade materials may look inconsistent. Consider upgrading the lower-tier selections.'
    );
    return 40;
  } else if (variance >= 2) {
    report.suggestions.push(
      'Budget tiers vary by 2 levels. This can work but review carefully for visual cohesion.'
    );
    return 70;
  }

  return 100;
}

function checkSpecificConflicts(selections, report) {
  const byCategory = {};
  selections.forEach(s => { byCategory[s.category] = s; });

  // Warm cabinets with cool backsplash
  if (byCategory['Cabinetry']?.tone === 'warm' && byCategory['Backsplash']?.tone === 'cool') {
    report.warnings.push(
      'Warm cabinetry paired with cool backsplash can create visual tension. Consider a neutral backsplash instead.'
    );
  }

  // Cool countertops with warm hardware
  if (byCategory['Countertops']?.tone === 'cool' && byCategory['Hardware']?.tone === 'warm') {
    report.suggestions.push(
      'Cool countertops with warm hardware is a bold choice. This works best in transitional styles.'
    );
  }

  // All same tone
  const tones = selections.map(s => s.tone);
  const uniqueTones = [...new Set(tones)];
  if (uniqueTones.length === 1 && tones.length >= 4) {
    report.suggestions.push(
      `All selections are ${uniqueTones[0]} toned. Consider adding one neutral element for depth.`
    );
  }
}

// Status display helpers
function getStatusColor(status) {
  switch (status) {
    case 'good': return '#4CAF50';
    case 'warning': return '#FFC107';
    case 'conflict': return '#F44336';
    default: return '#9E9E9E';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'good': return 'Harmonious';
    case 'warning': return 'Review Suggested';
    case 'conflict': return 'Conflicts Detected';
    default: return 'Select Materials';
  }
}

function getStatusEmoji(status) {
  switch (status) {
    case 'good': return '&#9989;';
    case 'warning': return '&#9888;';
    case 'conflict': return '&#10060;';
    default: return '&#9898;';
  }
}
