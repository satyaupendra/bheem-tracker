import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { toTimeStr } from '../utils/helpers'
import PageHeader from './PageHeader'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Treat']
const CUP_SIZES  = [{ label: '1/4 cup', ml: 60 }, { label: '1/3 cup', ml: 79 }, { label: '1/2 cup', ml: 118 }, { label: '1 cup', ml: 237 }]

export default function FoodLog() {
  const { getDayLog, addFood, addWater, deleteFood, settings, selectedDate, syncing } = useApp()
  const day = getDayLog(selectedDate)
  const cups = settings?.food?.cupSizes || CUP_SIZES

  const [tab, setTab]  = useState('food')

  const totalCal   = (day.food  || []).reduce((s, e) => s + (Number(e.calories) || 0), 0)
  const totalWater = (day.water || []).reduce((s, e) => s + (Number(e.oz)       || 0), 0)

  return (
    <div>
      <PageHeader title="Food & Water 🍖" />

      {/* Tab bar */}
      <div className="flex mx-4 bg-gray-10 rounded-xl p-1 mb-4">
        {['food', 'water'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors
              ${tab === t ? 'bg-white text-blue-100 shadow-sm' : 'text-gray-100'}`}>
            {t === 'food' ? `🍖 Food (${totalCal} cal)` : `💧 Water (${totalWater} oz)`}
          </button>
        ))}
      </div>

      {tab === 'food' && (
        <>
          <FoodForm onAdd={addFood} cups={cups} syncing={syncing} />
          <LogList entries={day.food || []} onDelete={deleteFood}
            renderItem={e => (
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-160 truncate">{e.name || 'Meal'}</span>
                  <span className="text-gray-100 text-sm ml-2">{e.calories ? `${e.calories} cal` : ''}</span>
                </div>
                <div className="text-xs text-gray-100 mt-0.5">
                  {e.mealType}{e.cups ? ` · ${e.cups} cup(s)` : ''}{e.grams ? ` · ${e.grams}g` : ''}
                  {e.ts && ` · ${new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </div>
                {e.notes && <p className="text-xs text-gray-100 mt-0.5 italic">{e.notes}</p>}
              </div>
            )} />
        </>
      )}
      {tab === 'water' && (
        <>
          <WaterForm onAdd={addWater} syncing={syncing} goal={settings?.water?.dailyGoalOz || 32} total={totalWater} />
          <LogList entries={day.water || []} onDelete={() => {}}
            renderItem={e => (
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-160">💧 Water</span>
                  <span className="text-blue-100 font-semibold">{e.oz} oz</span>
                </div>
                {e.ts && <p className="text-xs text-gray-100 mt-0.5">{new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
              </div>
            )} />
        </>
      )}
    </div>
  )
}

function FoodForm({ onAdd, cups, syncing }) {
  const EMPTY = { name: '', mealType: 'Breakfast', calories: '', cups: '', grams: '', notes: '' }
  const [f, setF] = useState(EMPTY)
  const [open, setOpen] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!f.name) return
    await onAdd(f)
    setF(EMPTY); setOpen(false)
  }

  return (
    <div className="mx-4 mb-4">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full bg-blue-100 text-white rounded-2xl py-3 font-semibold active:bg-blue-110">
          + Log Food
        </button>
      ) : (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-160">Log a Meal</h3>
          <input className="input" placeholder="Food name (e.g. Royal Canin)" value={f.name} onChange={e => set('name', e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={f.mealType} onChange={e => set('mealType', e.target.value)}>
              {MEAL_TYPES.map(m => <option key={m}>{m}</option>)}
            </select>
            <input className="input" type="number" placeholder="Calories" value={f.calories} onChange={e => set('calories', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={f.cups} onChange={e => set('cups', e.target.value)}>
              <option value="">Measuring cup…</option>
              {cups.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
              <option value="eyeball">👀 Eyeballing it</option>
            </select>
            <input className="input" type="number" placeholder="Weight (g)" value={f.grams} onChange={e => set('grams', e.target.value)} />
          </div>
          <textarea className="input resize-none" rows={2} placeholder="Notes…" value={f.notes} onChange={e => set('notes', e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={submit} disabled={!f.name || syncing} className="btn-primary flex-1 disabled:opacity-50">
              {syncing ? '⏳…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function WaterForm({ onAdd, syncing, goal, total }) {
  const pct = Math.min(100, Math.round((total / goal) * 100))
  const [oz, setOz] = useState('')
  const quick = [4, 8, 12, 16]

  const add = async (amount) => {
    await onAdd({ oz: Number(amount) })
    setOz('')
  }

  return (
    <div className="mx-4 mb-4 bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-160">Daily goal</span>
          <span className="font-bold text-blue-100">{total} / {goal} oz</span>
        </div>
        <div className="h-3 bg-gray-10 rounded-full overflow-hidden">
          <div className="h-full bg-blue-100 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex gap-2">
        {quick.map(q => (
          <button key={q} onClick={() => add(q)} disabled={syncing}
            className="flex-1 bg-blue-10 text-blue-100 text-sm font-bold py-2 rounded-xl active:bg-blue-50">
            {q}oz
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="input flex-1" type="number" placeholder="Custom oz" value={oz} onChange={e => setOz(e.target.value)} />
        <button onClick={() => oz && add(oz)} disabled={!oz || syncing} className="btn-primary px-4 disabled:opacity-50">+</button>
      </div>
    </div>
  )
}

function LogList({ entries, onDelete, renderItem }) {
  if (!entries.length) return (
    <div className="mx-4 text-center text-gray-100 py-8">Nothing logged yet! 🐾</div>
  )
  return (
    <div className="mx-4 space-y-2">
      {[...entries].reverse().map(e => (
        <div key={e.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-start gap-3">
          {renderItem(e)}
          {onDelete && (
            <button onClick={() => onDelete(e.id)} className="text-gray-50 hover:text-red-100 transition-colors text-lg leading-none flex-shrink-0">×</button>
          )}
        </div>
      ))}
    </div>
  )
}
