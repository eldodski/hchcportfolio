// Design Rule Engine for HCHC Presentation Builder
// Handles tone harmony and specific conflict detection

const TONE_COMPATIBILITY = {
  warm:    { warm: 1.0, neutral: 0.8, cool: 0.3 },
  neutral: { warm: 0.8, neutral: 1.0, cool: 0.8 },
  cool:    { warm: 0.3, neutral: 0.8, cool: 1.0 }
};

const CATEGORY_ORDER = ['flooring', 'cabinetry', 'countertops', 'backsplash', 'hardware', 'paint'];

// Evaluate all selections and return a report
function evaluateSelections(selections) {
  const report = {
    overallScore: 0,
    toneScore: 0,
    warnings: [],
    suggestions: [],
    status: 'incomplete'
  };

  const filled = CATEGORY_ORDER.filter(cat => selections[cat]);
  if (filled.length === 0) {
    report.status = 'incomplete';
    return report;
  }

  // Tone analysis
  const tones = filled.map(cat => ({ category: cat, tone: selections[cat].tone }));
  report.toneScore = calculateToneScore(tones, report);

  // Specific conflict checks
  checkSpecificConflicts(selections, report);

  // Overall score based on tone harmony
  report.overallScore = report.toneScore;

  // Status
  if (report.overallScore >= 80) report.status = 'good';
  else if (report.overallScore >= 60) report.status = 'warning';
  else report.status = 'conflict';

  return report;
}

function calculateToneScore(tones, report) {
  if (tones.length < 2) return 100;

  let totalCompat = 0;
  let pairs = 0;

  for (let i = 0; i < tones.length; i++) {
    for (let j = i + 1; j < tones.length; j++) {
      const compat = TONE_COMPATIBILITY[tones[i].tone]?.[tones[j].tone] ?? 0.5;
      totalCompat += compat;
      pairs++;

      if (compat <= 0.3) {
        report.warnings.push(
          `${capitalize(tones[i].category)} (${tones[i].tone}) and ${capitalize(tones[j].category)} (${tones[j].tone}) have clashing undertones.`
        );
      }
    }
  }

  return Math.round((totalCompat / pairs) * 100);
}

function checkSpecificConflicts(selections, report) {
  // Warm cabinets with cool backsplash
  if (selections.cabinetry?.tone === 'warm' && selections.backsplash?.tone === 'cool') {
    report.warnings.push(
      'Warm cabinetry paired with cool backsplash can create visual tension. Consider a neutral backsplash instead.'
    );
  }

  // Cool countertops with warm hardware
  if (selections.countertops?.tone === 'cool' && selections.hardware?.tone === 'warm') {
    report.suggestions.push(
      'Cool countertops with warm hardware is a bold choice. This works best in transitional styles.'
    );
  }

  // All same tone = safe but maybe boring
  const tones = CATEGORY_ORDER
    .filter(cat => selections[cat])
    .map(cat => selections[cat].tone);
  const uniqueTones = [...new Set(tones)];
  if (uniqueTones.length === 1 && tones.length >= 4) {
    report.suggestions.push(
      `All selections are ${uniqueTones[0]} toned. Consider adding one neutral element for depth.`
    );
  }
}

// Utility
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Status indicator helpers
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
