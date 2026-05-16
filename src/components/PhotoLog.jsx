import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { compressImage } from '../utils/helpers'
import PageHeader from './PageHeader'

export default function PhotoLog() {
  const { selectedDate, getDayLog, uploadPhoto, getPhotoUrl, syncing, settings } = useApp()
  const day = getDayLog(selectedDate)
  const fileRef = useRef(null)
  const [preview, setPreview]  = useState(null)
  const [existing, setExisting] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [err, setErr]           = useState('')
  const dog = settings?.dog || {}

  useEffect(() => {
    setPreview(null); setExisting(null); setLoading(true)
    if (day.photoPath) {
      getPhotoUrl(selectedDate).then(url => {
        setExisting(url)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [selectedDate, day.photoPath, getPhotoUrl])

  const handleFile = async (file) => {
    if (!file) return
    setErr('')
    try {
      const b64 = await compressImage(file, 900, 0.80)
      setPreview('data:image/jpeg;base64,' + b64)
    } catch (e) {
      setErr('Could not load image. Try another file.')
    }
  }

  const save = async () => {
    if (!preview) return
    const b64 = preview.split(',')[1]
    await uploadPhoto(selectedDate, b64)
    setExisting(preview); setPreview(null)
  }

  return (
    <div>
      <PageHeader title={`${dog.name || 'Bheem'}'s Photos 📸`} />
      <div className="mx-4 space-y-4">

        {/* Current / new photo */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {loading && (
            <div className="h-64 flex items-center justify-center text-4xl animate-pulse">📸</div>
          )}
          {!loading && (existing || preview) && (
            <img src={preview || existing} alt="Bheem today"
              className="w-full object-cover max-h-80" />
          )}
          {!loading && !existing && !preview && (
            <div className="h-64 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-50 m-3 rounded-xl">
              <span className="text-5xl">🐕</span>
              <p className="text-gray-100 text-sm">No photo yet for today!</p>
            </div>
          )}
        </div>

        {err && <p className="text-red-100 text-sm text-center">{err}</p>}

        {/* Actions */}
        {preview ? (
          <div className="flex gap-2">
            <button onClick={() => setPreview(null)} className="btn-secondary flex-1">Discard</button>
            <button onClick={save} disabled={syncing} className="btn-primary flex-1 disabled:opacity-50">
              {syncing ? '⏳ Uploading…' : '☁️ Save to GitHub'}
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} className="w-full bg-blue-100 text-white rounded-2xl py-3 font-semibold active:bg-blue-110">
            {existing ? '🔄 Replace Photo' : '📸 Add Today\'s Photo'}
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => handleFile(e.target.files?.[0])} />

        {/* Note */}
        <p className="text-xs text-gray-100 text-center">
          Photos are compressed to ~800px and stored as JPEG in your private GitHub repo.
        </p>
      </div>
    </div>
  )
}
