import { useState } from 'react'
import { useApp } from '../context/AppContext'
import PageHeader from './PageHeader'

const HEALTH_TYPES = [
  { value: 'vet',       label: '🏥 Vet Visit',      color: 'bg-red-10 text-red-100' },
  { value: 'vaccine',   label: '💉 Vaccination',    color: 'bg-blue-10 text-blue-100' },
  { value: 'medicine',  label: '💊 Medicine',        color: 'bg-spark-10 text-spark-140' },
  { value: 'grooming',  label: '✂️ Grooming',        color: 'bg-green-10 text-green-100' },
  { value: 'weight',    label: '⚖️ Weight Check',    color: 'bg-gray-10 text-gray-160' },
  { value: 'other',     label: '📋 Other',           color: 'bg-gray-10 text-gray-100' },
]

const typeInfo = (val) => HEALTH_TYPES.find(t => t.value === val) || HEALTH_TYPES[5]

export default function Health() {
  const { health, addHealth, syncing, settings } = useApp()
  const [open, setOpen]  = useState(false)
  const dog = settings?.dog || {}

  const EMPTY = { type: 'vet', date: new Date().toISOString().slice(0, 10), notes: '', nextDate: '', doctor: '', vaccine: '', weight: '' }
  const [f, setF] = useState(EMPTY)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const submit = async () => {
    await addHealth(f)
    setF(EMPTY); setOpen(false)
  }

  // Sort newest first
  const sorted = [...health].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div>
      <PageHeader title={`${dog.name || 'Bheem'}'s Health 💉`} />

      <div className="mx-4 space-y-4">
        {/* Add button */}
        {!open && (
          <button onClick={() => setOpen(true)}
            className="w-full bg-red-100 text-white rounded-2xl py-3 font-semibold active:opacity-90">
            + Add Health Record
          </button>
        )}

        {open && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-160">New Health Record</h3>
            <div className="grid grid-cols-2 gap-2">
              <select className="input col-span-2" value={f.type} onChange={e => set('type', e.target.value)}>
                {HEALTH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <div>
                <label className="text-xs text-gray-100">Date</label>
                <input type="date" className="input" value={f.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-100">Next due (optional)</label>
                <input type="date" className="input" value={f.nextDate} onChange={e => set('nextDate', e.target.value)} />
              </div>
            </div>
            {f.type === 'vaccine' && (
              <input className="input" placeholder="Vaccine name (e.g. Rabies, DHPP)" value={f.vaccine}
                onChange={e => set('vaccine', e.target.value)} />
            )}
            {f.type === 'weight' && (
              <input className="input" type="number" placeholder={`Weight (${dog.weightUnit || 'lbs'})`}
                value={f.weight} onChange={e => set('weight', e.target.value)} />
            )}
            {(f.type === 'vet' || f.type === 'medicine') && (
              <input className="input" placeholder="Doctor / clinic name" value={f.doctor}
                onChange={e => set('doctor', e.target.value)} />
            )}
            <textarea className="input resize-none" rows={3} placeholder="Notes, diagnosis, dosage…"
              value={f.notes} onChange={e => set('notes', e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submit} disabled={syncing} className="btn-primary flex-1 disabled:opacity-50">
                {syncing ? '⏳…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Upcoming reminders */}
        {(() => {
          const upcoming = sorted.filter(r => r.nextDate && new Date(r.nextDate) >= new Date())
            .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate))
          if (!upcoming.length) return null
          return (
            <div className="bg-spark-10 border border-spark-100 rounded-2xl p-4">
              <h3 className="font-bold text-spark-140 mb-2">⏰ Upcoming</h3>
              {upcoming.map(r => (
                <div key={r.id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-160">{typeInfo(r.type).label}{r.vaccine ? ` – ${r.vaccine}` : ''}</span>
                  <span className="text-spark-140 font-medium">{new Date(r.nextDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Timeline */}
        {sorted.length === 0 ? (
          <div className="text-center text-gray-100 py-8">
            <p className="text-3xl mb-2">💉</p>
            <p className="text-sm">No health records yet. Track vet visits, vaccines & more!</p>
          </div>
        ) : sorted.map(r => {
          const info = typeInfo(r.type)
          return (
            <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${info.color}`}>
                  {info.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-gray-160">
                      {r.vaccine || r.doctor || r.type}
                    </p>
                    <span className="text-xs text-gray-100 ml-2">{r.date}</span>
                  </div>
                  {r.weight && <p className="text-sm text-gray-100 mt-0.5">⚖️ {r.weight} {dog.weightUnit || 'lbs'}</p>}
                  {r.notes && <p className="text-sm text-gray-100 mt-1">{r.notes}</p>}
                  {r.nextDate && <p className="text-xs text-spark-140 mt-1">⏰ Next: {r.nextDate}</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
