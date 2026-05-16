import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { getAuthUser, createRepo, repoExists } from '../utils/github'

const STEPS = ['welcome', 'token', 'repo', 'dog', 'done']

export default function Setup() {
  const { boot } = useApp()
  const [step, setStep]     = useState(0)
  const [form, setForm]     = useState({ token: '', owner: '', dataRepo: 'bheem-data', dogName: 'Bheem', breed: '', weight: '' })
  const [busy, setBusy]     = useState(false)
  const [err,  setErr]      = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validateToken = async () => {
    if (!form.token.trim()) { setErr('Please enter your GitHub token'); return }
    setBusy(true); setErr('')
    try {
      const user = await getAuthUser(form.token.trim())
      set('owner', user.login)
      setStep(2)
    } catch (e) {
      setErr('Token invalid or network error. Make sure it has repo scope.')
    } finally { setBusy(false) }
  }

  const setupRepo = async () => {
    setBusy(true); setErr('')
    try {
      const exists = await repoExists(form.token, form.owner, form.dataRepo)
      if (!exists) await createRepo(form.token, form.dataRepo)
      setStep(3)
    } catch (e) {
      setErr(e.message)
    } finally { setBusy(false) }
  }

  const finish = () => {
    const config = { token: form.token.trim(), owner: form.owner, dataRepo: form.dataRepo }
    localStorage.setItem('bheem_dog', JSON.stringify({ name: form.dogName, breed: form.breed, weight: form.weight }))
    boot(config)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i <= step ? 'bg-blue-100 w-6' : 'bg-gray-50 w-2'}`} />
          ))}
        </div>

        {step === 0 && <Welcome onNext={() => setStep(1)} />}
        {step === 1 && (
          <Step title="GitHub Token 🔑" desc="Create a Personal Access Token with repo scope at github.com → Settings → Developer Settings → PAT → Fine-grained or Classic (repo scope).">
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              value={form.token}
              onChange={e => set('token', e.target.value)}
              className="input"
            />
            {err && <p className="text-red-100 text-sm mt-2">{err}</p>}
            <Btn onClick={validateToken} busy={busy}>Verify Token →</Btn>
          </Step>
        )}
        {step === 2 && (
          <Step title="Data Repository 🗄️" desc={`We'll create a private repo called "${form.dataRepo}" under your account (@${form.owner}) to store all of Bheem's data.`}>
            <input
              placeholder="Repo name"
              value={form.dataRepo}
              onChange={e => set('dataRepo', e.target.value)}
              className="input"
            />
            {err && <p className="text-red-100 text-sm mt-2">{err}</p>}
            <Btn onClick={setupRepo} busy={busy}>Create / Connect Repo →</Btn>
          </Step>
        )}
        {step === 3 && (
          <Step title="Your Pup 🐾" desc="Tell us about your dog!">
            <input placeholder="Dog's name" value={form.dogName} onChange={e => set('dogName', e.target.value)} className="input" />
            <input placeholder="Breed (optional)" value={form.breed} onChange={e => set('breed', e.target.value)} className="input mt-3" />
            <input placeholder="Weight e.g. 45 lbs (optional)" value={form.weight} onChange={e => set('weight', e.target.value)} className="input mt-3" />
            <Btn onClick={() => { if (form.dogName) { setStep(4); finish() } else setErr('Name required!') }} busy={false}>
              Let's go! 🚀
            </Btn>
            {err && <p className="text-red-100 text-sm mt-2">{err}</p>}
          </Step>
        )}
        {step === 4 && (
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🐾</div>
            <h2 className="text-2xl font-bold text-gray-160">Setting up…</h2>
            <p className="text-gray-100 mt-2">Creating data files in GitHub. Just a sec!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Welcome({ onNext }) {
  return (
    <div className="text-center">
      <div className="text-7xl mb-6">🐕</div>
      <h1 className="text-3xl font-bold text-gray-160 mb-3">Bheem's Tracker</h1>
      <p className="text-gray-100 mb-8 leading-relaxed">
        Track food, water, walks, photos, health records & more — all stored securely in your own GitHub repo. 🐙
      </p>
      <button onClick={onNext} className="btn-primary w-full">Get Started →</button>
      <p className="text-gray-100 text-xs mt-4">Your data lives in <em>your</em> private GitHub repo. We store nothing.</p>
    </div>
  )
}

function Step({ title, desc, children }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-160 mb-2">{title}</h2>
      <p className="text-gray-100 text-sm mb-6 leading-relaxed">{desc}</p>
      {children}
    </div>
  )
}

function Btn({ onClick, busy, children }) {
  return (
    <button onClick={onClick} disabled={busy} className="btn-primary w-full mt-6 disabled:opacity-50">
      {busy ? '⏳ Working…' : children}
    </button>
  )
}
