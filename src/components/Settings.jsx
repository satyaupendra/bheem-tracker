import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { DEFAULT_SETTINGS } from '../utils/helpers'
import PageHeader from './PageHeader'

export default function Settings() {
  const { settings, saveSettings, syncing } = useApp()
  const [f, setF]     = useState(settings || DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [newCup, setNewCup] = useState({ label: '', ml: '' })

  useEffect(() => { if (settings) setF(settings) }, [settings])

  const set = (path, val) => {
    const keys = path.split('.')
    setF(prev => {
      const copy = JSON.parse(JSON.stringify(prev))
      let obj = copy
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = val
      return copy
    })
  }

  const save = async () => {
    await saveSettings(f)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const addCup = () => {
    if (!newCup.label || !newCup.ml) return
    const cups = [...(f.food?.cupSizes || []), { label: newCup.label, ml: Number(newCup.ml) }]
    set('food.cupSizes', cups)
    setNewCup({ label: '', ml: '' })
  }

  const removeCup = (i) => {
    const cups = f.food.cupSizes.filter((_, idx) => idx !== i)
    set('food.cupSizes', cups)
  }

  const clearData = () => {
    if (window.confirm('Clear all local data? This only removes the local config — GitHub data stays intact.')) {
      localStorage.clear(); window.location.reload()
    }
  }

  return (
    <div>
      <PageHeader title="Settings ⚙️" />

      <div className="mx-4 space-y-4 pb-6">
        {/* Dog profile */}
        <Section title="🐾 Dog Profile">
          <input className="input" placeholder="Name" value={f.dog?.name || ''} onChange={e => set('dog.name', e.target.value)} />
          <input className="input mt-2" placeholder="Breed" value={f.dog?.breed || ''} onChange={e => set('dog.breed', e.target.value)} />
          <div className="flex gap-2 mt-2">
            <input className="input flex-1" placeholder="Weight" value={f.dog?.weight || ''} onChange={e => set('dog.weight', e.target.value)} />
            <select className="input w-20" value={f.dog?.weightUnit || 'lbs'} onChange={e => set('dog.weightUnit', e.target.value)}>
              <option>lbs</option><option>kg</option>
            </select>
          </div>
          <div className="mt-2">
            <label className="text-xs text-gray-100">Date of Birth</label>
            <input type="date" className="input" value={f.dog?.dob || ''} onChange={e => set('dog.dob', e.target.value)} />
          </div>
        </Section>

        {/* Goals */}
        <Section title="🎯 Daily Goals">
          <Label>Daily Calorie Goal</Label>
          <input type="number" className="input" value={f.food?.dailyCalorieGoal || ''} onChange={e => set('food.dailyCalorieGoal', Number(e.target.value))} />
          <Label className="mt-2">Daily Water Goal (oz)</Label>
          <input type="number" className="input" value={f.water?.dailyGoalOz || ''} onChange={e => set('water.dailyGoalOz', Number(e.target.value))} />
          <Label className="mt-2">Daily Activity Goal (minutes)</Label>
          <input type="number" className="input" value={f.activity?.dailyGoalMin || ''} onChange={e => set('activity.dailyGoalMin', Number(e.target.value))} />
        </Section>

        {/* Cup sizes */}
        <Section title="🥄 Measuring Cup Sizes">
          {(f.food?.cupSizes || []).map((c, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <span className="flex-1 text-sm text-gray-160">{c.label} ({c.ml}ml)</span>
              <button onClick={() => removeCup(i)} className="text-gray-50 hover:text-red-100 text-lg">×</button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input className="input flex-1" placeholder="Label (e.g. 3/4 cup)" value={newCup.label} onChange={e => setNewCup(p => ({ ...p, label: e.target.value }))} />
            <input type="number" className="input w-20" placeholder="ml" value={newCup.ml} onChange={e => setNewCup(p => ({ ...p, ml: e.target.value }))} />
            <button onClick={addCup} className="btn-primary px-3">+</button>
          </div>
        </Section>

        {/* Save */}
        <button onClick={save} disabled={syncing}
          className="w-full bg-blue-100 text-white rounded-2xl py-3 font-semibold disabled:opacity-50">
          {syncing ? '⏳ Saving…' : saved ? '✅ Saved!' : 'Save Settings'}
        </button>

        {/* Danger zone */}
        <Section title="⚠️ Danger Zone">
          <button onClick={clearData} className="w-full bg-red-10 text-red-100 border border-red-100 rounded-xl py-2 text-sm font-semibold">
            Reset Local Config (re-run setup)
          </button>
          <p className="text-xs text-gray-100 mt-2 text-center">Your GitHub data is safe — this only clears the local config.</p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="font-bold text-gray-160 mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Label({ children, className = '' }) {
  return <p className={`text-xs text-gray-100 mb-1 ${className}`}>{children}</p>
}
