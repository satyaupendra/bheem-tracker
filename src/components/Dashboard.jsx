import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { toDisplayDate } from '../utils/helpers'
import { fmtCupsNice, entryToCups } from '../utils/feedingGuide'

export default function Dashboard() {
  const { settings, getDayLog, selectedDate, setView, getPhotoUrl } = useApp()
  const dog        = settings?.dog || {}
  const day        = getDayLog(selectedDate)
  const dayTasks   = day.tasks || {}
  const dailyTasks = settings?.tasks?.daily || []

  const gramsPerCup  = Number(settings?.food?.gramsPerCup || 106)
  const totalGrams = (day.food     || []).reduce((s, e) => s + (Number(e.grams)  || 0), 0)
  const totalCups  = (day.food     || []).reduce((s, e) => s + entryToCups(e, gramsPerCup), 0)
  const totalWater = (day.water    || []).reduce((s, e) => s + (Number(e.oz)     || 0), 0)
  const totalMin   = (day.activity || []).reduce((s, e) => s + (Number(e.minutes)|| 0), 0)
  const waterGoal  = settings?.water?.dailyGoalOz    || 32
  const actGoal    = settings?.activity?.dailyGoalMin || 60

  const doneTasks = dailyTasks.filter(t => dayTasks[t.id]?.done).length
  const pct = dailyTasks.length > 0 ? Math.round((doneTasks / dailyTasks.length) * 100) : 0

  const [photoUrl, setPhotoUrl] = useState(null)
  useEffect(() => {
    if (day.photoPath) getPhotoUrl(selectedDate).then(setPhotoUrl)
  }, [selectedDate, day.photoPath, getPhotoUrl])

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Header */}
      <div className="bg-blue-100 rounded-3xl p-4 text-white">
        <p className="text-blue-50 text-sm">{toDisplayDate(selectedDate)}</p>
        <h1 className="text-2xl font-bold mt-0.5">{dog.name || 'Bheem'} 🐾</h1>
        {dog.breed && <p className="text-blue-50 text-sm">{dog.breed}{dog.weight ? ` · ${dog.weight}` : ''}</p>}

        {/* Task ring + quick stats */}
        <div className="flex items-center gap-4 mt-4">
          <Ring pct={pct} done={doneTasks} total={dailyTasks.length} />
          <div className="flex-1 grid grid-cols-3 gap-2">
            <Stat emoji="🍗" val={totalGrams > 0 ? `${totalGrams}g` : '0g'} sub={totalCups > 0 ? `${fmtCupsNice(totalCups)} cups` : null} />
            <Stat emoji="💧" val={totalWater} goal={waterGoal} unit="oz" />
            <Stat emoji="🏃" val={totalMin} goal={actGoal} unit="min" />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { emoji: '🍖', label: 'Food',    view: 'food' },
          { emoji: '💧', label: 'Water',   view: 'food' },
          { emoji: '🏃', label: 'Walk',    view: 'activity' },
          { emoji: '📸', label: 'Photo',   view: 'photos' },
        ].map(({ emoji, label, view }) => (
          <button key={label} onClick={() => setView(view)}
            className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1 shadow-sm active:scale-95 transition-transform">
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs text-gray-100 font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Today's photo */}
      {photoUrl && (
        <div className="rounded-2xl overflow-hidden shadow-sm bg-white">
          <img src={photoUrl} alt="Today's photo" className="w-full object-cover max-h-64" />
          <p className="text-xs text-gray-100 text-center py-2">📸 Today's photo</p>
        </div>
      )}
      {!photoUrl && (
        <button onClick={() => setView('photos')}
          className="w-full bg-white rounded-2xl p-6 flex flex-col items-center gap-2 shadow-sm border-2 border-dashed border-gray-50 active:bg-gray-10">
          <span className="text-3xl">📸</span>
          <span className="text-sm text-gray-100">Add today's photo of {dog.name || 'Bheem'}</span>
        </button>
      )}

      {/* Tasks preview */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-gray-160">Today's Tasks</h2>
          <button onClick={() => setView('tasks')} className="text-blue-100 text-sm font-medium">See all</button>
        </div>
        {dailyTasks.slice(0, 5).map(t => (
          <div key={t.id} className={`flex items-center gap-3 py-2 border-b border-gray-10 last:border-0
            ${dayTasks[t.id]?.done ? 'opacity-50' : ''}`}>
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs
              ${dayTasks[t.id]?.done ? 'bg-green-100 border-green-100 text-white' : 'border-gray-50'}`}>
              {dayTasks[t.id]?.done ? '✓' : ''}
            </span>
            <span className="text-sm text-gray-160">{t.emoji} {t.label}</span>
            {dayTasks[t.id]?.ts && (
              <span className="ml-auto text-xs text-gray-100">
                {new Date(dayTasks[t.id].ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        ))}
        {dailyTasks.length > 5 && (
          <button onClick={() => setView('tasks')} className="text-blue-100 text-sm mt-2">
            +{dailyTasks.length - 5} more…
          </button>
        )}
      </div>

      {/* Recent food */}
      {(day.food || []).length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-160">Food Today</h2>
            <button onClick={() => setView('food')} className="text-blue-100 text-sm font-medium">Log more</button>
          </div>
          {(day.food || []).slice(-3).map(e => (
            <div key={e.id} className="flex justify-between items-center py-1.5 border-b border-gray-10 last:border-0">
              <span className="text-sm text-gray-160">{e.name || 'Meal'}</span>
              <span className="text-sm text-gray-100">{e.calories ? `${e.calories} cal` : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Ring({ pct, done, total }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="#ffc220" strokeWidth="6"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-lg font-bold leading-none">{pct}%</span>
        <span className="text-xs opacity-75">{done}/{total}</span>
      </div>
    </div>
  )
}

function Stat({ emoji, val, goal, unit, sub }) {
  const ok = goal != null && Number(val) >= goal
  return (
    <div className="bg-white/10 rounded-xl p-2 text-center">
      <div className="text-base">{emoji}</div>
      <div className="text-white text-sm font-bold leading-none mt-0.5">{val}</div>
      {goal != null && <div className="text-blue-50 text-xs">/{goal}{unit}</div>}
      {sub   && <div className="text-blue-50 text-xs">{sub}</div>}
      {ok    && <div className="text-spark-100 text-xs">✓</div>}
    </div>
  )
}
