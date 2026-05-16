import { useState, useEffect, useCallback } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from 'chart.js'
import { useApp } from '../context/AppContext'
import {
  ageInMonths, getRecommendation, entryToCups, fmtCupsNice,
  weekStart, weekDays, monthsForDays, FEEDING_CHART,
} from '../utils/feedingGuide'
import { toDisplayDate, monthPath } from '../utils/helpers'
import PageHeader from './PageHeader'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => Math.round(n * 4) / 4          // round to nearest ¼
const fmtCups = (n) => n === 0 ? '—' : `${fmtCupsNice(n)} cups`

/** Derive cups for a whole day, using grams÷gramsPerCup when available */
function dayTotal(dayLog, gramsPerCup = 106) {
  const entries = dayLog?.food || []
  const cups  = entries.reduce((s, e) => s + entryToCups(e, gramsPerCup), 0)
  const grams = entries.reduce((s, e) => s + (Number(e.grams) || 0), 0)
  const meals = entries.length
  return { cups, grams, meals }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WeeklyFood() {
  const { monthLog, settings, loadMonth, setView } = useApp()

  // dog profile
  const dog            = settings?.dog      || {}
  const expectedLbs    = Number(settings?.food?.expectedAdultLbs || 0)
  const gramsPerCup    = Number(settings?.food?.gramsPerCup      || 106)
  const dob            = dog.dob            || ''
  const ageNow         = ageInMonths(dob)

  // week navigation (Mon-based)
  const todayKey       = new Date().toISOString().slice(0, 10)
  const [weekMon, setWeekMon] = useState(() => weekStart(todayKey))
  const days           = weekDays(weekMon)
  const isCurrentWeek  = weekMon === weekStart(todayKey)

  // load any months that span this week
  useEffect(() => {
    monthsForDays(days).forEach(m => loadMonth(m))
  }, [weekMon, loadMonth]) // eslint-disable-line

  const shiftWeek = useCallback((delta) => {
    const d = new Date(weekMon + 'T12:00:00')
    d.setDate(d.getDate() + delta * 7)
    const next = d.toISOString().slice(0, 10)
    if (next <= todayKey) setWeekMon(next)
  }, [weekMon, todayKey])

  // per-day stats
  const dayStats = days.map(dk => ({ dateKey: dk, ...dayTotal(monthLog[dk], gramsPerCup) }))
  const weekTotalCups  = dayStats.reduce((s, d) => s + d.cups,  0)
  const weekTotalGrams = dayStats.reduce((s, d) => s + d.grams, 0)
  const loggedDays     = dayStats.filter(d => d.meals > 0).length
  const avgCupsPerDay  = loggedDays > 0 ? weekTotalCups / loggedDays : 0

  // recommendations
  const rec     = getRecommendation(ageNow,    expectedLbs)
  const recNext = getRecommendation(ageNow != null ? ageNow + 0.25 : null, expectedLbs) // ~1 week ahead

  const needsSetup = !dob || !expectedLbs

  return (
    <div>
      <PageHeader title="Weekly Food 🍗" />
      <div className="mx-4 space-y-4">

        {/* Setup nudge */}
        {needsSetup && (
          <div className="bg-spark-10 border border-spark-100 rounded-2xl p-4">
            <p className="font-semibold text-spark-140 mb-1">⚠️ Missing dog info</p>
            <p className="text-sm text-gray-160 mb-3">
              Add Bheem's <strong>Date of Birth</strong> and <strong>Expected Adult Weight</strong> in Settings
              to unlock Purina feeding recommendations!
            </p>
            <button onClick={() => setView('settings')} className="btn-primary py-2 px-4 text-xs">
              Open Settings →
            </button>
          </div>
        )}

        {/* Week navigator */}
        <WeekNav weekMon={weekMon} days={days} isCurrentWeek={isCurrentWeek} onShift={shiftWeek} />

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2">
          <SummaryCard emoji="🥣" label="Total cups" val={fmtCups(weekTotalCups)} sub={`${loggedDays}/7 days logged`} />
          <SummaryCard emoji="⚖️" label="Total grams" val={weekTotalGrams > 0 ? `${weekTotalGrams}g` : '—'} sub={`1 cup = ${gramsPerCup}g`} />
          <SummaryCard emoji="🌖" label="Days logged" val={loggedDays} sub="out of 7" />
        </div>

        {/* Chart */}
        <DailyBarChart dayStats={dayStats} rec={rec} />

        {/* Recommendation card */}
        {rec && !rec.over24 && !rec.under2 && (
          <RecommendationCard rec={rec} ageNow={ageNow} avgCupsPerDay={avgCupsPerDay} loggedDays={loggedDays} />
        )}

        {/* Next week projection */}
        {recNext && !recNext.over24 && !recNext.under2 && (
          <NextWeekCard recNext={recNext} rec={rec} />
        )}

        {/* Full Purina chart */}
        <PurinaChartTable expectedLbs={expectedLbs} ageNow={ageNow} />
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WeekNav({ weekMon, days, isCurrentWeek, onShift }) {
  const start = toDisplayDate(days[0])
  const end   = toDisplayDate(days[6])
  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
      <button onClick={() => onShift(-1)} className="text-2xl text-gray-100 px-1">‹</button>
      <div className="flex-1 text-center">
        <p className="text-xs text-gray-100">Week of</p>
        <p className="font-semibold text-gray-160 text-sm">{start} – {end.split(',')[1]?.trim() ?? end}</p>
        {isCurrentWeek && <span className="text-xs text-blue-100 font-medium">Current week</span>}
      </div>
      <button onClick={() => onShift(1)} disabled={isCurrentWeek}
        className="text-2xl text-gray-100 px-1 disabled:opacity-30">›</button>
    </div>
  )
}

function SummaryCard({ emoji, label, val, sub }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
      <div className="text-xl mb-1">{emoji}</div>
      <div className="font-bold text-gray-160 text-sm leading-tight">{val}</div>
      <div className="text-xs text-gray-100 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-100 mt-0.5">{sub}</div>}
    </div>
  )
}

