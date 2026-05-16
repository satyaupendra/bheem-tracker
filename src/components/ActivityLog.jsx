import { useState } from 'react'
import { useApp } from '../context/AppContext'
import PageHeader from './PageHeader'

const ACTIVITY_TYPES = ['Walk 🦮', 'Run 🏃', 'Play 🎾', 'Swim 🏊', 'Training 🎓', 'Other']

export default function ActivityLog() {
  const { getDayLog, addActivity, deleteActivity, selectedDate, syncing, settings } = useApp()
  const day = getDayLog(selectedDate)
  const activities = day.activity || []
  const totalMin = activities.reduce((s, e) => s + (Number(e.minutes) || 0), 0)
  const goal = settings?.activity?.dailyGoalMin || 60

  return (
    <div>
      <PageHeader title="Activity 🏃" />

      {/* Goal bar */}
      <div className="mx-4 mb-4 bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-160">Daily goal</span>
          <span className={`font-bold ${totalMin >= goal ? 'text-green-100' : 'text-blue-100'}`}>
            {totalMin} / {goal} min {totalMin >= goal ? '🎉' : ''}
          </span>
        </div>
        <div className="h-3 bg-gray-10 rounded-full overflow-hidden">
          <div className="h-full bg-green-100 rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.round((totalMin / goal) * 100))}%` }} />
        </div>
      </div>

      <ActivityForm onAdd={addActivity} syncing={syncing} />

      {!activities.length
        ? <div className="mx-4 text-center text-gray-100 py-8">No activities yet — go for a walk! 🐕</div>
        : (
          <div className="mx-4 space-y-2">
            {[...activities].reverse().map(e => (
              <div key={e.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-160">{e.type || 'Activity'}</span>
                    <span className="text-green-100 font-bold">{e.minutes} min</span>
                  </div>
                  <div className="text-xs text-gray-100 mt-0.5">
                    {e.distance ? `${e.distance} ${e.distUnit || 'mi'} · ` : ''}
                    {e.ts && new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {e.notes && <p className="text-xs text-gray-100 mt-1 italic">{e.notes}</p>}
                </div>
                <button onClick={() => deleteActivity(e.id)} className="text-gray-50 hover:text-red-100 transition-colors text-lg leading-none">×</button>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

function ActivityForm({ onAdd, syncing }) {
  const EMPTY = { type: 'Walk 🦮', minutes: '', distance: '', distUnit: 'mi', notes: '' }
  const [f, setF] = useState(EMPTY)
  const [open, setOpen] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const quickMins = [15, 30, 45, 60]

  const submit = async () => {
    if (!f.minutes) return
    await onAdd(f)
    setF(EMPTY); setOpen(false)
  }

  return (
    <div className="mx-4 mb-4">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full bg-green-100 text-white rounded-2xl py-3 font-semibold active:bg-green-110">
          + Log Activity
        </button>
      ) : (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-160">Log Activity</h3>
          <select className="input" value={f.type} onChange={e => set('type', e.target.value)}>
            {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>

          <div>
            <p className="text-xs text-gray-100 mb-1">Duration (minutes)</p>
            <div className="flex gap-2">
              {quickMins.map(m => (
                <button key={m} onClick={() => set('minutes', m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-colors
                    ${String(f.minutes) === String(m) ? 'border-green-100 bg-green-10 text-green-100' : 'border-gray-50 text-gray-100'}`}>
                  {m}m
                </button>
              ))}
            </div>
            <input className="input mt-2" type="number" placeholder="Or custom minutes" value={f.minutes}
              onChange={e => set('minutes', e.target.value)} />
          </div>

          <div className="flex gap-2">
            <input className="input flex-1" type="number" placeholder="Distance (optional)" value={f.distance}
              onChange={e => set('distance', e.target.value)} />
            <select className="input w-20" value={f.distUnit} onChange={e => set('distUnit', e.target.value)}>
              <option>mi</option><option>km</option>
            </select>
          </div>
          <textarea className="input resize-none" rows={2} placeholder="Notes…" value={f.notes}
            onChange={e => set('notes', e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={submit} disabled={!f.minutes || syncing} className="btn-primary flex-1 disabled:opacity-50">
              {syncing ? '⏳…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
