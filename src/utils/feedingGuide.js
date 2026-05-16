/**
 * Purina Pro Plan Large Breed Puppy Feeding Guide
 * Source: Purina Pro Plan bag label & official feeding guidelines
 * Formula: Puppy Large Breed (51-100+ lb expected adult weight)
 * Kcal/cup (ME): ~415 kcal/cup (8% moisture)
 *
 * NOTE: Always cross-check with the label on your specific bag —
 * formulas can change between production runs.
 */

export const KCAL_PER_CUP = 415

// Each bracket: { ageMin, ageMax (months), weightBrackets }
// weightBrackets: [{ minLbs, maxLbs, minCups, maxCups, meals }]
export const FEEDING_CHART = [
  {
    ageMin: 2, ageMax: 3,
    label: '2–3 months',
    meals: 4,
    brackets: [
      { minLbs: 0,   maxLbs: 75,  minCups: 2.5, maxCups: 4.0 },
      { minLbs: 76,  maxLbs: 100, minCups: 3.5, maxCups: 5.0 },
      { minLbs: 101, maxLbs: 999, minCups: 4.5, maxCups: 6.5 },
    ],
  },
  {
    ageMin: 4, ageMax: 5,
    label: '4–5 months',
    meals: 3,
    brackets: [
      { minLbs: 0,   maxLbs: 75,  minCups: 3.5, maxCups: 5.5 },
      { minLbs: 76,  maxLbs: 100, minCups: 4.5, maxCups: 7.0 },
      { minLbs: 101, maxLbs: 999, minCups: 5.5, maxCups: 8.5 },
    ],
  },
  {
    ageMin: 6, ageMax: 8,
    label: '6–8 months',
    meals: 2,
    brackets: [
      { minLbs: 0,   maxLbs: 75,  minCups: 3.0, maxCups: 4.75 },
      { minLbs: 76,  maxLbs: 100, minCups: 4.0, maxCups: 6.0  },
      { minLbs: 101, maxLbs: 999, minCups: 5.0, maxCups: 7.5  },
    ],
  },
  {
    ageMin: 9, ageMax: 11,
    label: '9–11 months',
    meals: 2,
    brackets: [
      { minLbs: 0,   maxLbs: 75,  minCups: 2.5, maxCups: 3.75 },
      { minLbs: 76,  maxLbs: 100, minCups: 3.5, maxCups: 5.25 },
      { minLbs: 101, maxLbs: 999, minCups: 4.25, maxCups: 6.5 },
    ],
  },
  {
    ageMin: 12, ageMax: 15,
    label: '12–15 months',
    meals: 2,
    brackets: [
      { minLbs: 0,   maxLbs: 75,  minCups: 2.25, maxCups: 3.5  },
      { minLbs: 76,  maxLbs: 100, minCups: 3.25, maxCups: 4.75 },
      { minLbs: 101, maxLbs: 999, minCups: 4.0,  maxCups: 6.0  },
    ],
  },
  {
    ageMin: 16, ageMax: 24,
    label: '16–24 months',
    meals: 2,
    brackets: [
      { minLbs: 0,   maxLbs: 75,  minCups: 2.0,  maxCups: 3.25 },
      { minLbs: 76,  maxLbs: 100, minCups: 3.0,  maxCups: 4.5  },
      { minLbs: 101, maxLbs: 999, minCups: 3.75, maxCups: 5.5  },
    ],
  },
]

/** Age in months from a date-of-birth string (YYYY-MM-DD) */
export function ageInMonths(dob) {
  if (!dob) return null
  const birth = new Date(dob + 'T12:00:00')
  const now   = new Date()
  return (now.getFullYear() - birth.getFullYear()) * 12
       + (now.getMonth()   - birth.getMonth())
}

/** Lookup recommendation for a given age (months) + expected adult weight (lbs) */
export function getRecommendation(ageMonths, expectedAdultLbs) {
  if (!ageMonths || !expectedAdultLbs) return null

  const row = FEEDING_CHART.find(r => ageMonths >= r.ageMin && ageMonths <= r.ageMax)
  if (!row) return { over24: ageMonths > 24, under2: ageMonths < 2 }

  const bracket = row.brackets.find(b => expectedAdultLbs >= b.minLbs && expectedAdultLbs <= b.maxLbs)
    || row.brackets[row.brackets.length - 1]

  return {
    ageLabel: row.label,
    minCups:  bracket.minCups,
    maxCups:  bracket.maxCups,
    midCups:  Math.round(((bracket.minCups + bracket.maxCups) / 2) * 4) / 4,
    meals:    row.meals,
    perMealMin: Math.round((bracket.minCups / row.meals) * 4) / 4,
    perMealMax: Math.round((bracket.maxCups / row.meals) * 4) / 4,
    minKcal:  Math.round(bracket.minCups * KCAL_PER_CUP),
    maxKcal:  Math.round(bracket.maxCups * KCAL_PER_CUP),
  }
}

/** Parse a cups string like "1/2 cup", "1 cup", "3/4 cup" → number */
export function parseCups(val) {
  if (!val || val === 'eyeball') return 0
  const s = String(val).replace(/cup[s]?/i, '').trim()
  if (s.includes('/')) {
    const [n, d] = s.split('/')
    return Number(n) / Number(d)
  }
  return Number(s) || 0
}

/**
 * Derive cups from a food log entry.
 * Priority: grams (÷ gramsPerCup) > explicit cups field.
 * This means you only need to log grams — cups are calculated automatically.
 */
export function entryToCups(entry, gramsPerCup = 106) {
  const g = Number(entry.grams) || 0
  if (g > 0) return g / gramsPerCup
  return parseCups(entry.cups)
}

/** Format cups to nearest ¼, e.g. 1.75 → "1¾" */
export function fmtCupsNice(n) {
  if (!n || n === 0) return '—'
  const whole = Math.floor(n)
  const frac  = Math.round((n - whole) * 4) // quarters
  const fracStr = ['', '¼', '½', '¾', ''][frac] ?? ''
  if (whole === 0) return fracStr || '< ¼'
  return fracStr ? `${whole}${fracStr}` : `${whole}`
}

/** Monday of the week containing a given date */
export function weekStart(dateKey) {
  const d = new Date(dateKey + 'T12:00:00')
  const day = d.getDay()                 // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day) // shift to Monday
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

/** All 7 date keys Mon→Sun for a given week-start key */
export function weekDays(monKey) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monKey + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

/** All unique month keys covered by a list of date keys */
export function monthsForDays(days) {
  return [...new Set(days.map(d => d.slice(0, 7)))]
}