function DailyBarChart({ dayStats, rec }) {
  const labels = dayStats.map(d => {
    const dt = new Date(d.dateKey + 'T12:00:00')
    return dt.toLocaleDateString('en-US', { weekday: 'short' })
  })

  const mid = rec ? (rec.minCups + rec.maxCups) / 2 : null

  const data = {
    labels,
    datasets: [
      {
        label: 'Cups eaten',
        data: dayStats.map(d => fmt(d.cups)),
        backgroundColor: dayStats.map(d => {
          if (d.cups === 0) return '#d9d9d9'
          if (!rec) return '#0053e2'
          if (d.cups < rec.minCups * 0.85) return '#ea1100'
          if (d.cups > rec.maxCups * 1.1)  return '#ffc220'
          return '#2a8703'
        }),
        borderRadius: 6,
      },
    ],
  }

  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: {
      label: ctx => `${ctx.parsed.y} cups`
    }}},
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: '#f5f5f5' },
        ticks: { callback: v => `${v}c` },
        ...(mid ? { suggestedMax: Math.max(mid * 1.3, 3) } : {}),
      },
    },
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-160">Cups per day</h3>
        {rec && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-100 inline-block"/>On target</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-100 inline-block"/>Under</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-spark-100 inline-block"/>Over</span>
          </div>
        )}
      </div>

      {rec && (
        <div className="text-xs text-gray-100 mb-2">
          Target range: <span className="font-semibold text-blue-100">{rec.minCups}–{rec.maxCups} cups/day</span>
        </div>
      )}

      <div className="h-44">
        <Bar data={data} options={opts} />
      </div>
    </div>
  )
}

function RecommendationCard({ rec, ageNow, avgCupsPerDay, loggedDays }) {
  const onTarget = avgCupsPerDay >= rec.minCups && avgCupsPerDay <= rec.maxCups
  const underFed = loggedDays > 0 && avgCupsPerDay < rec.minCups * 0.9
  const overFed  = loggedDays > 0 && avgCupsPerDay > rec.maxCups * 1.1

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <img
          src="https://www.purina.com/favicon.ico"
          alt="Purina"
          className="w-5 h-5 rounded"
          onError={e => { e.target.style.display='none' }}
        />
        <h3 className="font-bold text-gray-160">Purina Pro Plan Recommendation</h3>
      </div>

      <div className="text-xs text-gray-100 mb-3">
        Large Breed Puppy · Age: <span className="font-semibold text-gray-160">{ageNow} months</span>
        {' '}({rec.ageLabel} bracket)
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <RecBlock label="Daily total" val={`${rec.minCups}–${rec.maxCups} cups`} sub={`${rec.minKcal}–${rec.maxKcal} kcal`} />
        <RecBlock label={`Per meal (${rec.meals}×/day)`} val={`${rec.perMealMin}–${rec.perMealMax} cups`} sub="per serving" />
      </div>

      {loggedDays > 0 && (
        <div className={`rounded-xl p-3 text-sm font-medium
          ${onTarget ? 'bg-green-10 text-green-100' : underFed ? 'bg-red-10 text-red-100' : 'bg-spark-10 text-spark-140'}`}>
          {onTarget && `✅ Great job! Avg ${fmtCups(avgCupsPerDay)}/day is right in the target range.`}
          {underFed && `⚠️ Avg ${fmtCups(avgCupsPerDay)}/day is below the ${rec.minCups} cup minimum. Consider increasing portions!`}
          {overFed  && `⚠️ Avg ${fmtCups(avgCupsPerDay)}/day exceeds the ${rec.maxCups} cup max. Watch those treat calories too!`}
        </div>
      )}

      <p className="text-xs text-gray-100 mt-3">
        * Based on Purina Pro Plan Large Breed Puppy bag label. Always verify with your vet and the current bag.
      </p>
    </div>
  )
}

