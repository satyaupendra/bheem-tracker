import { useEffect, useState } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Legend, Filler
} from 'chart.js'
import { useApp } from '../context/AppContext'
import { toMonthKey, toDateKey, monthPath } from '../utils/helpers'
import PageHeader from './PageHeader'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler)

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: { grid: { display: false } }, y: { grid: { color: '#f5f5f5' } } }
}

export default function Reports() {
  const { monthLog, settings, loadMonth } = useApp()
  const [range, setRange] = useState(7)

  const waterGoal = settings?.water?.dailyGoalOz || 32
  const actGoal   = settings?.activity?.dailyGoalMin || 60

  // Load past 2 months if needed
  useEffect(() => {
    const now = new Date()
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    loadMonth(toMonthKey(prev))
  }, [loadMonth])

  // Build last N days
  const days = Array.from({ length: range }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (range - 1 - i))
    return toDateKey(d)
  })

  const labels = days.map(d => {
    const dt = new Date(d + 'T12:00:00')
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const grams    = days.map(d => (monthLog[d]?.food || []).reduce((s, e) => s + (Number(e.grams)   || 0), 0))
  const water    = days.map(d => (monthLog[d]?.water || []).reduce((s, e) => s + (Number(e.oz)      || 0), 0))
  const activity = days.map(d => (monthLog[d]?.activity || []).reduce((s, e) => s + (Number(e.minutes) || 0), 0))

  const avgGrams = grams.length    ? Math.round(grams.reduce((a, b) => a + b, 0) / grams.length)       : 0
  const avgAct   = activity.length ? Math.round(activity.reduce((a, b) => a + b, 0) / activity.length) : 0
  const avgWater = water.length    ? Math.round(water.reduce((a, b) => a + b, 0) / water.length)       : 0

  const makeDataset = (data, color, fill = false) => ({
    data,
    borderColor: color,
    backgroundColor: fill ? color + '33' : color,
    fill,
    tension: 0.4,
    pointRadius: 3,
  })

  return (
    <div>
      <PageHeader title="Reports 📊" />

      {/* Range selector */}
      <div className="flex mx-4 bg-gray-10 rounded-xl p-1 mb-4">
        {[7, 14, 30].map(n => (
          <button key={n} onClick={() => setRange(n)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold ${range === n ? 'bg-white text-blue-100 shadow-sm' : 'text-gray-100'}`}>
            {n}d
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="mx-4 grid grid-cols-3 gap-2 mb-4">
        <SummaryCard emoji="⚖️" label="Avg Food" val={avgGrams > 0 ? `${avgGrams}g` : '—'} />
        <SummaryCard emoji="💧" label="Avg Water" val={avgWater} goal={waterGoal} unit="oz" />
        <SummaryCard emoji="🏃" label="Avg Walk" val={avgAct} goal={actGoal} unit="min" />
      </div>

      <div className="mx-4 space-y-4">
        <ChartCard title="⚖️ Food eaten (grams)">
          <Bar
            data={{ labels, datasets: [{ ...makeDataset(grams, '#0053e2'), backgroundColor: grams.map(v => v > 0 ? '#0053e2' : '#d9d9d9') }] }}
            options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, ticks: { callback: v => `${v}g` } } } }}
          />
        </ChartCard>

        <ChartCard title="💧 Water Intake (oz)">
          <Line data={{ labels, datasets: [makeDataset(water, '#0053e2', true)] }} options={CHART_OPTS} />
        </ChartCard>

        <ChartCard title="🏃 Activity (minutes)">
          <Bar data={{ labels, datasets: [{ ...makeDataset(activity, '#2a8703'), backgroundColor: activity.map(v => v >= actGoal ? '#2a8703' : '#ffc220') }] }} options={CHART_OPTS} />
        </ChartCard>
      </div>
    </div>
  )
}

function SummaryCard({ emoji, label, val, goal, unit }) {
  const hasGoal = goal != null
  const ok = hasGoal && Number(val) >= goal
  return (
    <div className={`bg-white rounded-2xl p-3 shadow-sm text-center border-2 ${ok ? 'border-green-100' : 'border-transparent'}`}>
      <div className="text-xl">{emoji}</div>
      <div className="font-bold text-gray-160 text-sm">{val}{unit && !String(val).includes(unit) ? ` ${unit}` : ''}</div>
      {hasGoal && <div className={`text-xs mt-0.5 ${ok ? 'text-green-100' : 'text-gray-100'}`}>{ok ? '✓ goal' : `goal: ${goal}${unit}`}</div>}
      <div className="text-xs text-gray-100 mt-0.5">{label}</div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="font-bold text-gray-160 mb-3">{title}</h3>
      <div className="h-40">{children}</div>
    </div>
  )
}
