// Date/key helpers

export const toDateKey   = (d = new Date()) => d.toISOString().slice(0, 10)          // 2025-05-16
export const toMonthKey  = (d = new Date()) => d.toISOString().slice(0, 7)          // 2025-05
export const toTimeStr   = (d = new Date()) => d.toTimeString().slice(0, 5)          // 14:27
export const toDisplayDate = (key) => new Date(key + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
export const nowISO      = ()      => new Date().toISOString()
export const uid         = ()      => Math.random().toString(36).slice(2, 9)

export const monthPath   = (monthKey) => `logs/${monthKey}.json`
export const photoPath   = (dateKey, ext = 'jpg') => `photos/${dateKey}.${ext}`
export const SETTINGS_PATH = 'settings.json'
export const TODOS_PATH    = 'todos.json'
export const HEALTH_PATH   = 'health.json'
export const SHOPPING_PATH = 'shopping.json'

// Compress + resize image using Canvas, returns base64 string (no prefix)
export async function compressImage(file, maxPx = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl.split(',')[1]) // strip the data:image/jpeg;base64, prefix
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const DEFAULT_SETTINGS = {
  dog: { name: 'Bheem', breed: '', weight: '', weightUnit: 'lbs', dob: '' },
  food: {
    dailyCalorieGoal: 1200,
    cupSizes: [
      { label: '1/4 cup', ml: 60 },
      { label: '1/3 cup', ml: 79 },
      { label: '1/2 cup', ml: 118 },
      { label: '1 cup',   ml: 237 },
    ],
    brands: [],
  },
  water: { dailyGoalOz: 32 },
  activity: { dailyGoalMin: 60 },
  tasks: {
    daily: [
      { id: 'morning-out',  label: 'Morning walk / potty', emoji: '🌅' },
      { id: 'breakfast',    label: 'Breakfast',            emoji: '🍗' },
      { id: 'midday-out',   label: 'Midday potty',         emoji: '⛅' },
      { id: 'lunch',        label: 'Lunch / midday snack', emoji: '🦴' },
      { id: 'evening-out',  label: 'Evening walk',         emoji: '🌆' },
      { id: 'dinner',       label: 'Dinner',               emoji: '🍖' },
      { id: 'night-out',    label: 'Night potty',          emoji: '🌙' },
      { id: 'water-check',  label: 'Water bowl refill',    emoji: '💧' },
      { id: 'daily-photo',  label: 'Daily photo',          emoji: '📸' },
    ],
  },
}