function RecBlock({ label, val, sub }) {
  return (
    <div className="bg-blue-10 rounded-xl p-3">
      <p className="text-xs text-gray-100">{label}</p>
      <p className="font-bold text-blue-100 mt-0.5">{val}</p>
      <p className="text-xs text-gray-100 mt-0.5">{sub}</p>
    </div>
  )
}

function NextWeekCard({ recNext, rec }) {
  const changed = recNext && rec &&
    (recNext.minCups !== rec.minCups || recNext.maxCups !== rec.maxCups)

  return (
    <div className="bg-blue-100 rounded-2xl p-4 text-white">
      <h3 className="font-bold mb-2">📅 Next Week's Target</h3>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-3xl font-bold">{recNext.minCups}–{recNext.maxCups}</p>
          <p className="text-blue-50 text-sm">cups per day</p>
        </div>
        <div className="text-right">
          <p className="text-blue-50 text-sm">{recNext.meals} meals/day</p>
          <p className="text-blue-50 text-sm">{recNext.perMealMin}–{recNext.perMealMax} cups each</p>
          <p className="text-blue-50 text-sm">{recNext.minKcal}–{recNext.maxKcal} kcal/day</p>
        </div>
      </div>
      {changed && (
        <div className="mt-3 bg-white/20 rounded-xl p-2 text-sm">
          🔄 Bheem is entering the <strong>{recNext.ageLabel}</strong> bracket — adjust portions!
        </div>
      )}
      {!changed && rec && (
        <p className="text-blue-50 text-xs mt-2">Same bracket as this week — no change needed.</p>
      )}
    </div>
  )
}

function PurinaChartTable({ expectedLbs, ageNow }) {
  const [open, setOpen] = useState(false)

  // Pick column index based on expected weight
  const colIdx = expectedLbs <= 75 ? 0 : expectedLbs <= 100 ? 1 : 2
  const colLabels = ['51–75 lbs', '76–100 lbs', '101+ lbs']

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-4 py-3 text-left">
        <span className="font-bold text-gray-160">📋 Full Purina Feeding Chart</span>
        <span className="text-gray-100 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-100 mb-3">
            Purina Pro Plan Large Breed Puppy · ~415 kcal/cup
            {expectedLbs > 0 && ` · Highlighted column: ${colLabels[colIdx]} expected adult weight`}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left py-2 pr-2 text-gray-100 font-medium">Age</th>
                  {colLabels.map((l, i) => (
                    <th key={l} className={`py-2 px-2 font-medium text-center ${i === colIdx && expectedLbs > 0 ? 'text-blue-100' : 'text-gray-100'}`}>
                      {l}
                    </th>
                  ))}
                  <th className="py-2 px-2 text-gray-100 font-medium text-center">Meals/day</th>
                </tr>
              </thead>
              <tbody>
                {FEEDING_CHART.map(row => {
                  const isActive = ageNow != null && ageNow >= row.ageMin && ageNow <= row.ageMax
                  return (
                    <tr key={row.label}
                      className={`border-b border-gray-10 last:border-0 ${isActive ? 'bg-blue-10' : ''}`}>
                      <td className={`py-2 pr-2 font-medium ${isActive ? 'text-blue-100' : 'text-gray-160'}`}>
                        {row.label} {isActive && '← now'}
                      </td>
                      {row.brackets.map((b, i) => (
                        <td key={i} className={`py-2 px-2 text-center
                          ${i === colIdx && expectedLbs > 0 ? 'font-semibold text-blue-100' : 'text-gray-160'}`}>
                          {b.minCups}–{b.maxCups}
                        </td>
                      ))}
                      <td className="py-2 px-2 text-center text-gray-100">{row.meals}×</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-100 mt-2">
            Values shown as cups/day. Always confirm with your vet and the label on your current bag.
            <a href="https://www.purina.com/dog/dog-food/dry-dog-food/pro-plan-puppy-large-breed"
              target="_blank" rel="noreferrer" className="text-blue-100 ml-1">Purina website ↗</a>
          </p>
        </div>
      )}
    </div>
  )
}
